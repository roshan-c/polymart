import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { PolymartAPI } from "../api.js";
import { config } from "../config.js";

const api = new PolymartAPI(config.polymartApiBase);

export const pollsCommand = {
	data: new SlashCommandBuilder()
		.setName("polls")
		.setDescription("List prediction market polls")
		.addStringOption((option) =>
			option
				.setName("status")
				.setDescription("Filter by poll status")
				.setRequired(false)
				.addChoices(
					{ name: "Active", value: "active" },
					{ name: "Resolved", value: "resolved" },
					{ name: "Cancelled", value: "cancelled" }
				)
		),
	
	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });

		try {
			const status = interaction.options.getString("status") || undefined;
			const result = await api.getPolls(status);
			
			if (!result.polls || result.polls.length === 0) {
				await interaction.editReply({
					content: status 
						? `No ${status} polls found.`
						: "No polls found.",
				});
				return;
			}

			const pollsList = result.polls.slice(0, 10).map((poll: any) => {
				const statusEmoji = poll.status === "active" ? "🟢" : poll.status === "resolved" ? "✅" : "❌";
				return `${statusEmoji} **${poll.title}**\nID: \`${poll._id}\` | Volume: ${poll.totalVolume} pts | Bets: ${poll.totalBets}`;
			}).join("\n\n");

			const message = `**Polls** ${status ? `(${status})` : ""}\n\n${pollsList}`;

			if (message.length > 2000) {
				await interaction.editReply({
					content: message.substring(0, 1997) + "...",
				});
			} else {
				await interaction.editReply({ content: message });
			}
		} catch (error: any) {
			console.error("Polls error:", error);
			await interaction.editReply({
				content: `Failed to fetch polls: ${error.message}`,
			});
		}
	},
};
