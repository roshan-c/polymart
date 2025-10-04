# Polymart Discord Bot (Simple)

A minimal Discord bot for Polymart prediction markets with just two commands:
- `/link` - Link your Discord account to Polymart
- `/create-poll` - Create a new prediction market poll

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
