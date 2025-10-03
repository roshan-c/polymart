import { mutation } from "./_generated/server";

export const backfillProbabilityHistory = mutation({
	args: {},
	handler: async (ctx) => {
		const polls = await ctx.db.query("polls").collect();

		let totalSnapshotsCreated = 0;

		for (const poll of polls) {
			const outcomes = await ctx.db
				.query("outcomes")
				.withIndex("by_poll", (q) => q.eq("pollId", poll._id))
				.collect();

			const allBets = await ctx.db
				.query("bets")
				.withIndex("by_poll", (q) => q.eq("pollId", poll._id))
				.collect();

			const totalVolume = allBets.reduce(
				(sum, bet) => sum + bet.pointsWagered,
				0
			);

			if (totalVolume === 0) {
				for (const outcome of outcomes) {
					await ctx.db.insert("probabilityHistory", {
						pollId: poll._id,
						outcomeId: outcome._id,
						probability: 100 / outcomes.length,
						timestamp: poll.createdAt,
					});
					totalSnapshotsCreated++;
				}
			} else {
				for (const outcome of outcomes) {
					const outcomeBets = allBets.filter((bet) => bet.outcomeId === outcome._id);
					const outcomeVolume = outcomeBets.reduce(
						(sum, bet) => sum + bet.pointsWagered,
						0
					);
					const probability = totalVolume > 0 ? (outcomeVolume / totalVolume) * 100 : 0;

					await ctx.db.insert("probabilityHistory", {
						pollId: poll._id,
						outcomeId: outcome._id,
						probability,
						timestamp: Date.now(),
					});
					totalSnapshotsCreated++;
				}
			}
		}

		return {
			success: true,
			pollsProcessed: polls.length,
			snapshotsCreated: totalSnapshotsCreated,
		};
	},
});
