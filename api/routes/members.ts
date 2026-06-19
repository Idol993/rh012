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

function getNextTierThreshold(tier: string): number {
  return TIER_THRESHOLDS[tier] ?? 10000
}

function getProgressToNextTier(tier: string, points: number): number {
  const thresholds: Record<string, { min: number; max: number }> = {
    silver: { min: 0, max: 10000 },
    gold: { min: 10000, max: 25000 },
    platinum: { min: 25000, max: 50000 },
    diamond: { min: 50000, max: 100000 },
  }
  const range = thresholds[tier]
  if (!range) return 100
  if (range.max === Infinity) return 100
  const progress = (points - range.min) / (range.max - range.min) * 100
  return Math.min(100, Math.max(0, Math.round(progress)))
}

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const members = queryAll<{
      id: number; name: string; phone: string; tier: string;
      points: number; total_spent: number; stay_count: number; created_at: string
    }>('SELECT * FROM members ORDER BY total_spent DESC')

    const data = members.map(m => {
      const prefs = queryAll<{ preference_key: string; preference_value: string }>(
        'SELECT preference_key, preference_value FROM member_preferences WHERE member_id = ?',
        [m.id]
      )

      const lastStay = queryOne<{ check_out: string }>(
        "SELECT check_out FROM reservations WHERE member_id = ? AND status = 'checked_out' ORDER BY check_out DESC LIMIT 1",
        [m.id]
      )

      const nextThreshold = getNextTierThreshold(m.tier)

      return {
        id: m.id,
        name: m.name,
        phone: m.phone,
        tier: m.tier,
        points: m.points,
        totalSpent: m.total_spent,
        preferences: prefs.map(p => `${p.preference_key}:${p.preference_value}`),
        stayCount: m.stay_count,
        lastStay: lastStay?.check_out || undefined,
        nextTierThreshold: nextThreshold,
        progressToNextTier: getProgressToNextTier(m.tier, m.points),
      }
    })

    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取会员列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const memberId = Number(req.params.id)

    const member = queryOne<{
      id: number; name: string; phone: string; tier: string;
      points: number; total_spent: number; stay_count: number; created_at: string
    }>('SELECT * FROM members WHERE id = ?', [memberId])

    if (!member) {
      res.status(404).json({ success: false, error: '会员不存在' })
      return
    }

    const prefs = queryAll<{ preference_key: string; preference_value: string }>(
      'SELECT preference_key, preference_value FROM member_preferences WHERE member_id = ?',
      [memberId]
    )

    const spendHistory = queryAll<{ check_in: string; check_out: string; total_amount: number; room_type: string }>(
      "SELECT check_in, check_out, total_amount, room_type FROM reservations WHERE member_id = ? AND status IN ('checked_out', 'checked_in') ORDER BY created_at DESC",
      [memberId]
    )

    const nextThreshold = getNextTierThreshold(member.tier)

    res.json({
      success: true,
      data: {
        id: member.id,
        name: member.name,
        phone: member.phone,
        tier: member.tier,
        points: member.points,
        totalSpent: member.total_spent,
        stayCount: member.stay_count,
        preferences: prefs.map(p => ({ key: p.preference_key, value: p.preference_value })),
        spendHistory: spendHistory.map(s => ({
          checkIn: s.check_in,
          checkOut: s.check_out,
          amount: s.total_amount,
          roomType: s.room_type,
        })),
        nextTierThreshold: nextThreshold,
        progressToNextTier: getProgressToNextTier(member.tier, member.points),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取会员详情失败' })
  }
})

router.put('/:id/preferences', async (req: Request, res: Response): Promise<void> => {
  try {
    const memberId = Number(req.params.id)
    const { preferences } = req.body

    if (!preferences || !Array.isArray(preferences)) {
      res.status(400).json({ success: false, error: '偏好数据格式不正确' })
      return
    }

    const member = queryOne<{ id: number }>('SELECT id FROM members WHERE id = ?', [memberId])
    if (!member) {
      res.status(404).json({ success: false, error: '会员不存在' })
      return
    }

    run('DELETE FROM member_preferences WHERE member_id = ?', [memberId])

    const prefMap: Record<string, string> = {}
    for (const pref of preferences) {
      if (typeof pref === 'string' && pref.includes(':')) {
        const [key, value] = pref.split(':')
        prefMap[key.trim()] = value.trim()
      } else if (typeof pref === 'object' && pref.key && pref.value) {
        prefMap[pref.key] = pref.value
      }
    }

    for (const [key, value] of Object.entries(prefMap)) {
      run(
        'INSERT INTO member_preferences (member_id, preference_key, preference_value) VALUES (?, ?, ?)',
        [memberId, key, value]
      )
    }

    const updatedPrefs = queryAll<{ preference_key: string; preference_value: string }>(
      'SELECT preference_key, preference_value FROM member_preferences WHERE member_id = ?',
      [memberId]
    )

    res.json({
      success: true,
      data: {
        id: memberId,
        preferences: updatedPrefs.map(p => ({ key: p.preference_key, value: p.preference_value })),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新会员偏好失败' })
  }
})

export default router
