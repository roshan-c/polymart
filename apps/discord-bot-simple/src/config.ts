import { config as dotenvConfig } from "dotenv";

dotenvConfig();

export const config = {
	discordToken: process.env.DISCORD_TOKEN!,
	discordClientId: process.env.DISCORD_CLIENT_ID!,
	polymartApiBase: process.env.POLYMART_API_BASE || "https://youthful-lark-845.convex.site",
};
