# Polymart Discord Bot

A Discord bot for interacting with Polymart prediction markets directly from Discord.

## Features

- 📊 List active, resolved, or all polls
- 🔍 View detailed poll information with probabilities
- ➕ Create new prediction markets
- 💰 Place bets on outcomes
- 🎨 Rich embeds with market data

## Commands

- `/polls [status]` - List all polls (optionally filter by active/resolved/cancelled)
- `/poll <id>` - View details of a specific poll
- `/create-poll <title> <outcomes> [description]` - Create a new poll
  - Example: `/create-poll title:"Will it rain?" outcomes:"Yes,No" description:"Tomorrow's weather"`
- `/bet <poll-id> <outcome-id> <points>` - Place a bet on a poll outcome

## Setup

### Prerequisites

1. Node.js 18+ or Bun
2. A Discord Bot Token ([Create one here](https://discord.com/developers/applications))
3. A Polymart API Key ([Get one here](https://polymart.xyz/keys))

### Installation

1. Navigate to the bot directory:
```bash
cd apps/discord-bot
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Fill in your `.env` file:
```env
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
POLYMART_API_KEY=your_polymart_api_key_here
POLYMART_API_BASE=https://youthful-lark-845.convex.site
```

### Getting Discord Credentials

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select an existing one
3. Go to the "Bot" section and create a bot
4. Copy the bot token → `DISCORD_TOKEN`
5. Go to "OAuth2" → "General" and copy the Application ID → `DISCORD_CLIENT_ID`
6. Under "OAuth2" → "URL Generator":
   - Select scopes: `bot`, `applications.commands`
   - Select permissions: `Send Messages`, `Embed Links`, `Read Message History`
   - Copy the generated URL and invite the bot to your server

### Deploy Commands

Before running the bot for the first time, deploy the slash commands:

```bash
npm run deploy
# or
bun run deploy
```

### Run the Bot

Development mode (with auto-reload):
```bash
npm run dev
# or
bun run dev
```

Production mode:
```bash
npm run build
npm start
# or
bun run build
bun start
```

## Usage Examples

### List Active Polls
```
/polls status:active
```

### View Poll Details
```
/poll id:abc123
```

### Create a Poll
```
/create-poll title:"Will Bitcoin hit $100k in 2025?" outcomes:"Yes,No" description:"Market closes Dec 31, 2025"
```

### Place a Bet
```
/bet poll-id:abc123 outcome-id:out1 points:100
```

## Project Structure

```
apps/discord-bot/
├── src/
│   ├── commands/           # Slash command handlers
│   │   ├── polls.ts       # List polls
│   │   ├── poll.ts        # View poll details
│   │   ├── create-poll.ts # Create new poll
│   │   └── bet.ts         # Place bet
│   ├── api.ts             # Polymart API client
│   ├── config.ts          # Configuration
│   ├── index.ts           # Bot entry point
│   └── deploy-commands.ts # Command deployment script
├── .env.example           # Environment template
├── .gitignore
├── package.json
└── tsconfig.json
```

## API Integration

The bot uses the Polymart HTTP API. See [API.md](../../API.md) for full API documentation.

## Troubleshooting

### Commands not showing up in Discord
- Make sure you ran `npm run deploy` after creating the bot
- Wait a few minutes for Discord to sync the commands
- Try kicking and re-inviting the bot

### "Missing required environment variables" error
- Check that your `.env` file exists and has all required variables
- Make sure there are no extra spaces in your `.env` file

### "Unauthorized" errors when creating polls or placing bets
- Verify your Polymart API key is correct
- Make sure you have sufficient permissions on Polymart

### "Poll not found" errors
- Double-check the poll ID is correct
- Use `/polls` to see available poll IDs

## License

MIT
