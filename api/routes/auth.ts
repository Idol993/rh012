import { Router, type Request, type Response } from 'express'
import { queryOne } from '../database.js'

const router = Router()

const tokens = new Map<string, { id: number; name: string; role: string; avatar: string }>()

function generateToken(): string {
  return 'tk_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

const rolePermissions: Record<string, string[]> = {
  staff: ['service_requests', 'housekeeping'],
  front_desk: ['rooms', 'reservations', 'checkin', 'members', 'service_requests'],
  housekeeping_supervisor: ['rooms', 'housekeeping', 'service_requests'],
  gm: ['rooms', 'reservations', 'members', 'gm_dashboard', 'reports', 'service_requests'],
}

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, password, role } = req.body

    if (!employeeId || !password || !role) {
      res.status(400).json({ success: false, error: '缺少必要参数' })
      return
    }

    const employee = queryOne<{ id: number; name: string; role: string; avatar: string }>(
      'SELECT id, name, role, avatar FROM employees WHERE employee_id = ? AND password = ? AND role = ?',
      [employeeId, password, role]
    )

    if (!employee) {
      res.status(401).json({ success: false, error: '员工ID、密码或角色不匹配' })
      return
    }

    const token = generateToken()
    tokens.set(token, employee)

    res.json({
      success: true,
      token,
      user: {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        avatar: employee.avatar || '',
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '登录失败' })
  }
})

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token || !tokens.has(token)) {
      res.status(401).json({ success: false, error: '未登录或token已过期' })
      return
    }

    const user = tokens.get(token)!
    const permissions = rolePermissions[user.role] || []

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        permissions,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户信息失败' })
  }
})

export default router
