# Starting the Application with Real-Time Sync

## Option 1: Run Both Servers Together (Recommended)

```bash
npm run dev:all
```

This starts both:
- Next.js app on http://localhost:3000
- Sync server on ws://localhost:5858

## Option 2: Run Servers Separately

### Terminal 1 - Next.js App
```bash
npm run dev
```

### Terminal 2 - Sync Server
```bash
npm run sync-server
```

## Verify Sync Server is Running

You should see:
```
🚀 tldraw sync server running on ws://localhost:5858
```

## Testing Real-Time Collaboration

1. Open board in one browser: http://localhost:3000/board/[board-id]
2. Open same board in another browser/tab
3. Draw in one browser - see changes appear instantly in the other!

## Troubleshooting

### Sync server won't start
- Check if port 5858 is already in use
- Kill process: `netstat -ano | findstr :5858` then `taskkill /PID <PID> /F`

### Changes not syncing
- Verify sync server is running
- Check browser console for WebSocket errors
- Ensure NEXT_PUBLIC_SYNC_SERVER_URL is set correctly in .env

## Production Deployment

For production, deploy sync server separately:
- Use PM2 or similar process manager
- Set up reverse proxy (nginx) for WebSocket
- Use wss:// (secure WebSocket) instead of ws://
