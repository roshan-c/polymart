import { v, GenericId } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { buildEntityMap } from "./utils.js";

function validatePollOutcomes(outcomes: string[]) {
	if (outcomes.length < 2 || outcomes.length > 10) {
		throw new Error("Polls must have between 2 and 10 outcomes");
	}

	const uniqueOutcomes = new Set(outcomes);
	if (uniqueOutcomes.size !== outcomes.length) {
		throw new Error("Outcome names must be unique");
	}
}

async function createPollWithOutcomes(
	ctx: MutationCtx,
	creatorId: GenericId<"users">,
	title: string,
	outcomes: string[],
	description?: string,
	allowMultipleVotes?: boolean
) {
	validatePollOutcomes(outcomes);

	const pollId = await ctx.db.insert("polls", {
		title,
		description,
		creatorId,
		status: "active",
		allowMultipleVotes: allowMultipleVotes ?? false,
		createdAt: Date.now(),
	});

	for (let i = 0; i < outcomes.length; i++) {
		await ctx.db.insert("outcomes", {
			pollId,
			title: outcomes[i],
			totalShares: 100,
			order: i,
		});
	}

	return pollId;
}

function calculateOutcomeProbability(
	outcomeBets: any[],
	totalVolume: number
): number {
	const outcomeVolume = outcomeBets.reduce(
		(sum, bet) => sum + bet.pointsWagered,
		0
	);
	return totalVolume > 0 ? (outcomeVolume / totalVolume) * 100 : 0;
}

function enrichOutcomesWithProbabilities(
	outcomes: any[],
	betsByOutcome: Map<string, any[]>,
	totalVolume: number
) {
	return outcomes.map((outcome) => {
		const outcomeBets = betsByOutcome.get(outcome._id) || [];
		const outcomeVolume = outcomeBets.reduce(
			(sum, bet) => sum + bet.pointsWagered,
			0
		);
		const probability = calculateOutcomeProbability(outcomeBets, totalVolume);

		return {
			...outcome,
			probability,
			volume: outcomeVolume,
			betCount: outcomeBets.length,
		};
	});
}

export const create = mutation({
	args: {
		title: v.string(),
		description: v.optional(v.string()),
		outcomes: v.array(v.string()),
		allowMultipleVotes: v.optional(v.boolean()),
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

		return await createPollWithOutcomes(
			ctx,
			user._id,
			args.title,
			args.outcomes,
			args.description,
			args.allowMultipleVotes
		);
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

		if (polls.length === 0) {
			return [];
		}

		const pollIds = polls.map((p) => p._id);
		const creatorIds = [...new Set(polls.map((p) => p.creatorId))];

		const [allOutcomes, allBets, creatorMap] = await Promise.all([
			ctx.db.query("outcomes").collect(),
			ctx.db.query("bets").collect(),
			buildEntityMap(ctx, creatorIds),
		]);

		const outcomesByPoll = new Map<string, typeof allOutcomes>();
		for (const outcome of allOutcomes) {
			if (pollIds.includes(outcome.pollId)) {
				if (!outcomesByPoll.has(outcome.pollId)) {
					outcomesByPoll.set(outcome.pollId, []);
				}
				outcomesByPoll.get(outcome.pollId)!.push(outcome);
			}
		}

		const betsByPoll = new Map<string, typeof allBets>();
		const betsByOutcome = new Map<string, typeof allBets>();
		for (const bet of allBets) {
			if (pollIds.includes(bet.pollId)) {
				if (!betsByPoll.has(bet.pollId)) {
					betsByPoll.set(bet.pollId, []);
				}
				betsByPoll.get(bet.pollId)!.push(bet);

				if (!betsByOutcome.has(bet.outcomeId)) {
					betsByOutcome.set(bet.outcomeId, []);
				}
				betsByOutcome.get(bet.outcomeId)!.push(bet);
			}
		}

		const pollsWithDetails = polls.map((poll) => {
			const outcomes = (outcomesByPoll.get(poll._id) || []).sort((a, b) => a.order - b.order);
			const creator = creatorMap.get(poll.creatorId);
			const totalBets = betsByPoll.get(poll._id) || [];

			const totalVolume = totalBets.reduce(
				(sum, bet) => sum + bet.pointsWagered,
				0
			);

			const outcomesWithProbabilities = enrichOutcomesWithProbabilities(
				outcomes,
				betsByOutcome,
				totalVolume
			);

			return {
				...poll,
				outcomes: outcomesWithProbabilities,
				creator,
				totalVolume,
				totalBets: totalBets.length,
			};
		});

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

		const [outcomes, creator, allBets] = await Promise.all([
			ctx.db
				.query("outcomes")
				.withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
				.order("asc")
				.collect(),
			ctx.db.get(poll.creatorId),
			ctx.db
				.query("bets")
				.withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
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

		const outcomesWithProbabilities = enrichOutcomesWithProbabilities(
			outcomes,
			betsByOutcome,
			totalVolume
		);

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
		const [history, outcomes] = await Promise.all([
			ctx.db
				.query("probabilityHistory")
				.withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
				.collect(),
			ctx.db
				.query("outcomes")
				.withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
				.collect(),
		]);

		const groupedByTimestamp: Record<number, Record<string, number>> = {};
		const outcomeKeyMap = new Map<string, string>();
		const usedDisplayKeys = new Set<string>();

		for (const outcome of outcomes) {
			let displayKey = outcome.title;
			let counter = 1;
			while (usedDisplayKeys.has(displayKey)) {
				displayKey = `${outcome.title} #${counter}`;
				counter++;
			}
			usedDisplayKeys.add(displayKey);
			outcomeKeyMap.set(outcome._id, displayKey);
		}

		for (const entry of history) {
			if (!groupedByTimestamp[entry.timestamp]) {
				groupedByTimestamp[entry.timestamp] = {};
			}
			const displayKey = outcomeKeyMap.get(entry.outcomeId);
			if (displayKey) {
				groupedByTimestamp[entry.timestamp][displayKey] = entry.probability;
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
			outcomes: outcomes.map((o) => outcomeKeyMap.get(o._id) || o.title),
		};
	},
});

export const createWithAuth = mutation({
	args: {
		userId: v.id("users"),
		title: v.string(),
		description: v.optional(v.string()),
		outcomes: v.array(v.string()),
		allowMultipleVotes: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		return await createPollWithOutcomes(
			ctx,
			args.userId,
			args.title,
			args.outcomes,
			args.description,
			args.allowMultipleVotes
		);
	},
});
