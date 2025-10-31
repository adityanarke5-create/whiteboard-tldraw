# Collaborative Whiteboard - Project Overview

## Application Architecture

### Frontend Architecture
- **Framework**: Next.js 14 with App Router
- **Language**: JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **State Management**: React Context API (AuthContext)
- **Drawing Library**: tldraw v2

### Backend Architecture
- **API**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: AWS Cognito via AWS Amplify

### Data Flow

```
User → Next.js Frontend → API Routes → Prisma → PostgreSQL
                ↓
         AWS Cognito (Auth)
                ↓
         tldraw Canvas (Drawing)
```

## Key Features Implementation

### 1. Authentication Flow

**Sign Up**:
1. User enters email, password, name
2. AWS Amplify calls Cognito SignUp API
3. Cognito sends verification email
4. User verifies email
5. User can sign in

**Sign In**:
1. User enters email, password
2. AWS Amplify calls Cognito SignIn API
3. Cognito returns JWT tokens
4. Tokens stored in AuthContext
5. User redirected to dashboard

**Protected Routes**:
- Dashboard and Board pages check for authenticated user
- Redirect to /signin if not authenticated

### 2. Board Management

**Create Board**:
1. User clicks "Create New Board" on dashboard
2. Modal opens for board title input
3. POST request to `/api/boards`
4. Prisma creates Board record
5. User redirected to board canvas

**List Boards**:
1. Dashboard fetches boards via GET `/api/boards?userId={id}`
2. Prisma queries boards where user is owner or collaborator
3. Boards displayed as cards with thumbnails

**Delete Board**:
1. Owner clicks delete on board card
2. Confirmation dialog
3. DELETE request to `/api/boards`
4. Prisma deletes board (cascades to snapshots and collaborations)

### 3. Whiteboard Canvas

**tldraw Integration**:
- WhiteboardCanvas component wraps Tldraw component
- Dynamic import to avoid SSR issues
- Canvas mounted with initial snapshot if available

**Drawing Tools** (provided by tldraw):
- Select tool
- Draw/pen tool
- Shapes: rectangle, circle, arrow, line
- Text tool
- Eraser
- Pan and zoom

**Auto-Save**:
- Every 2 minutes, canvas state saved to database
- Uses tldraw's `editor.store.getSnapshot()` API
- POST to `/api/snapshots` with board ID and snapshot data

**Manual Save**:
- "Save" button in toolbar
- Immediately saves current canvas state
- Shows success toast notification

**Export**:
- JSON: Full canvas snapshot as JSON file
- SVG: Vector export of canvas
- PNG: Raster image export
- Uses tldraw's `exportToBlob` API

### 4. Collaboration

**Share Board**:
1. Owner clicks "Share" button
2. Modal shows shareable link
3. Owner can copy link to clipboard

**Add Collaborator**:
1. Owner enters collaborator email
2. Selects role (editor or viewer)
3. POST to `/api/collaborations`
4. Prisma creates Collaboration record
5. Collaborator can access board via link

**Role-Based Access**:
- **Owner**: Full control, can delete board, manage collaborators
- **Editor**: Can draw and edit canvas
- **Viewer**: Read-only, cannot edit canvas (enforced by tldraw)

**Real-Time Sync** (optional enhancement):
- Can integrate tldraw-sync-server for WebSocket-based real-time collaboration
- Multiple users see each other's cursors and edits in real-time

### 5. Snapshot System

**Purpose**:
- Preserve board state over time
- Enable version history (future enhancement)
- Restore board state on reload

**Storage**:
- Snapshots stored as JSON in PostgreSQL
- Each snapshot linked to board via foreign key
- Timestamps for each snapshot

**Loading**:
- When board opens, fetch latest snapshot
- Use `editor.store.loadSnapshot()` to restore state

**Cleanup** (future enhancement):
- Keep only last N snapshots per board
- Delete old snapshots to save space

## Database Schema Details

### User Table
- `id`: UUID, primary key
- `email`: Unique email address
- `name`: Optional display name
- Relations: boards (one-to-many), collaborations (one-to-many)

### Board Table
- `id`: UUID, primary key
- `title`: Board name
- `ownerId`: Foreign key to User
- `createdAt`: Timestamp
- `updatedAt`: Timestamp (auto-updated)
- Relations: owner (many-to-one), snapshots (one-to-many), collaborators (one-to-many)

### Snapshot Table
- `id`: UUID, primary key
- `boardId`: Foreign key to Board
- `data`: JSON blob (tldraw snapshot)
- `createdAt`: Timestamp
- Relations: board (many-to-one)
- Cascade delete: When board deleted, snapshots deleted

### Collaboration Table
- `id`: UUID, primary key
- `boardId`: Foreign key to Board
- `userId`: Foreign key to User
- `role`: String ("editor" or "viewer")
- Relations: board (many-to-one), user (many-to-one)
- Cascade delete: When board deleted, collaborations deleted

## API Endpoints

### Boards API (`/api/boards`)

**GET** - List boards
- Query params: `userId`
- Returns: Array of boards (owned + collaborated)
- Includes: owner info, collaborators, latest snapshot

**POST** - Create board
- Body: `{ title, userId, userEmail }`
- Creates user if doesn't exist
- Returns: Created board object

**DELETE** - Delete board
- Query params: `boardId`, `userId`
- Validates ownership
- Returns: Success status

### Snapshots API (`/api/snapshots`)

**POST** - Save snapshot
- Body: `{ boardId, data }`
- Creates snapshot record
- Updates board's updatedAt timestamp
- Returns: Created snapshot object

**GET** - Get latest snapshot
- Query params: `boardId`
- Returns: Most recent snapshot for board

### Collaborations API (`/api/collaborations`)

**POST** - Add collaborator
- Body: `{ boardId, userEmail, role, ownerId }`
- Validates ownership
- Checks if user exists
- Prevents duplicate collaborations
- Returns: Created collaboration object

**DELETE** - Remove collaborator
- Query params: `collaborationId`, `ownerId`, `boardId`
- Validates ownership
- Returns: Success status

## Security Considerations

### Authentication
- JWT tokens from AWS Cognito
- Tokens validated on each API request (should add middleware)
- Tokens stored in memory (AuthContext)

### Authorization
- Board ownership checked before delete/modify operations
- Collaboration role enforced on canvas (viewer mode)
- User can only access boards they own or are invited to

### Data Validation
- Required fields validated in API routes
- Email format validated by Cognito
- Password strength enforced by Cognito

### Future Security Enhancements
- Add API middleware to validate JWT tokens
- Implement rate limiting
- Add CSRF protection
- Sanitize user inputs
- Add audit logging

## Performance Optimizations

### Current
- Dynamic import for tldraw (reduces initial bundle)
- Prisma connection pooling
- Auto-save debounced to 2 minutes
- Lazy loading of board snapshots

### Future Enhancements
- Implement Redis caching for board metadata
- Use CDN for static assets
- Optimize snapshot storage (compression)
- Implement pagination for board list
- Add image optimization for thumbnails
- Use React.memo for expensive components

## Scalability Considerations

### Current Architecture
- Serverless API routes (auto-scales)
- PostgreSQL (vertical scaling)
- Stateless frontend

### Scaling Strategy
1. **Database**: 
   - Use connection pooling (Prisma Accelerate)
   - Read replicas for board listings
   - Partition snapshots by date

2. **API**:
   - Already serverless (scales automatically)
   - Add caching layer (Redis)
   - Implement rate limiting

3. **Real-Time**:
   - Deploy tldraw-sync-server on separate instances
   - Use WebSocket load balancer
   - Implement room-based sharding

4. **Storage**:
   - Move snapshots to S3 for large boards
   - Implement CDN for exports
   - Compress snapshot data

## Deployment Architecture (AWS)

```
Route 53 (DNS)
    ↓
CloudFront (CDN)
    ↓
Elastic Beanstalk (Next.js App)
    ↓
RDS PostgreSQL (Database)
    ↓
Cognito (Authentication)
```

### AWS Services Used
- **Elastic Beanstalk**: Host Next.js application
- **RDS PostgreSQL**: Managed database
- **Cognito**: User authentication
- **Route 53**: DNS management
- **CloudFront**: CDN for static assets
- **S3**: Store exports and snapshots (optional)
- **CloudWatch**: Monitoring and logs

## Development Workflow

1. **Local Development**:
   - Run PostgreSQL locally or via Docker
   - Use Cognito dev user pool
   - Run Next.js dev server
   - Use Prisma Studio for database inspection

2. **Testing**:
   - Manual testing in browser
   - Test authentication flow
   - Test board CRUD operations
   - Test collaboration features

3. **Deployment**:
   - Build Next.js application
   - Run database migrations
   - Deploy to Elastic Beanstalk
   - Configure environment variables
   - Test production deployment

## Future Enhancements

### Short-term
- [ ] Add board thumbnails (canvas preview)
- [ ] Implement search/filter for boards
- [ ] Add user profile page
- [ ] Implement board templates
- [ ] Add undo/redo history

### Medium-term
- [ ] Real-time collaboration with sync server
- [ ] Live cursors showing collaborators
- [ ] Comments and annotations
- [ ] Version history for boards
- [ ] Board folders/organization

### Long-term
- [ ] Mobile app (React Native)
- [ ] Offline mode with sync
- [ ] AI-powered drawing assistance
- [ ] Integration with other tools (Slack, etc.)
- [ ] Advanced permissions (team workspaces)

## Monitoring and Maintenance

### Metrics to Track
- User sign-ups and active users
- Boards created per day
- Average board size (snapshot data)
- API response times
- Database query performance
- Error rates

### Maintenance Tasks
- Regular database backups
- Clean up old snapshots
- Monitor disk usage
- Update dependencies
- Security patches
- Performance optimization

## Cost Estimation (AWS)

### Development
- Elastic Beanstalk (t3.micro): ~$10/month
- RDS PostgreSQL (db.t3.micro): ~$15/month
- Cognito: Free tier (50,000 MAU)
- Total: ~$25/month

### Production (small scale)
- Elastic Beanstalk (t3.small): ~$20/month
- RDS PostgreSQL (db.t3.small): ~$30/month
- Cognito: Free tier
- CloudFront: ~$5/month
- Total: ~$55/month

### Production (medium scale)
- Elastic Beanstalk (t3.medium, 2 instances): ~$80/month
- RDS PostgreSQL (db.t3.medium): ~$60/month
- Cognito: ~$10/month (100K MAU)
- CloudFront: ~$20/month
- S3: ~$5/month
- Total: ~$175/month

## Conclusion

This collaborative whiteboard application provides a solid foundation for real-time drawing and collaboration. The architecture is scalable, secure, and follows modern web development best practices. The use of Next.js, tldraw, and AWS services ensures a robust and maintainable application.
