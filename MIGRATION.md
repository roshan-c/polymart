# Better-Auth Migration Summary

This document summarizes the migration from Clerk to better-auth authentication.

## Changes Made

### 1. Dependencies
- **Removed**: `@clerk/nextjs` (^6.33.2)
- **Added**: `better-auth` (^1.3.34)

### 2. Authentication Setup

#### Server Configuration (`apps/web/lib/auth.ts`)
- Configured better-auth with SQLite in-memory database
- Enabled email/password authentication
- Optional Discord OAuth (when credentials provided)
- Session management (7-day expiry, 24-hour update age)

#### Client Configuration (`apps/web/lib/auth-client.ts`)
- Created auth client hooks for React components
- Exports: `useSession`, `signIn`, `signUp`, `signOut`

#### API Routes
- **`/api/auth/[...all]`**: Handles all better-auth endpoints (sign-in, sign-up, sign-out, etc.)
- **`/api/auth/get-token`**: Generates JWT tokens for Convex backend integration

### 3. Frontend Changes

#### Components Updated
- **`providers.tsx`**: Replaced ClerkProvider with custom ConvexAuthProvider that fetches JWTs
- **`header-client.tsx`**: Replaced Clerk components with custom UI using better-auth hooks
- **`useCurrentUser.ts`**: Updated to use better-auth session instead of Clerk

#### Pages Updated
- **`/admin`**: Replaced SignInButton with Link to /sign-in
- **`/keys`**: Replaced SignInButton with Link to /sign-in
- **`/profile`**: Replaced SignInButton with Link to /sign-in
- **`/link`**: Updated to use better-auth useSession hook
- **`/polls/create`**: Replaced SignInButton with Link to /sign-in
- **`/polls/[pollId]`**: Replaced SignInButton with Link to /sign-in

#### New Pages
- **`/sign-in`**: Custom sign-in page with email/password and Discord OAuth
- **`/sign-up`**: Custom sign-up page with email/password

### 4. Middleware
- Replaced Clerk middleware with custom middleware
- Checks for better-auth session cookie
- Redirects to /sign-in if not authenticated
- Public routes: `/`, `/polls/*`, `/api/og/*`, `/sign-in`, `/sign-up`, `/api/auth/*`

### 5. Backend (Convex) Changes

#### Auth Configuration (`packages/backend/convex/auth.config.ts`)
- Updated to validate JWTs from better-auth
- Issuer: `BETTER_AUTH_URL` (default: http://localhost:3001)
- Application ID: `polymart`

#### Schema (`packages/backend/convex/schema.ts`)
- Renamed `clerkId` field to `authId`
- Updated index from `by_clerkId` to `by_authId`

#### Files Updated (all `clerkId` → `authId`)
- `admin.ts`
- `apiKeys.ts`
- `bets.ts`
- `polls.ts`
- `thirdPartyAuth.ts`
- `users.ts`

#### Migration Script (`packages/backend/convex/migrations.ts`)
- Added `migrateAuthIdField` mutation to migrate existing users

### 6. Environment Variables

Updated `.env.example`:
```env
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3001
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3001
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

### 7. Documentation
- Updated README.md with better-auth setup instructions
- Removed Clerk-specific instructions
- Added Discord OAuth setup steps

## How It Works

### Authentication Flow

1. **Sign Up/Sign In**
   - User visits `/sign-in` or `/sign-up`
   - Submits email/password or clicks Discord OAuth
   - Better-auth creates session and sets cookie
   - User redirected to home page

2. **Session Management**
   - Better-auth maintains session via `better-auth.session_token` cookie
   - Frontend uses `useSession()` hook to check authentication status
   - Session validated on each request via middleware

3. **Convex Integration**
   - When Convex query/mutation is called, ConvexProvider needs JWT
   - Frontend calls `/api/auth/get-token` with session cookie
   - Endpoint validates session and generates JWT with user claims
   - JWT signed with `BETTER_AUTH_SECRET` and includes:
     - `sub`: User ID
     - `email`: User email
     - `name`: User name
     - `iss`: Better-auth URL
     - `aud`: "polymart"
   - Convex validates JWT and extracts user identity
   - User synced to database on first access

4. **User Sync**
   - On first authenticated request to Convex:
     - `getCurrentUser` query checks for user with authId
     - If not found, `syncUser` mutation creates user
     - User initialized with:
       - `authId`: JWT subject (user ID)
       - `email`: From JWT claims
       - `name`: From JWT claims
       - `pointBalance`: 1000 (initial)
       - `isAdmin`: false
       - `createdAt`: Current timestamp

## Testing Checklist

### Prerequisites
1. Install dependencies: `bun install`
2. Set up Convex: `bun dev:setup`
3. Create `.env` file with required variables
4. Generate a random secret for `BETTER_AUTH_SECRET`

### Basic Authentication
- [ ] Sign up with email/password
- [ ] Sign in with email/password
- [ ] Sign out
- [ ] Session persists on page refresh
- [ ] Middleware redirects unauthenticated users

### Discord OAuth (Optional)
- [ ] Set up Discord OAuth app
- [ ] Add credentials to `.env`
- [ ] Sign in with Discord
- [ ] Verify Discord profile synced

### Convex Integration
- [ ] User created in database on first sign-in
- [ ] `getCurrentUser` returns correct user
- [ ] Authenticated mutations work (create poll, place bet, etc.)
- [ ] Unauthenticated requests rejected

### Migration (Existing Data)
- [ ] Run `migrateAuthIdField` mutation in Convex dashboard
- [ ] Verify existing users have `authId` field
- [ ] Verify users can still access their data

## Known Limitations

1. **Database**: Using SQLite in-memory (data lost on restart)
   - **Fix**: Configure persistent database adapter for production

2. **Discord OAuth**: Requires manual setup
   - **Fix**: Add credentials to environment variables

3. **Email Verification**: Not implemented
   - **Fix**: Add better-auth email plugin

4. **Password Reset**: Not implemented
   - **Fix**: Add better-auth password reset functionality

5. **Rate Limiting**: Not configured
   - **Fix**: Add rate limiting middleware

## Production Deployment

### Required Changes

1. **Database**
   ```typescript
   // lib/auth.ts
   database: {
     provider: "postgresql", // or mysql, etc.
     url: process.env.DATABASE_URL,
   }
   ```

2. **Secret**
   - Generate strong random secret: `openssl rand -base64 32`
   - Set in production environment

3. **URLs**
   - Update `BETTER_AUTH_URL` to production domain
   - Update `NEXT_PUBLIC_APP_URL` to production domain

4. **Discord OAuth**
   - Update callback URL in Discord app settings
   - Use production CLIENT_ID and CLIENT_SECRET

5. **Convex**
   - Update auth provider domain in Convex dashboard
   - Set to production BETTER_AUTH_URL

### Security Considerations

1. Enable HTTPS in production
2. Set secure cookie flags
3. Configure CORS properly
4. Add rate limiting
5. Implement email verification
6. Add 2FA support (optional)
7. Monitor authentication failures
8. Set up logging and alerting

## Rollback Plan

If issues occur:

1. Revert to previous commit
2. Reinstall `@clerk/nextjs`
3. Update Convex auth config back to Clerk
4. Redeploy

Migration is reversible if `authId` field contains original Clerk IDs.

## Support

For issues or questions:
1. Check better-auth documentation: https://better-auth.com
2. Review Convex auth docs: https://docs.convex.dev/auth
3. Create GitHub issue with details
