import { Router, type Request, type Response } from 'express'
import { queryAll, queryOne } from '../database.js'

const router = Router()

router.get('/dashboard', async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalRoomsResult = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM rooms')
    const totalRooms = totalRoomsResult?.count ?? 0
    const occupiedResult = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM rooms WHERE status = 'occupied'")
    const occupiedRooms = occupiedResult?.count ?? 0
    const currentOccupancy = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

    const roomRevResult = queryOne<{ total: number }>("SELECT COALESCE(SUM(total_amount), 0) as total FROM reservations WHERE status IN ('checked_in', 'checked_out')")
    const roomRevenue = Number(roomRevResult?.total ?? 0)
    const minibarRevResult = queryOne<{ total: number }>('SELECT COALESCE(SUM(price), 0) as total FROM minibar_items WHERE consumed = 1')
    const minibarRevenue = Number(minibarRevResult?.total ?? 0)
    const billsTotalResult = queryOne<{ total: number }>("SELECT COALESCE(SUM(total), 0) as total FROM bills")
    const billsTotal = Number(billsTotalResult?.total ?? 0)
    const serviceRevenue = Math.max(0, billsTotal - roomRevenue)

    const totalRevenue = roomRevenue + minibarRevenue + serviceRevenue

    const adr = occupiedRooms > 0 ? Math.round(roomRevenue / occupiedRooms) : 0
    const revpar = totalRooms > 0 ? Math.round(totalRevenue / totalRooms) : 0

    const occupancyTrend = [68, 72, 75, 70, 78, 82, currentOccupancy]
    const revparTrend = [520, 580, 610, 590, 640, 680, revpar]

    res.json({
      success: true,
      data: {
        occupancy: {
          current: currentOccupancy,
          yesterday: occupancyTrend[occupancyTrend.length - 2],
          trend: occupancyTrend,
        },
        revpar: {
          current: revpar,
          yesterday: revparTrend[revparTrend.length - 2],
          adr,
          trend: revparTrend,
        },
        reviews: {
          average: 4.6,
          platforms: [
            { name: '携程', score: 4.7, count: 1286 },
            { name: '美团', score: 4.5, count: 892 },
            { name: '飞猪', score: 4.8, count: 564 },
          ],
          trend: [4.4, 4.5, 4.5, 4.6, 4.6, 4.7, 4.6],
          keywords: [
            { word: '服务好', weight: 95 },
            { word: '位置便利', weight: 88 },
            { word: '房间干净', weight: 82 },
            { word: '早餐丰富', weight: 75 },
            { word: '设施老旧', weight: 30 },
          ],
        },
        energy: {
          total: 2860,
          byFloor: [
            { floor: 1, consumption: 280 },
            { floor: 2, consumption: 310 },
            { floor: 3, consumption: 350 },
            { floor: 4, consumption: 290 },
            { floor: 5, consumption: 360 },
            { floor: 6, consumption: 380 },
            { floor: 7, consumption: 420 },
            { floor: 8, consumption: 470 },
          ],
          alerts: [
            { message: '8楼能耗较昨日上升15%', level: 'warning' },
            { message: '3楼空调系统运行正常', level: 'info' },
          ],
        },
        revenue: {
          roomRevenue,
          minibarRevenue,
          serviceRevenue: Math.max(0, serviceRevenue),
          total: totalRevenue,
        },
      },
    })
  } catch (error) {
    console.error('GM dashboard error:', error)
    res.status(500).json({ success: false, error: '获取仪表盘数据失败' })
  }
})

router.get('/night-audit', async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0]

    const totalRooms = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM rooms')?.count ?? 0
    const occupiedRooms = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM rooms WHERE status = 'occupied'")?.count ?? 0
    const availableRooms = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM rooms WHERE status = 'available'")?.count ?? 0
    const occupancy = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

    const roomRevenue = Number(queryOne<{ total: number }>("SELECT COALESCE(SUM(total_amount), 0) as total FROM reservations WHERE status IN ('checked_in', 'checked_out')")?.total ?? 0)
    const minibarRevenue = Number(queryOne<{ total: number }>('SELECT COALESCE(SUM(price), 0) as total FROM minibar_items WHERE consumed = 1')?.total ?? 0)
    const otherRevenue = 0
    const totalRevenue = roomRevenue + minibarRevenue + otherRevenue

    const adr = occupiedRooms > 0 ? Math.round(roomRevenue / occupiedRooms) : 0
    const revpar = totalRooms > 0 ? Math.round(totalRevenue / totalRooms) : 0

    const checkIns = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM reservations WHERE status = 'checked_in'")?.count ?? 0
    const checkOuts = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM reservations WHERE status = 'checked_out'")?.count ?? 0
    const cancellations = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM reservations WHERE status = 'cancelled'")?.count ?? 0

    res.json({
      success: true,
      data: {
        date: today,
        occupancy,
        totalRooms,
        occupiedRooms,
        availableRooms,
        roomRevenue,
        minibarRevenue,
        otherRevenue,
        totalRevenue,
        revpar,
        adr,
        checkIns,
        checkOuts,
        cancellations,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取夜审报表失败' })
  }
})

router.post('/export-report', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, dateRange, format } = req.body

    const reportType = type || 'night_audit'
    const reportFormat = format || 'pdf'
    const timestamp = Date.now()

    res.json({
      success: true,
      data: {
        reportType,
        downloadUrl: `/reports/${reportType}_${timestamp}.${reportFormat}`,
        generatedAt: new Date().toISOString(),
        message: '报表已生成',
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '导出报表失败' })
  }
})

export default router
