import { v, ConvexError, GenericId } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

const LIQUIDITY_CONSTANT = 100;

function calculateSharesReceived(
	pointsWagered: number,
	currentShares: number
): number {
	const k = LIQUIDITY_CONSTANT * currentShares;
	const newShares = currentShares - k / (k / currentShares + pointsWagered);
	return Math.max(0, newShares);
}

async function buildEntityMap(
	ctx: QueryCtx | MutationCtx,
	ids: any[]
): Promise<Map<any, any>> {
	const entities = await Promise.all(ids.map((id) => ctx.db.get(id)));
	const entityMap = new Map();
	for (let i = 0; i < ids.length; i++) {
		entityMap.set(ids[i], entities[i]);
	}
	return entityMap;
}

async function executeBetPlacement(
	ctx: MutationCtx,
	userId: GenericId<"users">,
	pollId: GenericId<"polls">,
	outcomeId: GenericId<"outcomes">,
	pointsWagered: number
) {
	const user = await ctx.db.get(userId);
	if (!user) {
		throw new Error("User not found");
	}

	if (pointsWagered <= 0) {
		throw new Error("Bet amount must be positive");
	}

	if (!Number.isInteger(pointsWagered)) {
		throw new ConvexError("Bet amount must be a whole number");
	}

	if (user.pointBalance < pointsWagered) {
		throw new Error("Insufficient points");
	}

	const poll = await ctx.db.get(pollId);
	if (!poll) {
		throw new Error("Poll not found");
	}

	if (poll.status !== "active") {
		throw new Error("Poll is not active");
	}

	const outcome = await ctx.db.get(outcomeId);
	if (!outcome) {
		throw new Error("Outcome not found");
	}

	if (outcome.pollId !== pollId) {
		throw new Error("Outcome does not belong to this poll");
	}

	if (poll.allowMultipleVotes !== true) {
		const existingBets = await ctx.db
			.query("bets")
			.withIndex("by_user_poll", (q) => q.eq("userId", userId).eq("pollId", pollId))
			.collect();

		const hasVotedOnDifferentOutcome = existingBets.some(
			(bet) => bet.outcomeId !== outcomeId
		);

		if (hasVotedOnDifferentOutcome) {
			throw new ConvexError("You can only vote on one outcome for this poll");
		}
	}

	const sharesReceived = calculateSharesReceived(
		pointsWagered,
		outcome.totalShares
	);

	await ctx.db.patch(userId, {
		pointBalance: user.pointBalance - pointsWagered,
	});

	await ctx.db.patch(outcomeId, {
		totalShares: outcome.totalShares + sharesReceived,
	});

	const betId = await ctx.db.insert("bets", {
		userId,
		pollId,
		outcomeId,
		pointsWagered,
		sharesReceived,
		createdAt: Date.now(),
		settled: false,
	});

	const [allBets, allOutcomes] = await Promise.all([
		ctx.db
			.query("bets")
			.withIndex("by_poll", (q) => q.eq("pollId", pollId))
			.collect(),
		ctx.db
			.query("outcomes")
			.withIndex("by_poll", (q) => q.eq("pollId", pollId))
			.collect(),
	]);

	const totalVolume = allBets.reduce(
		(sum, bet) => sum + bet.pointsWagered,
		0
	);

	const betsByOutcome = new Map<string, typeof allBets>();
	for (const bet of allBets) {
		if (!betsByOutcome.has(bet.outcomeId)) {
			betsByOutcome.set(bet.outcomeId, []);
		}
		betsByOutcome.get(bet.outcomeId)!.push(bet);
	}

	const timestamp = Date.now();
	const historyInserts = allOutcomes.map((out) => {
		const outcomeBets = betsByOutcome.get(out._id) || [];
		const outcomeVolume = outcomeBets.reduce(
			(sum, bet) => sum + bet.pointsWagered,
			0
		);
		const probability = totalVolume > 0 ? (outcomeVolume / totalVolume) * 100 : 0;

		return ctx.db.insert("probabilityHistory", {
			pollId,
			outcomeId: out._id,
			probability,
			timestamp,
		});
	});

	await Promise.all(historyInserts);

	return await ctx.db.get(betId);
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

		return await executeBetPlacement(
			ctx,
			user._id,
			args.pollId,
			args.outcomeId,
			args.pointsWagered
		);
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

		if (filteredBets.length === 0) {
			return [];
		}

		const pollIds = [...new Set(filteredBets.map((bet) => bet.pollId))];
		const outcomeIds = [...new Set(filteredBets.map((bet) => bet.outcomeId))];

		const [pollMap, outcomeMap] = await Promise.all([
			buildEntityMap(ctx, pollIds),
			buildEntityMap(ctx, outcomeIds),
		]);

		const betsWithDetails = filteredBets.map((bet) => ({
			...bet,
			poll: pollMap.get(bet.pollId),
			outcome: outcomeMap.get(bet.outcomeId),
		}));

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

		if (bets.length === 0) {
			return [];
		}

		const userIds = [...new Set(bets.map((bet) => bet.userId))];
		const outcomeIds = [...new Set(bets.map((bet) => bet.outcomeId))];

		const [userMap, outcomeMap] = await Promise.all([
			buildEntityMap(ctx, userIds),
			buildEntityMap(ctx, outcomeIds),
		]);

		const betsWithDetails = bets.map((bet) => ({
			...bet,
			user: userMap.get(bet.userId),
			outcome: outcomeMap.get(bet.outcomeId),
		}));

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

		if (bets.length === 0) {
			return [];
		}

		const userIds = [...new Set(bets.map((bet) => bet.userId))];
		const userMap = await buildEntityMap(ctx, userIds);

		const betsWithUsers = bets.map((bet) => ({
			...bet,
			user: userMap.get(bet.userId),
		}));

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
		return await executeBetPlacement(
			ctx,
			args.userId,
			args.pollId,
			args.outcomeId,
			args.pointsWagered
		);
	},
});
