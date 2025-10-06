# Polymart Discord Bot (Simple)

A Discord bot for Polymart prediction markets with full API integration.

## Commands

### User Commands

- **`/link`** - Link your Discord account to Polymart
- **`/create-poll`** - Create a new prediction market poll
- **`/bet`** - Place a bet on a poll outcome
- **`/polls`** - List prediction market polls (filter by status)
- **`/poll`** - View details of a specific poll
- **`/my-bets`** - View your betting history
- **`/profile`** - View user profile and stats

### Admin Commands

- **`/resolve-poll`** - Resolve a poll with a winning outcome (requires admin privileges)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   - `DISCORD_TOKEN` - Your Discord bot token
   - `DISCORD_CLIENT_ID` - Your Discord application client ID
   - `POLYMART_API_BASE` - Polymart API base URL (default: https://youthful-lark-845.convex.site)

3. **Deploy slash commands:**
   ```bash
   npm run deploy-commands
   ```

4. **Start the bot:**
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

## Usage

### Linking Your Account

1. Run `/link` in Discord
2. Click the provided link
3. Sign in with your Polymart account
4. Authorize the connection

### Creating Polls

Once linked, use `/create-poll` with:
- **title**: The poll question
- **outcomes**: Comma-separated outcomes (e.g., "Yes,No")
- **description** (optional): Additional poll details

Example:
```
/create-poll title:"Will it rain tomorrow?" outcomes:"Yes,No" description:"Weather forecast poll"
```

### Browsing Polls

Use `/polls` to list all polls, or filter by status:
```
/polls status:active
```

Use `/poll` to view detailed information about a specific poll:
```
/poll poll-id:abc123
```

### Placing Bets

Use `/bet` to place a bet on a poll outcome:
```
/bet poll-id:abc123 outcome-id:out1 points:100
```

### Viewing Your Activity

Use `/my-bets` to see all your bets:
```
/my-bets
```

Use `/profile` to view your stats or another user's stats:
```
/profile
/profile user:@username
```

### Resolving Polls (Admin Only)

Admins can resolve polls with `/resolve-poll`:
```
/resolve-poll poll-id:abc123 winning-outcome-id:out1 evidence-url:https://example.com/proof
```

## Architecture

This bot uses per-user API keys for authentication:
- Each Discord user links their account once
- API keys are stored securely in Polymart
- All poll creation uses the user's own API key
- No master API key needed

## Commands

- `npm start` - Start the bot
- `npm run dev` - Start with auto-reload
- `npm run deploy-commands` - Deploy slash commands to Discord
