import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { PolymartAPI } from "../api.js";
import { config } from "../config.js";

const api = new PolymartAPI(config.polymartApiBase);

export const createPollCommand = {
	data: new SlashCommandBuilder()
		.setName("create-poll")
		.setDescription("Create a new prediction market poll")
		.addStringOption((option) =>
			option
				.setName("title")
				.setDescription("The poll title")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("outcomes")
				.setDescription("Comma-separated list of outcomes (e.g., Yes,No)")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("description")
				.setDescription("Optional poll description")
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

			const title = interaction.options.getString("title", true);
			const outcomesStr = interaction.options.getString("outcomes", true);
			const description = interaction.options.getString("description") || undefined;

			const outcomes = outcomesStr.split(",").map((o) => o.trim()).filter(Boolean);

			if (outcomes.length < 2) {
				await interaction.editReply({
					content: "You must provide at least 2 outcomes.",
				});
				return;
			}

			const result = await api.createPoll(apiKey, title, outcomes, description);

			await interaction.editReply({
				content: `Poll created successfully! View it at: https://polymart.xyz/polls/${result.pollId}`,
			});
		} catch (error: any) {
			console.error("Create poll error:", error);
			await interaction.editReply({
				content: `Failed to create poll: ${error.message}`,
			});
		}
	},
};
