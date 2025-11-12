import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view')
    const siteFilter = searchParams.get('site')
    const dateFilter = searchParams.get('date')

    if (view === 'staff') {
      const staff = await prisma.staff.findMany({
        where: siteFilter ? { siteId: siteFilter } : undefined,
        include: {
          site: true,
          attendance: {
            include: {
              attendanceRecord: true,
            },
            where: dateFilter ? { attendanceRecord: { date: dateFilter } } : undefined,
            orderBy: {
              attendanceRecord: {
                date: 'desc',
              },
            },
          },
        },
      })

      return NextResponse.json(staff)
    } else if (view === 'dl') {
      const dls = await prisma.dL.findMany({
        where: siteFilter ? { siteId: siteFilter } : undefined,
        include: {
          site: true,
          attendance: {
            include: {
              attendanceRecord: true,
            },
            where: dateFilter ? { attendanceRecord: { date: dateFilter } } : undefined,
            orderBy: {
              attendanceRecord: {
                date: 'desc',
              },
            },
          },
        },
      })

      return NextResponse.json(dls)
    } else {
      const records = await prisma.attendanceRecord.findMany({
        where: {
          ...(siteFilter && { siteId: siteFilter }),
          ...(dateFilter && { date: dateFilter }),
        },
        include: {
          site: true,
          staffAttendance: true,
          dlAttendance: true,
        },
        orderBy: {
          date: 'desc',
        },
      })

      return NextResponse.json(records)
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
