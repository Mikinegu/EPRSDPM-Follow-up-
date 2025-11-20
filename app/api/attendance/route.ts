import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const {
      date,
      siteId,
      staffAttendance,
      dlAttendance,
      skilledAttendance,
    }: {
      date: string
      siteId: string
      staffAttendance: { staffId: string; present: boolean }[]
      dlAttendance: { dlId: string; present: boolean }[]
      skilledAttendance: { skilledId: string; present: boolean }[]
    } = await req.json()

    if (!date || !siteId) {
      return NextResponse.json({ error: 'Date and siteId are required' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      const attendanceRecord = await tx.attendanceRecord.upsert({
        where: {
          date_siteId: {
            date,
            siteId,
          },
        },
        update: {},
        create: {
          date,
          siteId,
        },
      })

      if (staffAttendance?.length > 0) {
        await tx.staffAttendance.deleteMany({
          where: { attendanceRecordId: attendanceRecord.id },
        })
        await tx.staffAttendance.createMany({
          data: staffAttendance.map(att => ({
            attendanceRecordId: attendanceRecord.id,
            staffId: att.staffId,
            present: att.present,
          })),
        })
      }

      if (dlAttendance?.length > 0) {
        await tx.dLAttendance.deleteMany({
          where: { attendanceRecordId: attendanceRecord.id },
        })
        await tx.dLAttendance.createMany({
          data: dlAttendance.map(att => ({
            attendanceRecordId: attendanceRecord.id,
            dlId: att.dlId,
            present: att.present,
          })),
        })
      }

      if (skilledAttendance?.length > 0) {
        await tx.skilledAttendance.deleteMany({
          where: { attendanceRecordId: attendanceRecord.id },
        })
        await tx.skilledAttendance.createMany({
          data: skilledAttendance.map(att => ({
            attendanceRecordId: attendanceRecord.id,
            skilledId: att.skilledId,
            present: att.present,
          })),
        })
      }
    })

    return NextResponse.json({ message: 'Attendance recorded' })
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
