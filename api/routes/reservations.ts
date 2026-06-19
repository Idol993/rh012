import { Router, type Request, type Response } from 'express'
import { queryAll, queryOne, run } from '../database.js'

const router = Router()

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const reservations = queryAll(
      `SELECT r.id, r.guest_id, r.member_id, r.room_id, r.status, r.check_in, r.check_out,
              r.room_type, r.preferences, r.total_amount, r.key_type, r.created_at,
              g.name as guest_name, g.phone as guest_phone,
              m.name as member_name, m.tier as member_tier,
              rm.room_number
       FROM reservations r
       LEFT JOIN guests g ON r.guest_id = g.id
       LEFT JOIN members m ON r.member_id = m.id
       LEFT JOIN rooms rm ON r.room_id = rm.id
       ORDER BY r.created_at DESC`
    )
    const data = reservations.map((r: any) => ({
      id: r.id,
      guestId: r.guest_id,
      guestName: r.guest_name,
      phone: r.guest_phone,
      memberId: r.member_id,
      memberName: r.member_name,
      memberTier: r.member_tier,
      roomId: r.room_id,
      roomNumber: r.room_number,
      checkIn: r.check_in,
      checkOut: r.check_out,
      roomType: r.room_type,
      status: r.status,
      preferences: JSON.parse(r.preferences || '[]'),
      totalAmount: r.total_amount,
      keyType: r.key_type,
      createdAt: r.created_at,
    }))
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取预订列表失败' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { guestName, memberId, phone, checkIn, checkOut, roomType, preferences } = req.body

    if (!guestName || !phone || !checkIn || !checkOut || !roomType) {
      res.status(400).json({ success: false, error: '缺少必要参数' })
      return
    }

    let guestId: number | null = null

    const existingGuest = queryOne<{ id: number }>(
      'SELECT id FROM guests WHERE phone = ?',
      [phone]
    )

    if (existingGuest) {
      guestId = existingGuest.id
    } else {
      const idNumber = 'GEN' + Date.now()
      run(
        'INSERT INTO guests (name, phone, id_number, member_id) VALUES (?, ?, ?, ?)',
        [guestName, phone, idNumber, memberId || null]
      )
      const newGuest = queryOne<{ id: number }>('SELECT id FROM guests WHERE id_number = ?', [idNumber])
      guestId = newGuest!.id
    }

    const prefsJson = JSON.stringify(preferences || [])
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))

    const priceRow = queryOne<{ price: number }>(
      "SELECT MIN(price_per_night) as price FROM rooms WHERE room_type = ?",
      [roomType]
    )
    const totalAmount = (priceRow?.price || 988) * nights

    run(
      `INSERT INTO reservations (guest_id, member_id, room_id, status, check_in, check_out, room_type, preferences, total_amount)
       VALUES (?, ?, NULL, 'pending', ?, ?, ?, ?, ?)`,
      [guestId, memberId || null, checkIn, checkOut, roomType, prefsJson, totalAmount]
    )

    const newReservation = queryOne<{ id: number }>(
      'SELECT id FROM reservations WHERE guest_id = ? ORDER BY created_at DESC LIMIT 1',
      [guestId]
    )

    res.status(201).json({
      success: true,
      data: {
        id: newReservation!.id,
        guestId,
        checkIn,
        checkOut,
        roomType,
        preferences: preferences || [],
        totalAmount,
        status: 'pending',
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建预订失败' })
  }
})

router.post('/:id/auto-assign', async (req: Request, res: Response): Promise<void> => {
  try {
    const reservationId = Number(req.params.id)

    const reservation = queryOne<{
      id: number; member_id: number | null; room_type: string;
      preferences: string; room_id: number | null
    }>('SELECT * FROM reservations WHERE id = ?', [reservationId])

    if (!reservation) {
      res.status(404).json({ success: false, error: '预订不存在' })
      return
    }

    if (reservation.room_id) {
      res.status(400).json({ success: false, error: '该预订已分配房间' })
      return
    }

    const prefs = JSON.parse(reservation.preferences || '[]') as string[]

    let memberPrefs: Record<string, string> = {}
    if (reservation.member_id) {
      const mpRows = queryAll<{ preference_key: string; preference_value: string }>(
        'SELECT preference_key, preference_value FROM member_preferences WHERE member_id = ?',
        [reservation.member_id]
      )
      mpRows.forEach(row => {
        memberPrefs[row.preference_key] = row.preference_value
      })
    }

    const wantsHighFloor = prefs.includes('high_floor') || memberPrefs.floor === 'high'
    const wantsNonSmoking = prefs.includes('non_smoking') || memberPrefs.smoking === 'non-smoking'
    const wantsFirmPillow = prefs.includes('firm_pillow') || memberPrefs.pillow === 'firm'
    const wantsLowFloor = prefs.includes('low_floor') || memberPrefs.floor === 'low'

    const availableRooms = queryAll<{
      id: number; room_number: string; floor: number; room_type: string;
      is_smoking: number; has_firm_pillow: number; price_per_night: number
    }>(
      "SELECT id, room_number, floor, room_type, is_smoking, has_firm_pillow, price_per_night FROM rooms WHERE status = 'available' AND room_type = ?",
      [reservation.room_type]
    )

    if (availableRooms.length === 0) {
      res.status(404).json({ success: false, error: '没有可用的匹配房间' })
      return
    }

    const scored = availableRooms.map(room => {
      let score = 50
      const matchDetails: { preference: string; matched: boolean }[] = []

      if (wantsHighFloor) {
        const matched = room.floor >= 5
        score += matched ? 20 : -5
        matchDetails.push({ preference: 'high_floor', matched })
      } else if (wantsLowFloor) {
        const matched = room.floor <= 3
        score += matched ? 20 : -5
        matchDetails.push({ preference: 'low_floor', matched })
      }

      if (wantsNonSmoking) {
        const matched = !room.is_smoking
        score += matched ? 20 : -10
        matchDetails.push({ preference: 'non_smoking', matched })
      }

      if (wantsFirmPillow) {
        const matched = !!room.has_firm_pillow
        score += matched ? 10 : 0
        matchDetails.push({ preference: 'firm_pillow', matched })
      }

      return { room, score: Math.min(100, Math.max(0, score)), matchDetails }
    })

    scored.sort((a, b) => b.score - a.score)
    const best = scored[0]

    run('UPDATE reservations SET room_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [best.room.id, 'confirmed', reservationId])

    res.json({
      success: true,
      data: {
        roomId: best.room.id,
        roomNumber: best.room.room_number,
        matchScore: best.score,
        matchDetails: best.matchDetails,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '自动排房失败' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const reservationId = Number(req.params.id)
    const { checkIn, checkOut, status, preferences, roomId } = req.body

    const reservation = queryOne<{ id: number }>('SELECT id FROM reservations WHERE id = ?', [reservationId])
    if (!reservation) {
      res.status(404).json({ success: false, error: '预订不存在' })
      return
    }

    const parts: string[] = []
    const params: (string | number | boolean | null)[] = []

    if (checkIn) { parts.push('check_in = ?'); params.push(checkIn) }
    if (checkOut) { parts.push('check_out = ?'); params.push(checkOut) }
    if (status) { parts.push('status = ?'); params.push(status) }
    if (preferences) { parts.push('preferences = ?'); params.push(JSON.stringify(preferences)) }
    if (roomId) { parts.push('room_id = ?'); params.push(roomId) }

    if (parts.length === 0) {
      res.status(400).json({ success: false, error: '没有需要更新的字段' })
      return
    }

    parts.push("updated_at = CURRENT_TIMESTAMP")
    params.push(reservationId)
    run(`UPDATE reservations SET ${parts.join(', ')} WHERE id = ?`, params)

    res.json({ success: true, data: { id: reservationId } })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新预订失败' })
  }
})

export default router
