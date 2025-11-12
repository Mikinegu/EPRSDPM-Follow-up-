import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, siteId } = body;

    const dl = await prisma.dL.create({
      data: {
        name,
        siteId,
      },
      include: {
        site: true,
      },
    });

    return NextResponse.json(dl);
  } catch (error) {
    console.error('Error creating DL:', error);
    return NextResponse.json({ error: 'Failed to create DL' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, siteId } = body;

    const dl = await prisma.dL.update({
      where: { id },
      data: {
        name,
        siteId,
      },
      include: {
        site: true,
      },
    });

    return NextResponse.json(dl);
  } catch (error) {
    console.error('Error updating DL:', error);
    return NextResponse.json({ error: 'Failed to update DL' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'DL ID is required' }, { status: 400 });
    }

    await prisma.dL.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting DL:', error);
    return NextResponse.json({ error: 'Failed to delete DL' }, { status: 500 });
  }
}
