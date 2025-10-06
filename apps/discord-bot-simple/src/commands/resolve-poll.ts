import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { PolymartAPI } from "../api.js";
import { config } from "../config.js";

const api = new PolymartAPI(config.polymartApiBase);

export const resolvePollCommand = {
	data: new SlashCommandBuilder()
		.setName("resolve-poll")
		.setDescription("[Admin] Resolve a poll with a winning outcome")
		.addStringOption((option) =>
			option
				.setName("poll-id")
				.setDescription("The poll ID")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("winning-outcome-id")
				.setDescription("The ID of the winning outcome")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("evidence-url")
				.setDescription("Link to evidence (optional)")
				.setRequired(false)
		)
		.addStringOption((option) =>
			option
				.setName("evidence-text")
				.setDescription("Description of evidence (optional)")
				.setRequired(false)
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
			const winningOutcomeId = interaction.options.getString("winning-outcome-id", true);
			const evidenceUrl = interaction.options.getString("evidence-url") || undefined;
			const evidenceText = interaction.options.getString("evidence-text") || undefined;

			const result = await api.resolvePoll(apiKey, pollId, winningOutcomeId, evidenceUrl, evidenceText);

			await interaction.editReply({
				content: `Poll resolved successfully!\n\n` +
					`Winners: ${result.winnersCount}\n` +
					`Total Payout: ${result.totalPayout} pts`,
			});
		} catch (error: any) {
			console.error("Resolve poll error:", error);
			await interaction.editReply({
				content: `Failed to resolve poll: ${error.message}`,
			});
		}
	},
};
