import { WebSocketServer } from 'ws'
import { TLSocketRoom } from '@tldraw/sync'
import 'dotenv/config'

const PORT = process.env.SYNC_PORT || 5858
const rooms = new Map()

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    const room = new TLSocketRoom({
      onSessionRemoved: (sessionId) => {
        console.log(`Session removed: ${sessionId}`)
      }
    })
    rooms.set(roomId, room)
    console.log(`✅ Created room: ${roomId}`)
  }
  return rooms.get(roomId)
}

const wss = new WebSocketServer({ port: PORT })

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const roomId = url.searchParams.get('roomId')
  
  if (!roomId) {
    ws.close(1008, 'Room ID required')
    return
  }

  console.log(`👤 Client connected to room: ${roomId}`)
  
  const room = getOrCreateRoom(roomId)
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
  
  // Pass socket with metadata object
  room.handleSocketConnect({
    sessionId,
    socket: ws,
    meta: {}
  })

  ws.on('close', () => {
    console.log(`👋 Client disconnected from room: ${roomId}`)
    room.handleSocketClose(sessionId)
    
    if (room.getNumActiveSessions() === 0) {
      setTimeout(() => {
        if (room.getNumActiveSessions() === 0) {
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
