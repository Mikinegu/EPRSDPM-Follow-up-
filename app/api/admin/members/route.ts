import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getSessionCookieName, verifySessionToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

type MemberRole = 'staff' | 'dl' | 'skilled'

const ROLE_DELEGATE = {
  staff: prisma.staff,
  dl: prisma.dL,
  skilled: prisma.skilled,
}

function normalizeRole(role: unknown): MemberRole | null {
  if (role === 'staff' || role === 'dl' || role === 'skilled') {
    return role
  }
  return null
}

async function requireAdmin() {
  const sessionCookie = cookies().get(getSessionCookieName())?.value
  if (!sessionCookie) return false

  return verifySessionToken(sessionCookie)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const includeInactive = searchParams.get('includeInactive') === 'true'

  try {
    const whereClause = includeInactive ? {} : { isActive: true }
    const sites = await prisma.site.findMany({
      include: {
        staff: { where: whereClause },
        dls: { where: whereClause },
        skilled: { where: whereClause },
      },
      orderBy: {
        name: 'asc',
      },
    })
    return NextResponse.json({ sites })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

interface CreateMemberPayload {
  name: string
  role: MemberRole
  siteId: string
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const members = Array.isArray(body?.members) ? (body.members as CreateMemberPayload[]) : []

    if (!members.length) {
      return NextResponse.json({ error: 'No members provided' }, { status: 400 })
    }

    const sanitized = members
      .map((member) => {
        const role = normalizeRole(member.role)
        const name = typeof member.name === 'string' ? member.name.trim() : ''
        const siteId = typeof member.siteId === 'string' ? member.siteId : ''
        if (!role || !name || !siteId) return null
        return { role, name, siteId }
      })
      .filter((member): member is { role: MemberRole; name: string; siteId: string } => member !== null)

    if (!sanitized.length) {
      return NextResponse.json({ error: 'No valid members provided' }, { status: 400 })
    }

    const created = await prisma.$transaction(async (tx) => {
      const results = []
      for (const member of sanitized) {
        let createdMember
        if (member.role === 'staff') {
          createdMember = await tx.staff.create({
            data: {
              name: member.name,
              siteId: member.siteId,
              isActive: true,
            },
          })
        } else if (member.role === 'dl') {
          createdMember = await tx.dL.create({
            data: {
              name: member.name,
              siteId: member.siteId,
              isActive: true,
            },
          })
        } else if (member.role === 'skilled') {
          createdMember = await tx.skilled.create({
            data: {
              name: member.name,
              siteId: member.siteId,
              isActive: true,
            },
          })
        }
        results.push(createdMember)
      }
      return results
    })

    return NextResponse.json({ members: created })
  } catch (error) {
    console.error('Error creating members:', error)
    return NextResponse.json({ error: 'Failed to create members' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const memberId = typeof body?.memberId === 'string' ? body.memberId : ''
    const role = normalizeRole(body?.role)
    const isActive = typeof body?.isActive === 'boolean' ? body.isActive : null

    if (!memberId || !role || isActive === null) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
    }

    let updated
    if (role === 'staff') {
      updated = await prisma.staff.update({
        where: { id: memberId },
        data: { isActive },
      })
    } else if (role === 'dl') {
      updated = await prisma.dL.update({
        where: { id: memberId },
        data: { isActive },
      })
    } else if (role === 'skilled') {
      updated = await prisma.skilled.update({
        where: { id: memberId },
        data: { isActive },
      })
    }

    return NextResponse.json({ member: updated })
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const role = normalizeRole(searchParams.get('role'))

    if (!memberId || !role) {
      return NextResponse.json({ error: 'Missing memberId or role' }, { status: 400 })
    }

    if (role === 'staff') {
      await prisma.staff.delete({
        where: { id: memberId },
      })
    } else if (role === 'dl') {
      await prisma.dL.delete({
        where: { id: memberId },
      })
    } else if (role === 'skilled') {
      await prisma.skilled.delete({
        where: { id: memberId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting member:', error)
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 })
  }
}

