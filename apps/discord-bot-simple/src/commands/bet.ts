import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { PolymartAPI } from "../api.js";
import { config } from "../config.js";

const api = new PolymartAPI(config.polymartApiBase);

export const betCommand = {
	data: new SlashCommandBuilder()
		.setName("bet")
		.setDescription("Place a bet on a poll outcome")
		.addStringOption((option) =>
			option
				.setName("poll-id")
				.setDescription("The poll ID")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("outcome-id")
				.setDescription("The outcome ID to bet on")
				.setRequired(true)
		)
		.addIntegerOption((option) =>
			option
				.setName("points")
				.setDescription("Amount of points to wager")
				.setRequired(true)
				.setMinValue(1)
		),
	
	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });

		try {
			const apiKey = await api.getUserApiKey(interaction.user.id);
			
			if (!apiKey) {
				await interaction.editReply({
					content: "You need to link your account first. Use `/link` to get started.",
				});
				return;
			}

			const pollId = interaction.options.getString("poll-id", true);
			const outcomeId = interaction.options.getString("outcome-id", true);
			const points = interaction.options.getInteger("points", true);

			const result = await api.placeBet(apiKey, pollId, outcomeId, points);

			await interaction.editReply({
				content: `Bet placed successfully! You wagered ${points} points on this outcome.`,
			});
		} catch (error: any) {
			console.error("Bet error:", error);
			await interaction.editReply({
				content: `Failed to place bet: ${error.message}`,
			});
		}
	},
};
