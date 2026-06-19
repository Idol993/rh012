import { Router, type Request, type Response } from 'express'
import { queryAll, queryOne, run } from '../database.js'

const router = Router()

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const requests = queryAll(
      `SELECT sr.id, sr.room_id, sr.type, sr.description, sr.priority, sr.status,
              sr.assigned_to, sr.created_at, sr.completed_at,
              rm.room_number,
              e.name as assigned_name
       FROM service_requests sr
       LEFT JOIN rooms rm ON sr.room_id = rm.id
       LEFT JOIN employees e ON sr.assigned_to = e.id
       ORDER BY sr.created_at DESC`
    )
    const data = requests.map((r: any) => ({
      id: r.id,
      roomId: r.room_id,
      roomNumber: r.room_number,
      type: r.type,
      description: r.description,
      priority: r.priority,
      status: r.status,
      assignedTo: r.assigned_to ? { id: r.assigned_to, name: r.assigned_name, distance: `${Math.floor(Math.random() * 30 + 5)}m` } : null,
      createdAt: r.created_at,
      completedAt: r.completed_at || undefined,
    }))
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取服务请求列表失败' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId, type, description, priority } = req.body

    if (!roomId || !type) {
      res.status(400).json({ success: false, error: '缺少必要参数' })
      return
    }

    const validTypes = ['water', 'towel', 'cleaning', 'maintenance', 'other']
    if (!validTypes.includes(type)) {
      res.status(400).json({ success: false, error: '无效的服务类型' })
      return
    }

    run(
      'INSERT INTO service_requests (room_id, type, description, priority, status) VALUES (?, ?, ?, ?, ?)',
      [roomId, type, description || '', priority || 'medium', 'pending']
    )

    const newRequest = queryOne<{ id: number }>(
      'SELECT id FROM service_requests WHERE room_id = ? ORDER BY created_at DESC LIMIT 1',
      [roomId]
    )

    res.status(201).json({
      success: true,
      data: {
        id: newRequest!.id,
        roomId,
        type,
        description: description || '',
        priority: priority || 'medium',
        status: 'pending',
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建服务请求失败' })
  }
})

router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const requestId = Number(req.params.id)
    const { status } = req.body

    const validStatuses = ['pending', 'assigned', 'in_progress', 'completed']
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: '无效的状态' })
      return
    }

    const existing = queryOne<{ id: number; type: string; room_id: number }>('SELECT id, type, room_id FROM service_requests WHERE id = ?', [requestId])
    if (!existing) {
      res.status(404).json({ success: false, error: '服务请求不存在' })
      return
    }

    if (status === 'completed') {
      run(
        "UPDATE service_requests SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, requestId]
      )
    } else {
      run('UPDATE service_requests SET status = ? WHERE id = ?', [status, requestId])
    }

    if (existing.type === 'maintenance') {
      if (status === 'assigned') {
        run('UPDATE rooms SET status = ? WHERE id = ?', ['maintenance', existing.room_id])
      } else if (status === 'completed') {
        run('UPDATE rooms SET status = ? WHERE id = ?', ['occupied', existing.room_id])
      }
    }

    res.json({ success: true, data: { id: requestId, status } })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新服务请求状态失败' })
  }
})

router.post('/auto-dispatch', async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.body

    let pendingRequests: { id: number; room_id: number; type: string }[]

    if (requestId) {
      const single = queryOne<{ id: number; room_id: number; type: string }>(
        "SELECT id, room_id, type FROM service_requests WHERE id = ? AND status = 'pending'",
        [requestId]
      )
      if (!single) {
        res.status(404).json({ success: false, error: '未找到该待处理请求' })
        return
      }
      pendingRequests = [single]
    } else {
      pendingRequests = queryAll<{ id: number; room_id: number; type: string }>(
        "SELECT id, room_id, type FROM service_requests WHERE status = 'pending' ORDER BY created_at ASC"
      )
    }

    if (pendingRequests.length === 0) {
      res.json({ success: true, data: { dispatched: [], message: '没有待派工的请求' } })
      return
    }

    const availableStaff = queryAll<{ id: number; name: string }>(
      "SELECT id, name FROM employees WHERE role = 'staff'"
    )

    if (availableStaff.length === 0) {
      res.status(400).json({ success: false, error: '没有可用的服务人员' })
      return
    }

    const dispatched: { requestId: number; assignedStaff: { id: number; name: string; distance: string } }[] = []

    for (const request of pendingRequests) {
      const requestRoom = queryOne<{ floor: number; room_number: string }>(
        'SELECT floor, room_number FROM rooms WHERE id = ?', [request.room_id]
      )
      if (!requestRoom) continue

      let bestStaff = availableStaff[0]
      let minDistance = Infinity

      for (const staff of availableStaff) {
        const staffTasks = queryAll<{ room_id: number }>(
          "SELECT room_id FROM service_requests WHERE assigned_to = ? AND status IN ('assigned', 'in_progress')",
          [staff.id]
        )

        let staffFloor = 1
        if (staffTasks.length > 0) {
          const lastRoom = queryOne<{ floor: number }>(
            'SELECT floor FROM rooms WHERE id = ?', [staffTasks[staffTasks.length - 1].room_id]
          )
          staffFloor = lastRoom?.floor ?? 1
        }

        const distance = Math.abs(staffFloor - requestRoom.floor) + staffTasks.length * 10
        if (distance < minDistance) {
          minDistance = distance
          bestStaff = staff
        }
      }

      run(
        "UPDATE service_requests SET assigned_to = ?, status = 'assigned' WHERE id = ?",
        [bestStaff.id, request.id]
      )

      if (request.type === 'maintenance') {
        run('UPDATE rooms SET status = ? WHERE id = ?', ['maintenance', request.room_id])
      }

      dispatched.push({
        requestId: request.id,
        assignedStaff: {
          id: bestStaff.id,
          name: bestStaff.name,
          distance: `${minDistance}层`,
        },
      })
    }

    if (requestId && dispatched.length === 1) {
      res.json({ success: true, data: { requestId: dispatched[0].requestId, assignedStaff: dispatched[0].assignedStaff } })
    } else {
      res.json({ success: true, data: { dispatched } })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '自动派工失败' })
  }
})

export default router
