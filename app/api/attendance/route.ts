import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, siteId, staffAttendance, dlAttendance } = body

    const attendanceRecord = await prisma.attendanceRecord.create({
      data: {
        date,
        siteId,
        staffAttendance: {
          create: staffAttendance.map((item: { staffId: string; present: boolean }) => ({
            staffId: item.staffId,
            present: item.present,
          })),
        },
        dlAttendance: {
          create: dlAttendance.map((item: { dlId: string; present: boolean }) => ({
            dlId: item.dlId,
            present: item.present,
          })),
        },
      },
      include: {
        staffAttendance: {
          include: {
            staff: true,
          },
        },
        dlAttendance: {
          include: {
            dl: true,
          },
        },
      },
    })

    return NextResponse.json(attendanceRecord)
  } catch (error) {
    console.error('Error creating attendance record:', error)
    return NextResponse.json({ error: 'Failed to create attendance record' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const records = await prisma.attendanceRecord.findMany({
      include: {
        site: true,
        staffAttendance: {
          include: {
            staff: true,
          },
        },
        dlAttendance: {
          include: {
            dl: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('Error fetching attendance records:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance records' }, { status: 500 })
  }
}
