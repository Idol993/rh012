import { Router, type Request, type Response } from 'express'
import { queryAll, queryOne, run } from '../database.js'

const router = Router()

interface RoomRow {
  id: number
  room_number: string
  floor: number
  room_type: string
  status: string
  is_smoking: number
  has_firm_pillow: number
  ac_power: number
  ac_temperature: number
  ac_mode: string
  light_power: number
  light_brightness: number
  curtain_open: number
  last_cleaned_at: string | null
  price_per_night: number
}

interface GuestRow {
  guest_id: number
  guest_name: string
  guest_phone: string
  guest_member_id: number | null
}

function formatRoom(room: RoomRow, guest?: GuestRow) {
  return {
    id: room.id,
    roomNumber: room.room_number,
    floor: room.floor,
    roomType: room.room_type,
    status: room.status,
    isSmoking: !!room.is_smoking,
    hasFirmPillow: !!room.has_firm_pillow,
    currentGuest: guest ? {
      id: guest.guest_id,
      name: guest.guest_name,
      phone: guest.guest_phone,
      memberId: guest.guest_member_id,
    } : null,
    iotDevices: {
      ac: { power: !!room.ac_power, temperature: room.ac_temperature, mode: room.ac_mode },
      light: { power: !!room.light_power, brightness: room.light_brightness },
      curtain: { open: !!room.curtain_open },
    },
    lastCleanedAt: room.last_cleaned_at || undefined,
    pricePerNight: room.price_per_night,
  }
}

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rooms = queryAll<RoomRow>('SELECT * FROM rooms ORDER BY floor, room_number')
    const result = rooms.map(room => {
      let guest: GuestRow | undefined
      if (room.status === 'occupied') {
        guest = queryOne<GuestRow>(
          `SELECT g.id as guest_id, g.name as guest_name, g.phone as guest_phone, g.member_id as guest_member_id
           FROM reservations r JOIN guests g ON r.guest_id = g.id
           WHERE r.room_id = ? AND r.status = 'checked_in'`,
          [room.id]
        ) || undefined
      }
      return formatRoom(room, guest)
    })
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取房间列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = Number(req.params.id)
    const room = queryOne<RoomRow>('SELECT * FROM rooms WHERE id = ?', [roomId])

    if (!room) {
      res.status(404).json({ success: false, error: '房间不存在' })
      return
    }

    let guest: GuestRow | undefined
    if (room.status === 'occupied') {
      guest = queryOne<GuestRow>(
        `SELECT g.id as guest_id, g.name as guest_name, g.phone as guest_phone, g.member_id as guest_member_id
         FROM reservations r JOIN guests g ON r.guest_id = g.id
         WHERE r.room_id = ? AND r.status = 'checked_in'`,
        [roomId]
      ) || undefined
    }

    const minibarItems = queryAll(
      'SELECT id, name, price, weight, current_weight, consumed, consumed_at FROM minibar_items WHERE room_id = ?',
      [roomId]
    )

    const formatted = formatRoom(room, guest)
    res.json({
      success: true,
      data: {
        ...formatted,
        minibar: minibarItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          weight: item.weight,
          currentWeight: item.current_weight,
          consumed: !!item.consumed,
          consumedAt: item.consumed_at || undefined,
        })),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取房间详情失败' })
  }
})

router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = Number(req.params.id)
    const { status } = req.body

    const validStatuses = ['available', 'occupied', 'cleaning', 'maintenance', 'reserved']
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: '无效的房间状态' })
      return
    }

    const room = queryOne<RoomRow>('SELECT id FROM rooms WHERE id = ?', [roomId])
    if (!room) {
      res.status(404).json({ success: false, error: '房间不存在' })
      return
    }

    run('UPDATE rooms SET status = ? WHERE id = ?', [status, roomId])
    res.json({ success: true, data: { id: roomId, status } })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新房间状态失败' })
  }
})

router.put('/:id/iot', async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = Number(req.params.id)
    const { device, settings } = req.body

    if (!device || !settings) {
      res.status(400).json({ success: false, error: '缺少设备类型或设置参数' })
      return
    }

    const room = queryOne<RoomRow>('SELECT id FROM rooms WHERE id = ?', [roomId])
    if (!room) {
      res.status(404).json({ success: false, error: '房间不存在' })
      return
    }

    if (device === 'ac') {
      const parts: string[] = []
      const params: (string | number | boolean | null)[] = []
      if (settings.power !== undefined) { parts.push('ac_power = ?'); params.push(settings.power ? 1 : 0) }
      if (settings.temperature !== undefined) { parts.push('ac_temperature = ?'); params.push(settings.temperature) }
      if (settings.mode !== undefined) { parts.push('ac_mode = ?'); params.push(settings.mode) }
      if (parts.length > 0) {
        params.push(roomId)
        run(`UPDATE rooms SET ${parts.join(', ')} WHERE id = ?`, params)
      }
    } else if (device === 'light') {
      const parts: string[] = []
      const params: (string | number | boolean | null)[] = []
      if (settings.power !== undefined) { parts.push('light_power = ?'); params.push(settings.power ? 1 : 0) }
      if (settings.brightness !== undefined) { parts.push('light_brightness = ?'); params.push(settings.brightness) }
      if (parts.length > 0) {
        params.push(roomId)
        run(`UPDATE rooms SET ${parts.join(', ')} WHERE id = ?`, params)
      }
    } else if (device === 'curtain') {
      run('UPDATE rooms SET curtain_open = ? WHERE id = ?', [settings.open ? 1 : 0, roomId])
    } else {
      res.status(400).json({ success: false, error: '未知的设备类型' })
      return
    }

    const updated = queryOne<RoomRow>('SELECT * FROM rooms WHERE id = ?', [roomId])
    res.json({
      success: true,
      data: {
        ac: { power: !!updated!.ac_power, temperature: updated!.ac_temperature, mode: updated!.ac_mode },
        light: { power: !!updated!.light_power, brightness: updated!.light_brightness },
        curtain: { open: !!updated!.curtain_open },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新IoT设备设置失败' })
  }
})

router.post('/:id/pre-arrival', async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = Number(req.params.id)
    const { acTemperature, lightBrightness } = req.body

    const room = queryOne<RoomRow>('SELECT id FROM rooms WHERE id = ?', [roomId])
    if (!room) {
      res.status(404).json({ success: false, error: '房间不存在' })
      return
    }

    const temp = acTemperature ?? 22
    const brightness = lightBrightness ?? 60

    run(
      'UPDATE rooms SET ac_power = 1, ac_temperature = ?, ac_mode = ?, light_power = 1, light_brightness = ?, status = ? WHERE id = ?',
      [temp, 'cool', brightness, 'reserved', roomId]
    )

    res.json({
      success: true,
      data: {
        roomId,
        message: '预入住准备完成：空调已开启，灯光已调整',
        settings: {
          ac: { power: true, temperature: temp, mode: 'cool' },
          light: { power: true, brightness },
        },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '预入住准备失败' })
  }
})

export default router
