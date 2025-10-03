import 'dotenv/config';

export const config = {
  discordToken: process.env.DISCORD_TOKEN!,
  discordClientId: process.env.DISCORD_CLIENT_ID!,
  polymartApiKey: process.env.POLYMART_API_KEY!,
  polymartApiBase: process.env.POLYMART_API_BASE || 'https://youthful-lark-845.convex.cloud',
};

if (!config.discordToken || !config.discordClientId || !config.polymartApiKey) {
  throw new Error('Missing required environment variables. Check .env file.');
}
