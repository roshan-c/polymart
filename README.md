# Polymart

A prediction market platform where users can create polls, place bets, and track their performance.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js 15** - React framework with App Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Convex** - Reactive backend-as-a-service platform
- **Clerk** - Complete user authentication and management
- **Turborepo** - Optimized monorepo build system

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Convex Setup

This project uses Convex as a backend. Set it up first:

```bash
bun dev:setup
```

Follow the prompts to create a new Convex project and connect it to your application.

### 3. Clerk Authentication Setup

1. Create a Clerk account at [clerk.com](https://clerk.com)
2. Create a new application in the Clerk dashboard
3. Copy the **Publishable Key** from the Clerk dashboard
4. Create a `.env` file in `apps/web/` directory:

```bash
cp apps/web/.env.example apps/web/.env
```

5. Add your Clerk publishable key to `.env`:

```env
VITE_CONVEX_URL=<your-convex-url>
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

6. In the Clerk dashboard, configure Convex integration:
   - Go to **JWT Templates** → Click **New template** → Select **Convex**
   - Copy the **Issuer URL** (will be something like `https://your-app.clerk.accounts.dev`)
   
7. Configure Convex with Clerk:
   - Run `npx convex dev` if not already running
   - Go to your Convex dashboard → **Settings** → **Authentication**
   - Add Clerk as a provider using the Issuer URL from step 6

### 4. Run the Development Server

```bash
bun dev
```

Open [http://localhost:3001](http://localhost:3001) (or the port shown in terminal) in your browser to see the web application.

## How It Works

### Authentication
- Users sign in via Clerk authentication
- JWT tokens are validated by Convex backend
- User data is automatically synced to Convex database on first sign-in
- All backend mutations use authenticated sessions (no userId passed from frontend)

### Creating Polls
- Navigate to `/polls/create` or click "Create Poll" button
- Must be signed in to create polls
- Polls require a title and 2-10 outcomes
- Polls are created with "active" status

### Placing Bets
- Users can bet on any active poll
- Select an outcome and enter bet amount
- Bets are validated against user's point balance
- Probabilities update in real-time using market-making algorithm

### Admin Features
- Admin users can resolve or cancel polls
- Resolving distributes payouts to winning bets
- Cancelling refunds all bets

## Making a User an Admin

To grant admin privileges to a user:

1. Go to your Convex dashboard (URL shown when running `bun dev`)
2. Navigate to **Data** → **users** table
3. Find your user and copy their `_id`
4. Go to **Functions** → Find `users:makeAdmin`
5. Run the mutation with:
   ```json
   {
     "userId": "your-user-id-here"
   }
   ```
6. The user will now have access to admin features (resolve/cancel polls)







## Project Structure

```
polymart/
├── apps/
│   ├── web/         # Next.js 15 frontend application
├── packages/
│   └── backend/     # Convex backend functions and schema
```

## Available Scripts

- `bun dev`: Start all applications in development mode
- `bun build`: Build all applications
- `bun dev:web`: Start only the web application
- `bun dev:setup`: Setup and configure your Convex project
- `bun check-types`: Check TypeScript types across all apps
