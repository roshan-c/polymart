import { mutation } from "./_generated/server";

export const backfillAllowMultipleVotes = mutation({
	args: {},
	handler: async (ctx) => {
		const polls = await ctx.db.query("polls").collect();

		let pollsUpdated = 0;

		for (const poll of polls) {
			if ((poll as any).allowMultipleVotes === undefined) {
				await ctx.db.patch(poll._id, {
					allowMultipleVotes: false,
				});
				pollsUpdated++;
			}
		}

		return {
			success: true,
			pollsUpdated,
		};
	},
});

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

export const backfillDiscordIds = mutation({
	args: {},
	handler: async (ctx) => {
		const authorizations = await ctx.db.query("thirdPartyAuthorizations").collect();

		let usersUpdated = 0;

		for (const auth of authorizations) {
			if (auth.platform === "discord" && auth.platformUserId) {
				const user = await ctx.db.get(auth.userId);
				if (user && !user.discordId) {
					await ctx.db.patch(auth.userId, {
						discordId: auth.platformUserId,
					});
					usersUpdated++;
				}
			}
		}

		return {
			success: true,
			usersUpdated,
		};
	},
});

export const migrateAuthIdField = mutation({
	args: {},
	handler: async (ctx) => {
		const users = await ctx.db.query("users").collect();
		let migratedCount = 0;
		let skippedCount = 0;

		for (const user of users) {
			const oldClerkId = (user as any).clerkId;
			if (oldClerkId && !(user as any).authId) {
				await ctx.db.patch(user._id, {
					authId: oldClerkId,
				} as any);
				migratedCount++;
			} else if ((user as any).authId) {
				skippedCount++;
			}
		}

		return {
			success: true,
			migratedCount,
			skippedCount,
			totalUsers: users.length,
			message: `Migrated ${migratedCount} users from clerkId to authId, skipped ${skippedCount} users that already had authId`
		};
	},
});
