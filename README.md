# 🎨 Collaborative Whiteboard Application

> A real-time collaborative whiteboard built with Next.js 14, tldraw, PostgreSQL, and AWS Cognito.

## ✨ Features

- 🎨 Real-time collaborative drawing with tldraw
- 👥 User authentication with AWS Cognito
- 💾 Auto-save every 30 seconds + manual save
- 📤 Export to JSON, SVG, PNG
- 🔗 Share boards with collaborators
- 👁️ Role-based access (owner/editor/viewer)
- 🗄️ PostgreSQL database with Prisma ORM
- 🔄 WebSocket sync server for real-time collaboration

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **Drawing**: tldraw v3
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Authentication**: AWS Cognito (via AWS Amplify)
- **Real-time Sync**: Custom WebSocket server with @tldraw/sync
- **Deployment**: AWS EC2 (t2.micro - free tier eligible)

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or Neon)
- AWS Cognito User Pool

### 1. Clone and Install
```bash
git clone https://github.com/adityanarke5-create/whiteboard-tldraw.git
cd whiteboard-tldraw
npm install
```

### 2. Configure Environment
Create `.env` file:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
NEXT_PUBLIC_AWS_REGION="ap-south-1"
NEXT_PUBLIC_COGNITO_USER_POOL_ID="your-pool-id"
NEXT_PUBLIC_COGNITO_CLIENT_ID="your-client-id"
NEXT_PUBLIC_SYNC_SERVER_URL="ws://localhost:5858"
```

### 3. Setup Database
```bash
npx prisma generate
npx prisma migrate deploy
```

### 4. Run Development Servers
```bash
npm run dev:all
```

Open [http://localhost:3000](http://localhost:3000)

## 🌐 AWS Deployment (Free Tier)

### Deploy to EC2
```bash
bash deploy-github.sh
```

This will:
- Launch t2.micro EC2 instance (free tier eligible)
- Clone from GitHub
- Build with correct EC2 IP
- Setup Nginx reverse proxy
- Start Next.js + WebSocket server with PM2

**Cost**: $0/month (first 12 months) or ~$8/month after

### Update Deployment
```bash
ssh -i ~/.ssh/whiteboard-key.pem ec2-user@<IP>
cd ~/app
git pull
npm run build
pm2 restart all
```

### Destroy Resources
```bash
bash destroy.sh
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── boards/          # Board CRUD
│   │   ├── snapshots/       # Snapshot save/load
│   │   ├── collaborations/  # Collaborator management
│   │   └── users/sync/      # User sync endpoint
│   ├── board/[id]/          # Whiteboard canvas
│   ├── dashboard/           # User dashboard
│   ├── signin/              # Sign in
│   ├── signup/              # Sign up (with email verification)
│   └── page.js              # Landing page
├── components/
│   ├── WhiteboardCanvas.js  # tldraw integration
│   └── LoadingSpinner.js    # Loading component
├── contexts/
│   └── AuthContext.js       # Auth + user sync
├── lib/
│   ├── prisma.js            # Prisma client
│   └── cognito.js           # AWS Amplify config
└── middleware.js            # Route protection

sync-server/
└── server.mjs               # WebSocket sync server

prisma/
└── schema.prisma            # Database schema
```

## 🗄️ Database Schema

```prisma
User {
  id, email, cognitoId
  boards (owned)
  collaborations
}

Board {
  id, title, ownerId
  snapshots
  collaborations
}

Snapshot {
  id, boardId, data (JSON)
}

Collaboration {
  id, boardId, userId, role
}
```

## 🔌 API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards?userId={id}` | List user's boards |
| POST | `/api/boards` | Create new board |
| DELETE | `/api/boards?boardId={id}&userId={id}` | Delete board |
| POST | `/api/snapshots` | Save board snapshot |
| GET | `/api/snapshots?boardId={id}` | Get latest snapshot |
| POST | `/api/collaborations` | Add collaborator |
| DELETE | `/api/collaborations?collaborationId={id}` | Remove collaborator |
| POST | `/api/users/sync` | Sync Cognito user to DB |

## 🔧 Utility Scripts

| Script | Description |
|--------|-------------|
| `deploy-github.sh` | Deploy to EC2 from GitHub |
| `destroy.sh` | Remove all AWS resources |
| `debug.sh` | Check EC2 logs and status |
| `logs.sh` | SSH and view PM2 logs |
| `check-env.sh` | View .env on EC2 |
| `fix-and-rebuild.sh` | Fix and rebuild on EC2 |

## 🎯 Key Features Explained

### Real-time Collaboration
- WebSocket server syncs drawing state across all connected users
- Auto-saves to PostgreSQL every 30 seconds
- Loads existing snapshot when joining a board

### Authentication Flow
1. User signs up with email (Cognito)
2. Email verification code sent
3. User confirms and is synced to PostgreSQL
4. Protected routes via middleware

### Snapshot System
- Stores tldraw state as JSON in PostgreSQL
- Sync server loads snapshot on room creation
- Manual save button for immediate persistence
- Auto-save runs every 30 seconds while users are connected

## 🐛 Troubleshooting

### Local Development
```bash
# Database issues
npx prisma generate
npx prisma migrate deploy

# Clear build
rm -rf .next
npm run build

# Check sync server
curl http://localhost:5858
```

### EC2 Deployment
```bash
# Check status
bash debug.sh

# View logs
bash logs.sh
# Then: pm2 logs

# Rebuild
bash fix-and-rebuild.sh
```

## 📝 Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_AWS_REGION` - AWS region for Cognito
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID` - Cognito User Pool ID
- `NEXT_PUBLIC_COGNITO_CLIENT_ID` - Cognito App Client ID
- `NEXT_PUBLIC_SYNC_SERVER_URL` - WebSocket server URL

### Optional
- `SYNC_PORT` - Sync server port (default: 5858)
- `NODE_ENV` - Environment (production/development)

## 📄 License

ISC

## 🔗 Links

- GitHub: https://github.com/adityanarke5-create/whiteboard-tldraw
- tldraw: https://tldraw.dev
- Next.js: https://nextjs.org
