# Polymart

A prediction market platform where users can create polls, place bets, and track their performance.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js 15** - React framework with App Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Convex** - Reactive backend-as-a-service platform
- **better-auth** - Modern authentication framework for TypeScript
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

### 3. Better-Auth Authentication Setup

1. Create a `.env` file in `apps/web/` directory:

```bash
cp apps/web/.env.example apps/web/.env
```

2. Add your configuration to `.env`:

```env
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
NEXT_PUBLIC_APP_URL=http://localhost:3001
BETTER_AUTH_SECRET=<generate-a-random-secret>
BETTER_AUTH_URL=http://localhost:3001
```

3. (Optional) For Discord OAuth, add:

```env
DISCORD_CLIENT_ID=<your-discord-client-id>
DISCORD_CLIENT_SECRET=<your-discord-client-secret>
```

To set up Discord OAuth:
- Go to [Discord Developer Portal](https://discord.com/developers/applications)
- Create a new application
- Go to OAuth2 section
- Add redirect URL: `http://localhost:3001/api/auth/callback/discord`
- Copy Client ID and Client Secret

4. Configure Convex with better-auth:
   - Run `npx convex dev` if not already running
   - Go to your Convex dashboard → **Settings** → **Authentication**
   - Add a custom JWT provider with:
     - Issuer: `http://localhost:3001` (or your BETTER_AUTH_URL)
     - Application ID: `polymart`

### 4. Run the Development Server

```bash
bun dev
```

Open [http://localhost:3001](http://localhost:3001) (or the port shown in terminal) in your browser to see the web application.

## How It Works

### Authentication
- Users sign in via better-auth (email/password or Discord OAuth)
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

## Using the API

Polymart provides a TypeScript SDK for easy integration with external applications. The SDK is available in the `packages/sdk` directory.

### Installation

```bash
npm install @polymart/sdk
```

### Quick Start

```typescript
import { PolymartSDK } from '@polymart/sdk';

const client = new PolymartSDK({
	apiKey: 'your_api_key_here'
});

const { polls } = await client.getPolls({ status: 'active' });
console.log(polls);
```

For detailed SDK documentation, see [packages/sdk/README.md](./packages/sdk/README.md).

For API documentation without the SDK, see [API.md](./API.md).







## Project Structure

```
polymart/
├── apps/
│   ├── web/         # Next.js 15 frontend application
├── packages/
│   ├── backend/     # Convex backend functions and schema
│   └── sdk/         # TypeScript SDK for the Polymart API
```

## Available Scripts

- `bun dev`: Start all applications in development mode
- `bun build`: Build all applications
- `bun dev:web`: Start only the web application
- `bun dev:setup`: Setup and configure your Convex project
- `bun check-types`: Check TypeScript types across all apps
