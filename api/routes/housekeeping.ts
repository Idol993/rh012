import { Router, type Request, type Response } from 'express'
import { queryAll, queryOne, run } from '../database.js'

const router = Router()

router.get('/tasks', async (_req: Request, res: Response): Promise<void> => {
  try {
    const tasks = queryAll(
      `SELECT ht.id, ht.room_id, ht.type, ht.priority, ht.status, ht.assigned_to,
              ht.created_at, ht.completed_at, ht.quality_score,
              rm.room_number, rm.floor,
              e.name as assigned_name
       FROM housekeeping_tasks ht
       LEFT JOIN rooms rm ON ht.room_id = rm.id
       LEFT JOIN employees e ON ht.assigned_to = e.id
       ORDER BY ht.created_at DESC`
    )
    const data = tasks.map((t: any) => ({
      id: t.id,
      roomId: t.room_id,
      roomNumber: t.room_number,
      floor: t.floor,
      type: t.type,
      priority: t.priority,
      status: t.status,
      assignedTo: t.assigned_to ? { id: t.assigned_to, name: t.assigned_name } : null,
      createdAt: t.created_at,
      completedAt: t.completed_at || undefined,
      qualityScore: t.quality_score,
    }))
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取保洁任务列表失败' })
  }
})

router.post('/scan-clean', async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId, staffId, qualityScore } = req.body

    if (!roomId || !staffId) {
      res.status(400).json({ success: false, error: '缺少必要参数' })
      return
    }

    const room = queryOne<{ id: number; room_number: string; status: string }>(
      'SELECT id, room_number, status FROM rooms WHERE id = ?', [roomId]
    )

    if (!room) {
      res.status(404).json({ success: false, error: '房间不存在' })
      return
    }

    if (room.status !== 'cleaning' && room.status !== 'occupied') {
      res.status(400).json({ success: false, error: '该房间不需要清洁（当前状态：' + room.status + '）' })
      return
    }

    const score = qualityScore || 95

    run(
      "UPDATE rooms SET status = 'available', last_cleaned_at = CURRENT_TIMESTAMP WHERE id = ?",
      [roomId]
    )

    run(
      `UPDATE housekeeping_tasks SET status = 'completed', quality_score = ?, completed_at = CURRENT_TIMESTAMP
       WHERE room_id = ? AND status = 'in_progress'`,
      [score, roomId]
    )

    res.json({
      success: true,
      data: {
        roomStatus: 'available' as const,
        message: `房间 ${room.room_number} 已完成清洁，状态更新为可用，已通知前台`,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '扫码净房失败' })
  }
})

router.put('/tasks/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = Number(req.params.id)
    const { status, assignedTo } = req.body

    const existing = queryOne<{ id: number }>('SELECT id FROM housekeeping_tasks WHERE id = ?', [taskId])
    if (!existing) {
      res.status(404).json({ success: false, error: '任务不存在' })
      return
    }

    const parts: string[] = []
    const params: (string | number | boolean | null)[] = []

    if (status) {
      const validStatuses = ['pending', 'in_progress', 'completed']
      if (!validStatuses.includes(status)) {
        res.status(400).json({ success: false, error: '无效的任务状态' })
        return
      }
      parts.push('status = ?')
      params.push(status)

      if (status === 'completed') {
        parts.push('completed_at = CURRENT_TIMESTAMP')
      }
    }

    if (assignedTo !== undefined) {
      parts.push('assigned_to = ?')
      params.push(assignedTo)
    }

    if (parts.length === 0) {
      res.status(400).json({ success: false, error: '没有需要更新的字段' })
      return
    }

    params.push(taskId)
    run(`UPDATE housekeeping_tasks SET ${parts.join(', ')} WHERE id = ?`, params)

    if (status === 'in_progress') {
      const task = queryOne<{ room_id: number }>('SELECT room_id FROM housekeeping_tasks WHERE id = ?', [taskId])
      if (task) {
        run("UPDATE rooms SET status = 'cleaning' WHERE id = ?", [task.room_id])
      }
    }

    res.json({ success: true, data: { id: taskId } })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新任务失败' })
  }
})

router.post('/tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId, type, priority, assignedTo } = req.body

    if (!roomId || !type) {
      res.status(400).json({ success: false, error: '缺少必要参数' })
      return
    }

    const validTypes = ['checkout_clean', 'daily_clean', 'deep_clean']
    if (!validTypes.includes(type)) {
      res.status(400).json({ success: false, error: '无效的任务类型' })
      return
    }

    run(
      'INSERT INTO housekeeping_tasks (room_id, assigned_to, type, priority, status) VALUES (?, ?, ?, ?, ?)',
      [roomId, assignedTo || null, type, priority || 'medium', 'pending']
    )

    const newTask = queryOne<{ id: number }>(
      'SELECT id FROM housekeeping_tasks WHERE room_id = ? ORDER BY created_at DESC LIMIT 1',
      [roomId]
    )

    res.status(201).json({
      success: true,
      data: {
        id: newTask!.id,
        roomId,
        type,
        priority: priority || 'medium',
        status: 'pending',
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建保洁任务失败' })
  }
})

export default router
