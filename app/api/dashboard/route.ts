import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view')
  const date = searchParams.get('date')
  const site = searchParams.get('site')

  const siteClause = site ? { site: { id: site } } : {}
  const dateClause = date ? { date: date } : {}
  const whereClause = { ...siteClause, ...dateClause }

  try {
    if (view === 'staff') {
      const data = await prisma.staff.findMany({
        where: site ? { siteId: site } : {},
        include: {
          site: { select: { name: true } },
          attendance: {
            where: date ? { attendanceRecord: { date } } : {},
            include: {
              attendanceRecord: {
                select: { date: true },
              },
            },
            orderBy: {
              attendanceRecord: {
                date: 'desc',
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      })
      return NextResponse.json(data)
    }

    if (view === 'dl') {
      const data = await prisma.dL.findMany({
        where: site ? { siteId: site } : {},
        include: {
          site: { select: { name: true } },
          attendance: {
            where: date ? { attendanceRecord: { date } } : {},
            include: {
              attendanceRecord: {
                select: { date: true },
              },
            },
            orderBy: {
              attendanceRecord: {
                date: 'desc',
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      })
      return NextResponse.json(data)
    }
    
    if (view === 'skilled') {
      const data = await prisma.skilled.findMany({
        where: site ? { siteId: site } : {},
        include: {
          site: { select: { name: true } },
          attendance: {
            where: date ? { attendanceRecord: { date } } : {},
            include: {
              attendanceRecord: {
                select: { date: true },
              },
            },
            orderBy: {
              attendanceRecord: {
                date: 'desc',
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      })
      return NextResponse.json(data)
    }

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        site: {
          select: {
            id: true,
            name: true,
          },
        },
        staffAttendance: {
          select: {
            present: true,
          },
        },
        dlAttendance: {
          select: {
            present: true,
          },
        },
        skilledAttendance: {
          select: {
            present: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })
    return NextResponse.json(attendanceRecords)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}

