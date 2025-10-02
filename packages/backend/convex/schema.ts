import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	users: defineTable({
		name: v.string(),
		email: v.string(),
		clerkId: v.string(),
		pointBalance: v.number(),
		isAdmin: v.boolean(),
		createdAt: v.number(),
	})
		.index("by_clerkId", ["clerkId"])
		.index("by_email", ["email"]),

	polls: defineTable({
		title: v.string(),
		description: v.optional(v.string()),
		creatorId: v.id("users"),
		status: v.union(
			v.literal("active"),
			v.literal("resolved"),
			v.literal("cancelled")
		),
		createdAt: v.number(),
		resolvedAt: v.optional(v.number()),
		winningOutcomeId: v.optional(v.id("outcomes")),
		evidenceUrl: v.optional(v.string()),
		evidenceText: v.optional(v.string()),
	})
		.index("by_status", ["status"])
		.index("by_creator", ["creatorId"])
		.index("by_createdAt", ["createdAt"]),

	outcomes: defineTable({
		pollId: v.id("polls"),
		title: v.string(),
		totalShares: v.number(),
		order: v.number(),
	})
		.index("by_poll", ["pollId"])
		.index("by_poll_order", ["pollId", "order"]),

	bets: defineTable({
		userId: v.id("users"),
		pollId: v.id("polls"),
		outcomeId: v.id("outcomes"),
		pointsWagered: v.number(),
		sharesReceived: v.number(),
		createdAt: v.number(),
		settled: v.boolean(),
		payout: v.optional(v.number()),
	})
		.index("by_user", ["userId"])
		.index("by_poll", ["pollId"])
		.index("by_outcome", ["outcomeId"])
		.index("by_user_poll", ["userId", "pollId"])
		.index("by_settled", ["settled"]),

	apiKeys: defineTable({
		userId: v.id("users"),
		key: v.string(),
		name: v.string(),
		createdAt: v.number(),
		lastUsedAt: v.optional(v.number()),
		active: v.boolean(),
	})
		.index("by_key", ["key"])
		.index("by_user", ["userId"]),
});
