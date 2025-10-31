import { WebSocketServer } from 'ws'
import { TLSocketRoom } from '@tldraw/sync'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const PORT = process.env.SYNC_PORT || 5858
const rooms = new Map()
const prisma = new PrismaClient()

async function saveRoomToDatabase(roomId, room) {
  try {
    const snapshot = room.getCurrentSnapshot()
    const store = {}
    
    for (const doc of snapshot.documents) {
      store[doc.state.id] = doc.state
    }

    const data = { store, schema: snapshot.schema }
    const recordCount = Object.keys(store).length

    console.log(`💾 Saving room ${roomId}: ${recordCount} records`)

    const existing = await prisma.snapshot.findFirst({
      where: { boardId: roomId }
    })

    if (existing) {
      await prisma.snapshot.update({
        where: { id: existing.id },
        data: { data, createdAt: new Date() }
      })
      console.log(`✅ Updated snapshot for room ${roomId}`)
    } else {
      await prisma.snapshot.create({
        data: { boardId: roomId, data }
      })
      console.log(`✅ Created snapshot for room ${roomId}`)
    }

    await prisma.board.update({
      where: { id: roomId },
      data: { updatedAt: new Date() }
    }).catch(() => {})

  } catch (error) {
    console.error(`❌ Failed to save room ${roomId}:`, error.message)
  }
}

async function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    // Load existing snapshot from database first
    const snapshot = await prisma.snapshot.findFirst({
      where: { boardId: roomId },
      orderBy: { createdAt: 'desc' }
    })

    let initialDocuments = []
    if (snapshot?.data?.store) {
      const records = Object.values(snapshot.data.store)
      console.log(`📂 Loading ${records.length} records for room ${roomId}`)
      initialDocuments = records.map(state => ({
        state,
        lastChangedClock: 0
      }))
    } else {
      console.log(`📂 No snapshot found for room ${roomId}`)
    }

    const room = new TLSocketRoom({
      initialSnapshot: initialDocuments.length > 0 ? {
        documents: initialDocuments,
        schema: snapshot.data.schema
      } : undefined,
      onSessionRemoved: (sessionId) => {
        console.log(`Session removed: ${sessionId}`)
      }
    })

    console.log(`✅ Created room: ${roomId} with ${initialDocuments.length} records`)

    // Auto-save every 30 seconds
    const saveInterval = setInterval(() => {
      if (room.getNumActiveSessions() > 0) {
        saveRoomToDatabase(roomId, room)
      }
    }, 30000)

    room._saveInterval = saveInterval
    rooms.set(roomId, room)
  }
  return rooms.get(roomId)
}

const wss = new WebSocketServer({ port: PORT })

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const roomId = url.searchParams.get('roomId')
  
  if (!roomId) {
    ws.close(1008, 'Room ID required')
    return
  }

  console.log(`👤 Client connected to room: ${roomId}`)
  
  const room = await getOrCreateRoom(roomId)
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
  
  // Pass socket with metadata object
  room.handleSocketConnect({
    sessionId,
    socket: ws,
    meta: {}
  })

  ws.on('close', async () => {
    console.log(`👋 Client disconnected from room: ${roomId}`)
    room.handleSocketClose(sessionId)
    
    if (room.getNumActiveSessions() === 0) {
      // Save immediately when last user leaves
      await saveRoomToDatabase(roomId, room)
      
      setTimeout(() => {
        if (room.getNumActiveSessions() === 0) {
          clearInterval(room._saveInterval)
          rooms.delete(roomId)
          console.log(`🗑️  Room deleted: ${roomId}`)
        }
      }, 60000)
    }
  })

  ws.on('error', (error) => {
    console.error(`❌ WebSocket error:`, error.message)
    room.handleSocketError(sessionId, error)
  })
})

console.log(`🚀 tldraw sync server running on ws://localhost:${PORT}`)
