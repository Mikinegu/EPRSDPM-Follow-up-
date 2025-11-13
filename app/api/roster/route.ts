import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getSessionCookieName, verifySessionToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const sessionCookie = cookies().get(getSessionCookieName())?.value
  if (!sessionCookie) return false

  return verifySessionToken(sessionCookie)
}

export async function GET(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const date = searchParams.get('date')

    if (!siteId || !date) {
      return NextResponse.json({ error: 'Missing siteId or date' }, { status: 400 })
    }

    const [staffAssignments, dlAssignments] = await Promise.all([
      prisma.staffAssignment.findMany({
        where: { siteId, date },
        select: { staffId: true },
      }),
      prisma.dLAssignment.findMany({
        where: { siteId, date },
        select: { dlId: true },
      }),
    ])

    return NextResponse.json({
      staffIds: staffAssignments.map(item => item.staffId),
      dlIds: dlAssignments.map(item => item.dlId),
    })
  } catch (error) {
    console.error('Error fetching roster assignments:', error)
    return NextResponse.json({ error: 'Failed to fetch roster assignments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { siteId, date, staffIds, dlIds } = body as {
      siteId?: string
      date?: string
      staffIds?: string[]
      dlIds?: string[]
    }

    if (!siteId || !date) {
      return NextResponse.json({ error: 'Missing siteId or date' }, { status: 400 })
    }

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        staff: { select: { id: true } },
        dls: { select: { id: true } },
      },
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const validStaffIds = new Set(site.staff.map(member => member.id))
    const validDlIds = new Set(site.dls.map(member => member.id))

    const filteredStaffIds = Array.isArray(staffIds)
      ? staffIds.filter(id => validStaffIds.has(id))
      : []

    const filteredDlIds = Array.isArray(dlIds)
      ? dlIds.filter(id => validDlIds.has(id))
      : []

    await prisma.$transaction(async (tx) => {
      await tx.staffAssignment.deleteMany({ where: { siteId, date } })
      await tx.dLAssignment.deleteMany({ where: { siteId, date } })

      if (filteredStaffIds.length) {
        await tx.staffAssignment.createMany({
          data: filteredStaffIds.map(id => ({
            siteId,
            staffId: id,
            date,
          })),
        })
      }

      if (filteredDlIds.length) {
        await tx.dLAssignment.createMany({
          data: filteredDlIds.map(id => ({
            siteId,
            dlId: id,
            date,
          })),
        })
      }
    })

    return NextResponse.json({
      staffIds: filteredStaffIds,
      dlIds: filteredDlIds,
    })
  } catch (error) {
    console.error('Error saving roster assignments:', error)
    return NextResponse.json({ error: 'Failed to save roster assignments' }, { status: 500 })
  }
}

