import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

function generateApiKey(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let key = "pm_";
	for (let i = 0; i < 32; i++) {
		key += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return key;
}

export const createApiKey = mutation({
	args: {
		name: v.string(),
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

		const key = generateApiKey();

		const keyId = await ctx.db.insert("apiKeys", {
			userId: user._id,
			key,
			name: args.name,
			createdAt: Date.now(),
			active: true,
		});

		return await ctx.db.get(keyId);
	},
});

export const getUserApiKeys = query({
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

		return await ctx.db
			.query("apiKeys")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.collect();
	},
});

export const revokeApiKey = mutation({
	args: {
		keyId: v.id("apiKeys"),
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

		const apiKey = await ctx.db.get(args.keyId);
		if (!apiKey) {
			throw new Error("API key not found");
		}

		if (apiKey.userId !== user._id) {
			throw new Error("Unauthorized");
		}

		await ctx.db.patch(args.keyId, { active: false });
		return { success: true };
	},
});

export const validateApiKey = query({
	args: {
		key: v.string(),
	},
	handler: async (ctx, args) => {
		const apiKey = await ctx.db
			.query("apiKeys")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first();

		if (!apiKey || !apiKey.active) {
			return null;
		}

		const user = await ctx.db.get(apiKey.userId);
		return { apiKey, user };
	},
});
