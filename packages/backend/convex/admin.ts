import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const resolvePoll = mutation({
	args: {
		pollId: v.id("polls"),
		winningOutcomeId: v.id("outcomes"),
		evidenceUrl: v.optional(v.string()),
		evidenceText: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const admin = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
			.first();

		if (!admin || !admin.isAdmin) {
			throw new Error("Only admins can resolve polls");
		}

		const poll = await ctx.db.get(args.pollId);
		if (!poll) {
			throw new Error("Poll not found");
		}

		if (poll.status !== "active") {
			throw new Error("Poll is not active");
		}

		const winningOutcome = await ctx.db.get(args.winningOutcomeId);
		if (!winningOutcome || winningOutcome.pollId !== args.pollId) {
			throw new Error("Invalid winning outcome");
		}

		await ctx.db.patch(args.pollId, {
			status: "resolved",
			winningOutcomeId: args.winningOutcomeId,
			evidenceUrl: args.evidenceUrl,
			evidenceText: args.evidenceText,
			resolvedAt: Date.now(),
		});

		const allBets = await ctx.db
			.query("bets")
			.withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
			.collect();

		const totalPool = allBets.reduce(
			(sum, bet) => sum + bet.pointsWagered,
			0
		);

		const winningBets = allBets.filter(
			(bet) => bet.outcomeId === args.winningOutcomeId
		);
		const totalWinningWager = winningBets.reduce(
			(sum, bet) => sum + bet.pointsWagered,
			0
		);

		for (const bet of winningBets) {
			const proportion = bet.pointsWagered / totalWinningWager;
			const payout = totalPool * proportion;

			await ctx.db.patch(bet._id, {
				settled: true,
				payout,
			});

			const user = await ctx.db.get(bet.userId);
			if (user) {
				await ctx.db.patch(bet.userId, {
					pointBalance: user.pointBalance + payout,
				});
			}
		}

		const losingBets = allBets.filter(
			(bet) => bet.outcomeId !== args.winningOutcomeId
		);
		for (const bet of losingBets) {
			await ctx.db.patch(bet._id, {
				settled: true,
				payout: 0,
			});
		}

		return { success: true, totalPool, winningBets: winningBets.length };
	},
});

export const cancelPoll = mutation({
	args: {
		pollId: v.id("polls"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const admin = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
			.first();

		if (!admin || !admin.isAdmin) {
			throw new Error("Only admins can cancel polls");
		}

		const poll = await ctx.db.get(args.pollId);
		if (!poll) {
			throw new Error("Poll not found");
		}

		if (poll.status !== "active") {
			throw new Error("Poll is not active");
		}

		await ctx.db.patch(args.pollId, {
			status: "cancelled",
			resolvedAt: Date.now(),
		});

		const allBets = await ctx.db
			.query("bets")
			.withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
			.collect();

		for (const bet of allBets) {
			await ctx.db.patch(bet._id, {
				settled: true,
				payout: bet.pointsWagered,
			});

			const user = await ctx.db.get(bet.userId);
			if (user) {
				await ctx.db.patch(bet.userId, {
					pointBalance: user.pointBalance + bet.pointsWagered,
				});
			}
		}

		return { success: true, refundedBets: allBets.length };
	},
});
