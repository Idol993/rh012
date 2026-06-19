import { Router, type Request, type Response } from 'express'
import { queryAll, queryOne, run } from '../database.js'

const router = Router()

const TIER_THRESHOLDS: Record<string, number> = {
  silver: 10000,
  gold: 25000,
  platinum: 50000,
  diamond: Infinity,
}

const TIER_ORDER = ['silver', 'gold', 'platinum', 'diamond']

router.post('/checkin', async (req: Request, res: Response): Promise<void> => {
  try {
    const { reservationId, faceVerified, keyType } = req.body

    if (!reservationId) {
      res.status(400).json({ success: false, error: '缺少预订ID' })
      return
    }

    const reservation = queryOne<{
      id: number; guest_id: number; room_id: number | null;
      status: string; member_id: number | null
    }>('SELECT * FROM reservations WHERE id = ?', [reservationId])

    if (!reservation) {
      res.status(404).json({ success: false, error: '预订不存在' })
      return
    }

    if (reservation.status === 'checked_in') {
      res.status(400).json({ success: false, error: '该预订已入住' })
      return
    }

    if (!reservation.room_id) {
      res.status(400).json({ success: false, error: '该预订尚未分配房间，请先排房' })
      return
    }

    const faceOk = faceVerified !== false
    if (!faceOk) {
      run('UPDATE guests SET face_verified = 0 WHERE id = ?', [reservation.guest_id])
      res.status(400).json({ success: false, error: '人脸验证未通过' })
      return
    }

    run('UPDATE guests SET face_verified = 1 WHERE id = ?', [reservation.guest_id])

    const selectedKeyType = keyType || 'card'
    const keyCode = 'KEY' + Date.now().toString(36).toUpperCase()

    run(
      "UPDATE reservations SET status = 'checked_in', key_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [selectedKeyType, reservationId]
    )
    run("UPDATE rooms SET status = 'occupied' WHERE id = ?", [reservation.room_id])

    const room = queryOne<{ room_number: string }>('SELECT room_number FROM rooms WHERE id = ?', [reservation.room_id])

    res.json({
      success: true,
      data: {
        roomNumber: room!.room_number,
        keyInfo: { type: selectedKeyType, code: keyCode },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '入住办理失败' })
  }
})

router.post('/checkout', async (req: Request, res: Response): Promise<void> => {
  try {
    const { reservationId } = req.body

    if (!reservationId) {
      res.status(400).json({ success: false, error: '缺少预订ID' })
      return
    }

    const reservation = queryOne<{
      id: number; guest_id: number; room_id: number | null;
      status: string; member_id: number | null; total_amount: number
    }>('SELECT * FROM reservations WHERE id = ?', [reservationId])

    if (!reservation) {
      res.status(404).json({ success: false, error: '预订不存在' })
      return
    }

    if (reservation.status !== 'checked_in') {
      res.status(400).json({ success: false, error: '该预订未入住，无法退房' })
      return
    }

    const roomId = reservation.room_id!

    const minibarConsumed = queryAll<{ price: number }>(
      'SELECT price FROM minibar_items WHERE room_id = ? AND consumed = 1',
      [roomId]
    )
    const minibarTotal = minibarConsumed.reduce((sum, item) => sum + item.price, 0)

    const roomTotal = reservation.total_amount
    const totalBill = roomTotal + minibarTotal

    const invoiceUrl = `/invoices/INV${Date.now()}.pdf`
    run(
      'INSERT INTO bills (reservation_id, total, invoice_url) VALUES (?, ?, ?)',
      [reservationId, totalBill, invoiceUrl]
    )

    const bill = queryOne<{ id: number }>('SELECT id FROM bills WHERE reservation_id = ? ORDER BY created_at DESC LIMIT 1', [reservationId])

    run(
      'INSERT INTO bill_items (bill_id, category, description, amount) VALUES (?, ?, ?, ?)',
      [bill!.id, 'room', '房费', roomTotal]
    )

    if (minibarTotal > 0) {
      run(
        'INSERT INTO bill_items (bill_id, category, description, amount) VALUES (?, ?, ?, ?)',
        [bill!.id, 'minibar', '迷你吧消费', minibarTotal]
      )
    }

    run(
      "UPDATE reservations SET status = 'checked_out', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [reservationId]
    )
    run("UPDATE rooms SET status = 'cleaning' WHERE id = ?", [roomId])

    let pointsEarned = Math.floor(totalBill / 10)
    let memberUpgraded = false
    let newTier: string | undefined

    if (reservation.member_id) {
      const member = queryOne<{ id: number; tier: string; points: number; total_spent: number; stay_count: number }>(
        'SELECT * FROM members WHERE id = ?', [reservation.member_id]
      )

      if (member) {
        const newPoints = member.points + pointsEarned
        const newTotalSpent = member.total_spent + totalBill
        const newStayCount = member.stay_count + 1

        const currentTierIdx = TIER_ORDER.indexOf(member.tier)
        let finalTier = member.tier

        for (let i = TIER_ORDER.length - 1; i > currentTierIdx; i--) {
          if (newPoints >= TIER_THRESHOLDS[TIER_ORDER[i - 1]]) {
            finalTier = TIER_ORDER[i]
            break
          }
        }

        if (finalTier !== member.tier) {
          memberUpgraded = true
          newTier = finalTier
        }

        run(
          'UPDATE members SET points = ?, total_spent = ?, stay_count = ?, tier = ? WHERE id = ?',
          [newPoints, newTotalSpent, newStayCount, finalTier, member.id]
        )
      }
    }

    res.json({
      success: true,
      data: {
        totalBill,
        invoiceUrl,
        pointsEarned,
        memberUpgraded,
        newTier,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '退房办理失败' })
  }
})

export default router
