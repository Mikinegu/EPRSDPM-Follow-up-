import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, siteId } = body;

    const staff = await prisma.staff.create({
      data: {
        name,
        siteId,
      },
      include: {
        site: true,
      },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, siteId } = body;

    const staff = await prisma.staff.update({
      where: { id },
      data: {
        name,
        siteId,
      },
      include: {
        site: true,
      },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    await prisma.staff.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
  }
}
