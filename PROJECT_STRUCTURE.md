# Project Structure

## Directory Layout

```
whiteboard-tldraw-Q/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes
│   │   │   ├── boards/           # Board CRUD
│   │   │   ├── snapshots/        # Snapshot management
│   │   │   ├── collaborations/   # Collaborator management
│   │   │   └── users/sync/       # User sync with Cognito
│   │   ├── board/[id]/           # Board canvas page
│   │   ├── dashboard/            # User dashboard
│   │   ├── signin/               # Sign in page
│   │   ├── signup/               # Sign up page
│   │   ├── layout.js             # Root layout
│   │   ├── page.js               # Landing page
│   │   └── globals.css           # Global styles
│   ├── components/               # Reusable components
│   │   ├── WhiteboardCanvas.js   # tldraw canvas wrapper
│   │   └── LoadingSpinner.js     # Loading component
│   ├── contexts/                 # React contexts
│   │   └── AuthContext.js        # Authentication state
│   ├── lib/                      # Utilities
│   │   ├── prisma.js             # Prisma client
│   │   └── cognito.js            # AWS Amplify config
│   └── middleware.js             # Route protection
├── sync-server/                  # WebSocket sync server
│   └── server.mjs                # tldraw sync server
├── prisma/                       # Database
│   └── schema.prisma             # Database schema
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── package.json                  # Dependencies
├── next.config.js                # Next.js config
├── tailwind.config.js            # Tailwind config
└── Documentation files           # *.md files
```

## Key Files

### Application Core
- `src/app/layout.js` - Root layout with AuthProvider
- `src/contexts/AuthContext.js` - Authentication logic
- `src/middleware.js` - Route protection

### Pages
- `src/app/page.js` - Landing page
- `src/app/signin/page.js` - Sign in
- `src/app/signup/page.js` - Sign up with email verification
- `src/app/dashboard/page.js` - Board management
- `src/app/board/[id]/page.js` - Whiteboard canvas

### API Routes
- `src/app/api/boards/route.js` - Board CRUD
- `src/app/api/snapshots/route.js` - Snapshot save/load
- `src/app/api/collaborations/route.js` - Collaborator management
- `src/app/api/users/sync/route.js` - User sync with Cognito

### Components
- `src/components/WhiteboardCanvas.js` - tldraw integration with sync
- `src/components/LoadingSpinner.js` - Loading state

### Sync Server
- `sync-server/server.mjs` - WebSocket server for real-time collaboration

### Database
- `prisma/schema.prisma` - Database schema (User, Board, Snapshot, Collaboration)

## Configuration Files

- `.env` - Environment variables (not in git)
- `.env.example` - Environment template
- `package.json` - Dependencies and scripts
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `jsconfig.json` - Path aliases (@/)

## Documentation

- `README.md` - Project overview
- `GET_STARTED.md` - Getting started guide
- `QUICKSTART.md` - 5-minute setup
- `SETUP.md` - Detailed setup
- `DEPLOYMENT_GUIDE.md` - Production deployment
- `PROJECT_OVERVIEW.md` - Architecture details
- `ARCHITECTURE.md` - System diagrams
- `FEATURES.md` - Feature checklist
- `BUILD_SUMMARY.md` - Build summary
- `INDEX.md` - Documentation index
- `START_SERVERS.md` - Server startup guide
- `PROJECT_STRUCTURE.md` - This file

## Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "sync-server": "node sync-server/server.mjs",
  "dev:all": "concurrently \"npm run dev\" \"npm run sync-server\"",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:studio": "prisma studio"
}
```

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_AWS_REGION` - AWS region
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID` - Cognito pool ID
- `NEXT_PUBLIC_COGNITO_CLIENT_ID` - Cognito client ID
- `NEXT_PUBLIC_SYNC_SERVER_URL` - WebSocket server URL

## Dependencies

### Production
- `next` - React framework
- `react` & `react-dom` - React library
- `tldraw` - Canvas library
- `@tldraw/sync` - Real-time sync
- `@prisma/client` - Database ORM
- `aws-amplify` - AWS Cognito client
- `react-hot-toast` - Notifications
- `ws` - WebSocket server

### Development
- `prisma` - Database toolkit
- `tailwindcss` - CSS framework
- `autoprefixer` & `postcss` - CSS processing
- `concurrently` - Run multiple commands
- `dotenv` - Environment variables

## Data Flow

1. **Authentication**: User → Cognito → AuthContext → Protected Routes
2. **Board Management**: Dashboard → API Routes → Prisma → PostgreSQL
3. **Real-time Drawing**: Canvas → WebSocket → Sync Server → Other Clients
4. **Persistence**: Canvas → Save Button → API → PostgreSQL

## Security

- JWT tokens from AWS Cognito
- Route protection via middleware
- Ownership validation in API routes
- Role-based access control
- Secure WebSocket connections (wss:// in production)

## Deployment

- Next.js app: Vercel or AWS Elastic Beanstalk
- Sync server: VPS, EC2, or Docker
- Database: Neon, Supabase, or AWS RDS
- WebSocket: Nginx reverse proxy with SSL
