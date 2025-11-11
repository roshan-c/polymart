import { betterAuth } from "better-auth";

export const auth = betterAuth({
	database: {
		provider: "sqlite",
		url: ":memory:",
	},
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		discord: {
			clientId: process.env.DISCORD_CLIENT_ID || "",
			clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
			enabled: !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET),
		},
	},
	secret: process.env.BETTER_AUTH_SECRET || "secret-key-for-development-only",
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
	},
});

export { auth as betterAuthInstance };
