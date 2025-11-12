import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const body = await request.json()
    const { boardId, data } = body

    if (!boardId || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Input validation
    if (typeof boardId !== 'string' || boardId.length < 1) {
      return NextResponse.json({ error: 'Invalid boardId' }, { status: 400 })
    }
    if (typeof data !== 'object') {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }
    
    // Size limit check (1MB)
    const dataSize = JSON.stringify(data).length
    if (dataSize > 1048576) {
      return NextResponse.json({ error: 'Snapshot too large' }, { status: 413 })
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
