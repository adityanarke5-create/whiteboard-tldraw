# 🎨 Collaborative Whiteboard Application

> A real-time collaborative whiteboard built with Next.js 14, tldraw, PostgreSQL, and AWS Cognito.

## 🚀 Quick Start

**New to this project?** Start here:

1. 📖 Read **[GET_STARTED.md](GET_STARTED.md)** for an overview
2. ⚡ Follow **[QUICKSTART.md](QUICKSTART.md)** to get running in 5 minutes
3. 📚 Check **[INDEX.md](INDEX.md)** for complete documentation index

---

## Features

- 🎨 Real-time collaborative drawing with tldraw
- 👥 User authentication with AWS Cognito
- 💾 Auto-save and manual snapshots
- 📤 Export to JSON, SVG, PNG
- 🔗 Share boards with collaborators
- 👁️ Role-based access (owner/editor/viewer)
- 🗄️ PostgreSQL database with Prisma ORM

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Drawing**: tldraw
- **Database**: PostgreSQL with Prisma
- **Authentication**: AWS Cognito (via AWS Amplify)
- **Notifications**: react-hot-toast

## Prerequisites

- Node.js 18+
- PostgreSQL (local or remote)
- AWS Cognito User Pool (for authentication)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Update `.env` file with your configuration:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/whiteboard?schema=public"

# AWS Cognito Configuration
NEXT_PUBLIC_AWS_REGION="us-east-1"
NEXT_PUBLIC_COGNITO_USER_POOL_ID="your-user-pool-id"
NEXT_PUBLIC_COGNITO_CLIENT_ID="your-client-id"

# Sync Server (optional for advanced real-time sync)
NEXT_PUBLIC_SYNC_SERVER_URL="ws://localhost:5858"
```

### 3. Set Up PostgreSQL Database

Make sure PostgreSQL is running, then:

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

### 4. Configure AWS Cognito

1. Go to AWS Console → Cognito
2. Create a User Pool
3. Create an App Client (without client secret)
4. Copy User Pool ID and Client ID to `.env`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── boards/          # Board CRUD operations
│   │   ├── snapshots/       # Snapshot save/load
│   │   └── collaborations/  # Collaborator management
│   ├── board/[id]/          # Whiteboard canvas page
│   ├── dashboard/           # User dashboard
│   ├── signin/              # Sign in page
│   ├── signup/              # Sign up page
│   └── page.js              # Landing page
├── components/
│   └── WhiteboardCanvas.js  # tldraw integration
├── contexts/
│   └── AuthContext.js       # Authentication context
└── lib/
    ├── prisma.js            # Prisma client
    └── cognito.js           # AWS Amplify config
```

## Database Schema

- **User**: Stores user information
- **Board**: Whiteboard boards owned by users
- **Snapshot**: JSON snapshots of board state
- **Collaboration**: Board sharing and roles

## API Routes

- `GET /api/boards?userId={id}` - List user's boards
- `POST /api/boards` - Create new board
- `DELETE /api/boards?boardId={id}&userId={id}` - Delete board
- `POST /api/snapshots` - Save board snapshot
- `GET /api/snapshots?boardId={id}` - Get latest snapshot
- `POST /api/collaborations` - Add collaborator
- `DELETE /api/collaborations?collaborationId={id}` - Remove collaborator

## Features Breakdown

### Authentication
- AWS Cognito integration via AWS Amplify
- Sign up, sign in, sign out
- Protected routes

### Board Management
- Create, view, delete boards
- Board thumbnails on dashboard
- Last updated timestamps

### Whiteboard Canvas
- Full tldraw integration
- Drawing tools: select, shapes, pen, pan, zoom
- Auto-save every 2 minutes
- Manual save button
- Export to JSON, SVG, PNG

### Collaboration
- Share boards via link
- Add collaborators by email
- Role-based permissions:
  - **Owner**: Full control
  - **Editor**: Can edit canvas
  - **Viewer**: Read-only access

### Snapshots
- Automatic periodic saves
- Manual "Force Save" button
- Load last snapshot on board open
- JSON storage in PostgreSQL

## Deployment to AWS Elastic Beanstalk

1. Build the application:
```bash
npm run build
```

2. Create Elastic Beanstalk application
3. Configure environment variables
4. Deploy using EB CLI or console
5. Set up RDS PostgreSQL instance
6. Update DATABASE_URL in EB environment

## Optional: tldraw Sync Server

For advanced real-time collaboration with WebSocket sync:

```bash
# Install globally or use npx
npx @tldraw/sync-server
```

Configure room authentication middleware for Cognito tokens.

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Run `npm run prisma:generate` after schema changes

### Authentication Issues
- Verify Cognito User Pool ID and Client ID
- Check AWS region configuration
- Ensure app client has no client secret

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## License

ISC
