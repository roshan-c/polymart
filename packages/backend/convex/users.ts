import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

const INITIAL_POINT_BALANCE = 1000;

async function getAuthenticatedUserId(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Not authenticated");
	}
	
	const user = await ctx.db
		.query("users")
		.withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
		.first();
	
	if (!user) {
		throw new Error("User not found");
	}
	
	return user._id;
}

async function ensureUserExists(ctx: MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Not authenticated");
	}
	
	const existing = await ctx.db
		.query("users")
		.withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
		.first();
	
	if (existing) {
		return existing._id;
	}
	
	const userId = await ctx.db.insert("users", {
		clerkId: identity.subject,
		email: identity.email || "",
		name: identity.name || "User",
		pointBalance: INITIAL_POINT_BALANCE,
		isAdmin: false,
		createdAt: Date.now(),
	});
	
	return userId;
}

export const syncUser = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await ensureUserExists(ctx);
		const user = await ctx.db.get(userId);
		return user;
	},
});

export const createOrGetUser = mutation({
	args: {
		clerkId: v.string(),
		email: v.string(),
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
			.first();

		if (existingUser) {
			return existingUser;
		}

		const userId = await ctx.db.insert("users", {
			clerkId: args.clerkId,
			email: args.email,
			name: args.name,
			pointBalance: INITIAL_POINT_BALANCE,
			isAdmin: false,
			createdAt: Date.now(),
		});

		return await ctx.db.get(userId);
	},
});

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}
		
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
			.first();
		
		return user ?? null;
	},
});

export const getUser = query({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.userId);
	},
});

export const getUserStats = query({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user) return null;

		const allBets = await ctx.db
			.query("bets")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.collect();

		const settledBets = allBets.filter((bet) => bet.settled);
		const activeBets = allBets.filter((bet) => !bet.settled);

		const totalWagered = allBets.reduce(
			(sum, bet) => sum + bet.pointsWagered,
			0
		);
		const totalPayout = settledBets.reduce(
			(sum, bet) => sum + (bet.payout || 0),
			0
		);
		const netProfit = totalPayout - totalWagered;

		return {
			pointBalance: user.pointBalance,
			totalBets: allBets.length,
			activeBets: activeBets.length,
			settledBets: settledBets.length,
			totalWagered,
			totalPayout,
			netProfit,
		};
	},
});

export const makeAdmin = mutation({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.userId, { isAdmin: true });
		return { success: true };
	},
});

export const getUserByDiscordId = query({
	args: {
		discordId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_discordId", (q) => q.eq("discordId", args.discordId))
			.first();
		
		return user ?? null;
	},
});

export const updateDiscordId = mutation({
	args: {
		discordId: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}
		
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
			.first();
		
		if (!user) {
			throw new Error("User not found");
		}
		
		await ctx.db.patch(user._id, { discordId: args.discordId });
		return { success: true };
	},
});
