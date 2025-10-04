import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
	args: {
		title: v.string(),
		description: v.optional(v.string()),
		outcomes: v.array(v.string()),
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

		if (args.outcomes.length < 2 || args.outcomes.length > 10) {
			throw new Error("Polls must have between 2 and 10 outcomes");
		}

		const pollId = await ctx.db.insert("polls", {
			title: args.title,
			description: args.description,
			creatorId: user._id,
			status: "active",
			createdAt: Date.now(),
		});

		for (let i = 0; i < args.outcomes.length; i++) {
			await ctx.db.insert("outcomes", {
				pollId,
				title: args.outcomes[i],
				totalShares: 100,
				order: i,
			});
		}

		return pollId;
	},
});

export const getAll = query({
	args: {
		status: v.optional(v.union(
			v.literal("active"),
			v.literal("resolved"),
			v.literal("cancelled")
		)),
	},
	handler: async (ctx, args) => {
		const polls = args.status
			? await ctx.db
					.query("polls")
					.withIndex("by_status", (q) => q.eq("status", args.status!))
					.order("desc")
					.collect()
			: await ctx.db.query("polls").order("desc").collect();

		const pollsWithDetails = await Promise.all(
			polls.map(async (poll) => {
				const outcomes = await ctx.db
					.query("outcomes")
					.withIndex("by_poll", (q) => q.eq("pollId", poll._id))
					.order("asc")
					.collect();

				const creator = await ctx.db.get(poll.creatorId);

				const totalBets = await ctx.db
					.query("bets")
					.withIndex("by_poll", (q) => q.eq("pollId", poll._id))
					.collect();

				const totalVolume = totalBets.reduce(
					(sum, bet) => sum + bet.pointsWagered,
					0
				);

				const outcomesWithProbabilities = outcomes.map((outcome) => {
					const outcomeBets = totalBets.filter(
						(bet) => bet.outcomeId === outcome._id
					);
					const outcomeVolume = outcomeBets.reduce(
						(sum, bet) => sum + bet.pointsWagered,
						0
					);
					const probability =
						totalVolume > 0 ? (outcomeVolume / totalVolume) * 100 : 0;

					return {
						...outcome,
						probability,
						volume: outcomeVolume,
						betCount: outcomeBets.length,
					};
				});

				return {
					...poll,
					outcomes: outcomesWithProbabilities,
					creator,
					totalVolume,
					totalBets: totalBets.length,
				};
			})
		);

		return pollsWithDetails;
	},
});

export const get = query({
	args: {
		pollId: v.id("polls"),
	},
	handler: async (ctx, args) => {
		const poll = await ctx.db.get(args.pollId);
		if (!poll) return null;

		const outcomes = await ctx.db
			.query("outcomes")
			.withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
			.order("asc")
			.collect();

		const creator = await ctx.db.get(poll.creatorId);

		const allBets = await ctx.db
			.query("bets")
			.withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
			.collect();

		const totalVolume = allBets.reduce(
			(sum, bet) => sum + bet.pointsWagered,
			0
		);

		const outcomesWithProbabilities = outcomes.map((outcome) => {
			const outcomeBets = allBets.filter(
				(bet) => bet.outcomeId === outcome._id
			);
			const outcomeVolume = outcomeBets.reduce(
				(sum, bet) => sum + bet.pointsWagered,
				0
			);
			const probability =
				totalVolume > 0 ? (outcomeVolume / totalVolume) * 100 : 0;

			return {
				...outcome,
				probability,
				volume: outcomeVolume,
				betCount: outcomeBets.length,
			};
		});

		return {
			...poll,
			outcomes: outcomesWithProbabilities,
			creator,
			totalVolume,
			totalBets: allBets.length,
		};
	},
});

export const getUserPolls = query({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const polls = await ctx.db
			.query("polls")
			.withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
			.order("desc")
			.collect();

		return polls;
	},
});

export const getProbabilityHistory = query({
	args: {
		pollId: v.id("polls"),
	},
	handler: async (ctx, args) => {
		const history = await ctx.db
			.query("probabilityHistory")
			.withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
			.collect();

		const outcomes = await ctx.db
			.query("outcomes")
			.withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
			.collect();

		const groupedByTimestamp: Record<number, Record<string, number>> = {};

		for (const entry of history) {
			if (!groupedByTimestamp[entry.timestamp]) {
				groupedByTimestamp[entry.timestamp] = {};
			}
			const outcome = outcomes.find((o) => o._id === entry.outcomeId);
			if (outcome) {
				groupedByTimestamp[entry.timestamp][outcome.title] = entry.probability;
			}
		}

		const formattedHistory = Object.entries(groupedByTimestamp)
			.map(([timestamp, probabilities]) => ({
				timestamp: Number(timestamp),
				...probabilities,
			}))
			.sort((a, b) => a.timestamp - b.timestamp);

		return {
			history: formattedHistory,
			outcomes: outcomes.map((o) => o.title),
		};
	},
});

export const createWithAuth = mutation({
	args: {
		userId: v.id("users"),
		title: v.string(),
		description: v.optional(v.string()),
		outcomes: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		if (args.outcomes.length < 2 || args.outcomes.length > 10) {
			throw new Error("Polls must have between 2 and 10 outcomes");
		}

		const pollId = await ctx.db.insert("polls", {
			title: args.title,
			description: args.description,
			creatorId: args.userId,
			status: "active",
			createdAt: Date.now(),
		});

		for (let i = 0; i < args.outcomes.length; i++) {
			await ctx.db.insert("outcomes", {
				pollId,
				title: args.outcomes[i],
				totalShares: 100,
				order: i,
			});
		}

		return pollId;
	},
});
