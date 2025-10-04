import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const LIQUIDITY_CONSTANT = 100;

function calculateSharesReceived(
	pointsWagered: number,
	currentShares: number
): number {
	const k = LIQUIDITY_CONSTANT * currentShares;
	const newShares = currentShares - k / (k / currentShares + pointsWagered);
	return Math.max(0, newShares);
}

export const placeBet = mutation({
	args: {
		pollId: v.id("polls"),
		outcomeId: v.id("outcomes"),
		pointsWagered: v.number(),
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

		if (args.pointsWagered <= 0) {
			throw new Error("Bet amount must be positive");
		}

		if (user.pointBalance < args.pointsWagered) {
			throw new Error("Insufficient points");
		}

		const poll = await ctx.db.get(args.pollId);
		if (!poll) {
			throw new Error("Poll not found");
		}

		if (poll.status !== "active") {
			throw new Error("Poll is not active");
		}

		const outcome = await ctx.db.get(args.outcomeId);
		if (!outcome) {
			throw new Error("Outcome not found");
		}

		if (outcome.pollId !== args.pollId) {
			throw new Error("Outcome does not belong to this poll");
		}

		if (poll.allowMultipleVotes !== true) {
			const existingBets = await ctx.db
				.query("bets")
				.withIndex("by_user_poll", (q) => q.eq("userId", user._id).eq("pollId", args.pollId))
				.collect();

			const hasVotedOnDifferentOutcome = existingBets.some(
				(bet) => bet.outcomeId !== args.outcomeId
			);

			if (hasVotedOnDifferentOutcome) {
				throw new Error("You can only vote on one outcome for this poll");
			}
		}

		const sharesReceived = calculateSharesReceived(
			args.pointsWagered,
			outcome.totalShares
		);

		await ctx.db.patch(user._id, {
			pointBalance: user.pointBalance - args.pointsWagered,
		});

		await ctx.db.patch(args.outcomeId, {
			totalShares: outcome.totalShares + sharesReceived,
		});

		const betId = await ctx.db.insert("bets", {
			userId: user._id,
			pollId: args.pollId,
			outcomeId: args.outcomeId,
			pointsWagered: args.pointsWagered,
			sharesReceived,
			createdAt: Date.now(),
			settled: false,
		});

		const allBets = await ctx.db
			.query("bets")
			.withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
			.collect();

		const totalVolume = allBets.reduce(
			(sum, bet) => sum + bet.pointsWagered,
			0
		);

		const allOutcomes = await ctx.db
			.query("outcomes")
			.withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
			.collect();

		for (const out of allOutcomes) {
			const outcomeBets = allBets.filter((bet) => bet.outcomeId === out._id);
			const outcomeVolume = outcomeBets.reduce(
				(sum, bet) => sum + bet.pointsWagered,
				0
			);
			const probability = totalVolume > 0 ? (outcomeVolume / totalVolume) * 100 : 0;

			await ctx.db.insert("probabilityHistory", {
				pollId: args.pollId,
				outcomeId: out._id,
				probability,
				timestamp: Date.now(),
			});
		}

		return await ctx.db.get(betId);
	},
});

export const getUserBets = query({
	args: {
		userId: v.id("users"),
		pollId: v.optional(v.id("polls")),
	},
	handler: async (ctx, args) => {
		let betsQuery = ctx.db
			.query("bets")
			.withIndex("by_user", (q) => q.eq("userId", args.userId));

		const bets = await betsQuery.collect();

		const filteredBets = args.pollId
			? bets.filter((bet) => bet.pollId === args.pollId)
			: bets;

		const betsWithDetails = await Promise.all(
			filteredBets.map(async (bet) => {
				const poll = await ctx.db.get(bet.pollId);
				const outcome = await ctx.db.get(bet.outcomeId);

				return {
					...bet,
					poll,
					outcome,
				};
			})
		);

		return betsWithDetails;
	},
});

export const getPollBets = query({
	args: {
		pollId: v.id("polls"),
	},
	handler: async (ctx, args) => {
		const bets = await ctx.db
			.query("bets")
			.withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
			.collect();

		const betsWithDetails = await Promise.all(
			bets.map(async (bet) => {
				const user = await ctx.db.get(bet.userId);
				const outcome = await ctx.db.get(bet.outcomeId);

				return {
					...bet,
					user,
					outcome,
				};
			})
		);

		return betsWithDetails;
	},
});

export const getOutcomeBets = query({
	args: {
		outcomeId: v.id("outcomes"),
	},
	handler: async (ctx, args) => {
		const bets = await ctx.db
			.query("bets")
			.withIndex("by_outcome", (q) => q.eq("outcomeId", args.outcomeId))
			.collect();

		const betsWithUsers = await Promise.all(
			bets.map(async (bet) => {
				const user = await ctx.db.get(bet.userId);
				return {
					...bet,
					user,
				};
			})
		);

		return betsWithUsers;
	},
});

export const placeBetWithAuth = mutation({
	args: {
		userId: v.id("users"),
		pollId: v.id("polls"),
		outcomeId: v.id("outcomes"),
		pointsWagered: v.number(),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user) {
			throw new Error("User not found");
		}

		if (args.pointsWagered <= 0) {
			throw new Error("Bet amount must be positive");
		}

		if (user.pointBalance < args.pointsWagered) {
			throw new Error("Insufficient points");
		}

		const poll = await ctx.db.get(args.pollId);
		if (!poll) {
			throw new Error("Poll not found");
		}

		if (poll.status !== "active") {
			throw new Error("Poll is not active");
		}

		const outcome = await ctx.db.get(args.outcomeId);
		if (!outcome) {
			throw new Error("Outcome not found");
		}

		if (outcome.pollId !== args.pollId) {
			throw new Error("Outcome does not belong to this poll");
		}

		if (poll.allowMultipleVotes !== true) {
			const existingBets = await ctx.db
				.query("bets")
				.withIndex("by_user_poll", (q) => q.eq("userId", args.userId).eq("pollId", args.pollId))
				.collect();

			const hasVotedOnDifferentOutcome = existingBets.some(
				(bet) => bet.outcomeId !== args.outcomeId
			);

			if (hasVotedOnDifferentOutcome) {
				throw new Error("You can only vote on one outcome for this poll");
			}
		}

		const sharesReceived = calculateSharesReceived(
			args.pointsWagered,
			outcome.totalShares
		);

		await ctx.db.patch(args.userId, {
			pointBalance: user.pointBalance - args.pointsWagered,
		});

		await ctx.db.patch(args.outcomeId, {
			totalShares: outcome.totalShares + sharesReceived,
		});

		const betId = await ctx.db.insert("bets", {
			userId: args.userId,
			pollId: args.pollId,
			outcomeId: args.outcomeId,
			pointsWagered: args.pointsWagered,
			sharesReceived,
			createdAt: Date.now(),
			settled: false,
		});

		const allBets = await ctx.db
			.query("bets")
			.withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
			.collect();

		const totalVolume = allBets.reduce(
			(sum, bet) => sum + bet.pointsWagered,
			0
		);

		const allOutcomes = await ctx.db
			.query("outcomes")
			.withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
			.collect();

		for (const out of allOutcomes) {
			const outcomeBets = allBets.filter((bet) => bet.outcomeId === out._id);
			const outcomeVolume = outcomeBets.reduce(
				(sum, bet) => sum + bet.pointsWagered,
				0
			);
			const probability = totalVolume > 0 ? (outcomeVolume / totalVolume) * 100 : 0;

			await ctx.db.insert("probabilityHistory", {
				pollId: args.pollId,
				outcomeId: out._id,
				probability,
				timestamp: Date.now(),
			});
		}

		return await ctx.db.get(betId);
	},
});
