import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const { boardId, userEmail, role, ownerId } = await request.json()

    if (!boardId || !userEmail || !role || !ownerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId }
    })

    if (!board || board.ownerId !== ownerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existing = await prisma.collaboration.findFirst({
      where: { boardId, userId: user.id }
    })

    if (existing) {
      return NextResponse.json({ error: 'User already added' }, { status: 400 })
    }

    const collaboration = await prisma.collaboration.create({
      data: {
        boardId,
        userId: user.id,
        role
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    })

    return NextResponse.json(collaboration)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const collaborationId = searchParams.get('collaborationId')
    const ownerId = searchParams.get('ownerId')
    const boardId = searchParams.get('boardId')

    if (!collaborationId || !ownerId || !boardId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId }
    })

    if (!board || board.ownerId !== ownerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.collaboration.delete({
      where: { id: collaborationId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
