import { Router, type Request, type Response } from 'express'
import { queryAll, queryOne } from '../database.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const router = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const reportsDir = path.join(__dirname, '..', '..', 'public', 'reports')

function ensureReportsDir() {
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }
}

function generateNightAuditCSV(data: any): string {
  const lines: string[] = []
  lines.push('ROYAL HOTEL - 夜审报表')
  lines.push(`日期: ${data.date}`)
  lines.push('========================================')
  lines.push('')
  lines.push('一、入住情况')
  lines.push(`总房间数,${data.totalRooms}`)
  lines.push(`已入住,${data.occupiedRooms}`)
  lines.push(`可售房间,${data.availableRooms}`)
  lines.push(`入住率,${data.occupancy}%`)
  lines.push('')
  lines.push('二、收入情况')
  lines.push(`客房收入,¥${data.roomRevenue.toLocaleString()}`)
  lines.push(`迷你吧收入,¥${data.minibarRevenue.toLocaleString()}`)
  lines.push(`其他收入,¥${data.otherRevenue.toLocaleString()}`)
  lines.push(`总收入,¥${data.totalRevenue.toLocaleString()}`)
  lines.push('')
  lines.push('三、经营指标')
  lines.push(`ADR(日均房价),¥${data.adr}`)
  lines.push(`RevPAR(平均客房收益),¥${data.revpar}`)
  lines.push('')
  lines.push('四、预订统计')
  lines.push(`今日入住,${data.checkIns}`)
  lines.push(`今日退房,${data.checkOuts}`)
  lines.push(`取消预订,${data.cancellations}`)
  lines.push('')
  lines.push('========================================')
  lines.push(`生成时间: ${new Date().toLocaleString('zh-CN')}`)
  return lines.join('\n')
}

function generateNightAuditHTML(data: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>夜审报表 - ${data.date}</title>
<style>
  body{font-family:'Microsoft YaHei',sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1B2A4A}
  h1{color:#C9A96E;border-bottom:3px solid #C9A96E;padding-bottom:10px}
  h2{color:#1B2A4A;margin-top:30px;border-left:4px solid #C9A96E;padding-left:10px}
  .stat-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}
  .label{color:#666}
  .value{font-weight:bold;color:#1B2A4A}
  .total{font-size:1.2em;color:#C9A96E;font-weight:bold}
  .footer{margin-top:40px;padding-top:20px;border-top:2px solid #C9A96E;color:#999;font-size:0.9em;text-align:center}
</style></head>
<body>
<h1>ROYAL HOTEL 夜审报表</h1>
<p>报表日期：${data.date}</p>

<h2>一、入住情况</h2>
<div class="stat-row"><span class="label">总房间数</span><span class="value">${data.totalRooms} 间</span></div>
<div class="stat-row"><span class="label">已入住</span><span class="value">${data.occupiedRooms} 间</span></div>
<div class="stat-row"><span class="label">可售房间</span><span class="value">${data.availableRooms} 间</span></div>
<div class="stat-row"><span class="label">入住率</span><span class="value">${data.occupancy}%</span></div>

<h2>二、收入情况</h2>
<div class="stat-row"><span class="label">客房收入</span><span class="value">¥${data.roomRevenue.toLocaleString()}</span></div>
<div class="stat-row"><span class="label">迷你吧收入</span><span class="value">¥${data.minibarRevenue.toLocaleString()}</span></div>
<div class="stat-row"><span class="label">其他收入</span><span class="value">¥${data.otherRevenue.toLocaleString()}</span></div>
<div class="stat-row"><span class="label">总收入</span><span class="value total">¥${data.totalRevenue.toLocaleString()}</span></div>

<h2>三、经营指标</h2>
<div class="stat-row"><span class="label">ADR (日均房价)</span><span class="value">¥${data.adr}</span></div>
<div class="stat-row"><span class="label">RevPAR (平均客房收益)</span><span class="value">¥${data.revpar}</span></div>

<h2>四、预订统计</h2>
<div class="stat-row"><span class="label">今日入住</span><span class="value">${data.checkIns} 单</span></div>
<div class="stat-row"><span class="label">今日退房</span><span class="value">${data.checkOuts} 单</span></div>
<div class="stat-row"><span class="label">取消预订</span><span class="value">${data.cancellations} 单</span></div>

<div class="footer">生成时间：${new Date().toLocaleString('zh-CN')}<br>ROYAL HOTEL PMS System</div>
</body></html>`
}

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

    ensureReportsDir()

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

    const reportData = {
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
    }

    let fileName: string
    let content: string
    let mimeType: string

    if (reportFormat === 'csv') {
      fileName = `night_audit_${timestamp}.csv`
      content = generateNightAuditCSV(reportData)
      mimeType = 'text/csv; charset=utf-8'
    } else if (reportFormat === 'excel') {
      fileName = `night_audit_${timestamp}.csv`
      content = generateNightAuditCSV(reportData)
      mimeType = 'text/csv; charset=utf-8'
    } else {
      fileName = `night_audit_${timestamp}.html`
      content = generateNightAuditHTML(reportData)
      mimeType = 'text/html; charset=utf-8'
    }

    const filePath = path.join(reportsDir, fileName)
    fs.writeFileSync(filePath, content, 'utf-8')

    const downloadUrl = `/reports/${fileName}`

    res.json({
      success: true,
      data: {
        reportType,
        downloadUrl,
        fileName,
        mimeType,
        generatedAt: new Date().toISOString(),
        message: '报表已生成',
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({ success: false, error: '导出报表失败' })
  }
})

router.get('/download/:filename', async (req: Request, res: Response): Promise<void> => {
  try {
    const filename = req.params.filename
    const filePath = path.join(reportsDir, filename)

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: '文件不存在' })
      return
    }

    const ext = path.extname(filename).toLowerCase()
    const mimeType = ext === '.csv' ? 'text/csv; charset=utf-8' : 'text/html; charset=utf-8'

    res.setHeader('Content-Type', mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', fs.statSync(filePath).size)

    const stream = fs.createReadStream(filePath)
    stream.pipe(res)
  } catch (error) {
    res.status(500).json({ success: false, error: '下载失败' })
  }
})

export default router
