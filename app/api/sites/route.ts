import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const sites = await prisma.site.findMany({
      include: {
        staff: { where: { isActive: true } },
        dls: { where: { isActive: true } },
        skilled: { where: { isActive: true } },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(sites)
  } catch (error) {
    console.error('Error fetching sites:', error)
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 })
  }
}
