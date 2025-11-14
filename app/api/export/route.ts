import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { getSessionCookieName, verifySessionToken } from '@/lib/auth'
import ExcelJS from 'exceljs'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const sessionCookie = cookies().get(getSessionCookieName())?.value
  if (!sessionCookie) return false
  return verifySessionToken(sessionCookie)
}

function formatDate(date: Date) {
  return date.toISOString().split('T')[0]
}

function generateDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = []
  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    dates.push(formatDate(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return dates
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  const stringValue = String(value)
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const siteId = searchParams.get('siteId')
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    if (role !== 'staff' && role !== 'dl') {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 })
    }

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 })
    }

    const site = await prisma.site.findUnique({ where: { id: siteId } })
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const endDate = endDateParam ? new Date(endDateParam) : new Date()
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(new Date().setDate(endDate.getDate() - 29))

    const dateRange = generateDateRange(startDate, endDate)

    let members, assignments, attendances

    if (role === 'staff') {
      ;[members, assignments, attendances] = await Promise.all([
        prisma.staff.findMany({
          where: { siteId },
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        }),
        prisma.staffAssignment.findMany({
          where: {
            siteId,
            date: { gte: formatDate(startDate), lte: formatDate(endDate) },
          },
        }),
        prisma.staffAttendance.findMany({
          where: {
            staff: { siteId },
            attendanceRecord: { date: { gte: formatDate(startDate), lte: formatDate(endDate) } },
          },
          include: { attendanceRecord: true },
        }),
      ])
    } else {
      ;[members, assignments, attendances] = await Promise.all([
        prisma.dL.findMany({
          where: { siteId },
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        }),
        prisma.dLAssignment.findMany({
          where: {
            siteId,
            date: { gte: formatDate(startDate), lte: formatDate(endDate) },
          },
        }),
        prisma.dLAttendance.findMany({
          where: {
            dl: { siteId },
            attendanceRecord: { date: { gte: formatDate(startDate), lte: formatDate(endDate) } },
          },
          include: { attendanceRecord: true },
        }),
      ])
    }

    const assignmentsMap = new Map<string, Set<string>>()
    for (const assignment of assignments) {
      const memberId = role === 'staff' ? (assignment as any).staffId : (assignment as any).dlId
      if (!assignmentsMap.has(assignment.date)) {
        assignmentsMap.set(assignment.date, new Set())
      }
      assignmentsMap.get(assignment.date)!.add(memberId)
    }

    const attendanceMap = new Map<string, Map<string, boolean>>()
    for (const attendance of attendances) {
      const memberId = role === 'staff' ? (attendance as any).staffId : (attendance as any).dlId
      const date = attendance.attendanceRecord.date
      if (!attendanceMap.has(date)) {
        attendanceMap.set(date, new Map())
      }
      attendanceMap.get(date)!.set(memberId, attendance.present)
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(`${role.toUpperCase()} Attendance`)

    worksheet.columns = [{ header: 'Name', key: 'name', width: 25 }].concat(
      dateRange.map(date => ({ header: date, key: date, width: 12 })),
    )

    worksheet.getRow(1).font = { bold: true }

    members.forEach((member) => {
      const rowData: { [key: string]: any } = { name: member.name }
      dateRange.forEach(date => {
        const isRostered = assignmentsMap.get(date)?.has(member.id) ?? false
        const attendanceStatus = attendanceMap.get(date)?.get(member.id)
        let status = ''
        if (attendanceStatus === true) {
          status = 'Present'
        } else if (attendanceStatus === false) {
          status = 'Absent'
        } else if (isRostered) {
          status = 'Absent' // Rostered but no attendance record
        }
        rowData[date] = status
      })
      worksheet.addRow(rowData)
    })

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        if (rowNumber > 1) {
          // Add basic cell styling based on content
          if (cell.value === 'Present') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFC6EFCE' }, // Light Green
            }
            cell.font = {
              color: { argb: 'FF006100' }, // Dark Green
            }
          } else if (cell.value === 'Absent') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFC7CE' }, // Light Red
            }
            cell.font = {
              color: { argb: 'FF9C0006' }, // Dark Red
            }
          }
        }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const siteName = site.name.replace(/\s+/g, '_')
    const filename = `${siteName}_${role}_attendance_${formatDate(startDate)}_to_${formatDate(
      endDate,
    )}.xlsx`

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    const { searchParams } = new URL(request.url)
    console.error(`Error exporting ${searchParams.get('role')} attendance:`, error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
