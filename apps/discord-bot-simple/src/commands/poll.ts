import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { PolymartAPI } from "../api.js";
import { config } from "../config.js";
import { getStatusEmoji, replyWithTruncation } from "../utils.js";

const api = new PolymartAPI(config.polymartApiBase);

export const pollCommand = {
	data: new SlashCommandBuilder()
		.setName("poll")
		.setDescription("View details of a specific poll")
		.addStringOption((option) =>
			option
				.setName("poll-id")
				.setDescription("The poll ID")
				.setRequired(true)
		),
	
	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });

		try {
			const pollId = interaction.options.getString("poll-id", true);
			const result = await api.getPoll(pollId);
			
			if (!result.poll) {
				await interaction.editReply({
					content: "Poll not found.",
				});
				return;
			}

			const poll = result.poll;
			const statusEmoji = getStatusEmoji(poll.status);
			
			const outcomes = poll.outcomes.map((outcome: any) => {
				return `• **${outcome.title}** - ${outcome.probability.toFixed(1)}% (${outcome.betCount} bets, ${outcome.volume} pts)`;
			}).join("\n");

			const message = `${statusEmoji} **${poll.title}**\n\n` +
				`${poll.description ? poll.description + "\n\n" : ""}` +
				`**Status:** ${poll.status}\n` +
				`**Total Volume:** ${poll.totalVolume} pts\n` +
				`**Total Bets:** ${poll.totalBets}\n` +
				`**Created by:** ${poll.creator.name}\n\n` +
				`**Outcomes:**\n${outcomes}\n\n` +
				`View on web: https://polymart.xyz/polls/${poll._id}`;

			await replyWithTruncation(interaction, message);
		} catch (error: any) {
			console.error("Poll error:", error);
			await interaction.editReply({
				content: `Failed to fetch poll: ${error.message}`,
			});
		}
	},
};
