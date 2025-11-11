import { betterAuth } from "better-auth";

export const auth = betterAuth({
	database: {
		provider: "memory",
		type: "memory",
	},
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		discord: {
			clientId: process.env.DISCORD_CLIENT_ID || "",
			clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
	},
	advanced: {
		generateId: () => {
			return crypto.randomUUID();
		},
	},
});
