import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const { boardId, data } = await request.json()

    if (!boardId || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existing = await prisma.snapshot.findFirst({
      where: { boardId }
    })

    if (existing) {
      const snapshot = await prisma.snapshot.update({
        where: { id: existing.id },
        data: { data, createdAt: new Date() }
      })
      
      await prisma.board.update({
        where: { id: boardId },
        data: { updatedAt: new Date() }
      })
      
      return NextResponse.json(snapshot)
    }

    const snapshot = await prisma.snapshot.create({
      data: {
        boardId,
        data
      }
    })

    await prisma.board.update({
      where: { id: boardId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json(snapshot)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const boardId = searchParams.get('boardId')

    if (!boardId) {
      return NextResponse.json({ error: 'Board ID required' }, { status: 400 })
    }

    const snapshot = await prisma.snapshot.findFirst({
      where: { boardId }
    })

    return NextResponse.json(snapshot)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
