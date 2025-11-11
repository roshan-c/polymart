import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const LINK_TOKEN_EXPIRY_MS = 10 * 60 * 1000;

function generateLinkToken(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let token = "";
	for (let i = 0; i < 32; i++) {
		token += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return token;
}

function generateApiKey(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let key = "pm_";
	for (let i = 0; i < 32; i++) {
		key += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return key;
}

export const initiateLinking = mutation({
	args: {
		platform: v.string(),
		platformUserId: v.string(),
		platformUserName: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const existingToken = await ctx.db
			.query("linkTokens")
			.withIndex("by_platform_user", (q) =>
				q.eq("platform", args.platform).eq("platformUserId", args.platformUserId)
			)
			.filter((q) => q.and(
				q.eq(q.field("used"), false),
				q.gt(q.field("expiresAt"), Date.now())
			))
			.first();

		if (existingToken) {
			return {
				token: existingToken.token,
				expiresIn: Math.floor((existingToken.expiresAt - Date.now()) / 1000),
			};
		}

		const token = generateLinkToken();
		const expiresAt = Date.now() + LINK_TOKEN_EXPIRY_MS;

		await ctx.db.insert("linkTokens", {
			token,
			platform: args.platform,
			platformUserId: args.platformUserId,
			platformUserName: args.platformUserName,
			expiresAt,
			used: false,
			createdAt: Date.now(),
		});

		return {
			token,
			expiresIn: Math.floor(LINK_TOKEN_EXPIRY_MS / 1000),
		};
	},
});

export const verifyLinkToken = mutation({
	args: {
		token: v.string(),
		scopes: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_authId", (q) => q.eq("authId", identity.subject))
			.first();

		if (!user) {
			throw new Error("User not found");
		}

		const linkToken = await ctx.db
			.query("linkTokens")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.first();

		if (!linkToken) {
			throw new Error("Invalid link token");
		}

		if (linkToken.used) {
			throw new Error("Link token already used");
		}

		if (linkToken.expiresAt < Date.now()) {
			throw new Error("Link token expired");
		}

		const existingAuth = await ctx.db
			.query("thirdPartyAuthorizations")
			.withIndex("by_platform_user", (q) =>
				q.eq("platform", linkToken.platform).eq("platformUserId", linkToken.platformUserId)
			)
			.first();

		if (existingAuth) {
			await ctx.db.patch(linkToken._id, { used: true });

			await ctx.db.patch(existingAuth._id, {
				active: true,
				lastUsedAt: Date.now(),
			});

			const apiKey = await ctx.db.get(existingAuth.apiKeyId);
			if (!apiKey) {
				throw new Error("API key not found");
			}

			return {
				success: true,
				platform: linkToken.platform,
				apiKey: apiKey.key,
			};
		}

		const apiKey = generateApiKey();
		const scopes = args.scopes || ["polls:read", "polls:create", "bets:place"];

		const apiKeyId = await ctx.db.insert("apiKeys", {
			userId: user._id,
			key: apiKey,
			name: `${linkToken.platform} - ${linkToken.platformUserName || linkToken.platformUserId}`,
			createdAt: Date.now(),
			active: true,
		});

		await ctx.db.insert("thirdPartyAuthorizations", {
			userId: user._id,
			platform: linkToken.platform,
			platformUserId: linkToken.platformUserId,
			apiKeyId,
			scopes,
			createdAt: Date.now(),
			active: true,
		});

		if (linkToken.platform === "discord") {
			await ctx.db.patch(user._id, { discordId: linkToken.platformUserId });
		}

		await ctx.db.patch(linkToken._id, { used: true });

		return {
			success: true,
			platform: linkToken.platform,
			apiKey,
		};
	},
});

export const getAuthorizationByPlatformUser = query({
	args: {
		platform: v.string(),
		platformUserId: v.string(),
	},
	handler: async (ctx, args) => {
		const auth = await ctx.db
			.query("thirdPartyAuthorizations")
			.withIndex("by_platform_user", (q) =>
				q.eq("platform", args.platform).eq("platformUserId", args.platformUserId)
			)
			.first();

		if (!auth || !auth.active) {
			return null;
		}

		const apiKey = await ctx.db.get(auth.apiKeyId);
		if (!apiKey || !apiKey.active) {
			return null;
		}

		return {
			apiKey: apiKey.key,
			scopes: auth.scopes,
		};
	},
});

export const getUserAuthorizations = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_authId", (q) => q.eq("authId", identity.subject))
			.first();

		if (!user) {
			return [];
		}

		const authorizations = await ctx.db
			.query("thirdPartyAuthorizations")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.collect();

		return await Promise.all(
			authorizations.map(async (auth) => {
				const apiKey = await ctx.db.get(auth.apiKeyId);
				return {
					_id: auth._id,
					platform: auth.platform,
					platformUserId: auth.platformUserId,
					scopes: auth.scopes,
					createdAt: auth.createdAt,
					lastUsedAt: auth.lastUsedAt,
					active: auth.active,
					apiKeyName: apiKey?.name,
				};
			})
		);
	},
});

export const revokeAuthorization = mutation({
	args: {
		authorizationId: v.id("thirdPartyAuthorizations"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_authId", (q) => q.eq("authId", identity.subject))
			.first();

		if (!user) {
			throw new Error("User not found");
		}

		const authorization = await ctx.db.get(args.authorizationId);
		if (!authorization) {
			throw new Error("Authorization not found");
		}

		if (authorization.userId !== user._id) {
			throw new Error("Unauthorized");
		}

		await ctx.db.patch(args.authorizationId, { active: false });

		await ctx.db.patch(authorization.apiKeyId, { active: false });

		return { success: true };
	},
});
