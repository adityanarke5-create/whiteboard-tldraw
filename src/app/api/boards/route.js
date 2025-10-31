import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { collaborators: { some: { userId } } }
        ]
      },
      include: {
        owner: { select: { name: true, email: true } },
        collaborators: {
          include: {
            user: { select: { name: true, email: true } }
          }
        },
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(boards)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { title, userId, userEmail } = await request.json()

    if (!title || !userId || !userEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: { email: userEmail },
      create: { id: userId, email: userEmail }
    })

    const board = await prisma.board.create({
      data: {
        title,
        ownerId: user.id
      },
      include: {
        owner: { select: { name: true, email: true } }
      }
    })

    return NextResponse.json(board)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const boardId = searchParams.get('boardId')
    const userId = searchParams.get('userId')

    if (!boardId || !userId) {
      return NextResponse.json({ error: 'Board ID and User ID required' }, { status: 400 })
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId }
    })

    if (!board || board.ownerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.board.delete({ where: { id: boardId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
