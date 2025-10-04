import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { PolymartAPI } from "../api.js";
import { config } from "../config.js";

const api = new PolymartAPI(config.polymartApiBase);

export const linkCommand = {
	data: new SlashCommandBuilder()
		.setName("link")
		.setDescription("Link your Discord account to Polymart"),
	
	async execute(interaction: ChatInputCommandInteraction) {
		try {
			const linkUrl = await api.initiateLinking(
				interaction.user.id,
				interaction.user.username
			);

			await interaction.reply({
				content: `Click here to link your account: ${linkUrl}\n\nThis link expires in 10 minutes.`,
				ephemeral: true,
			});
		} catch (error) {
			console.error("Link command error:", error);
			await interaction.reply({
				content: "Failed to create link. Please try again later.",
				ephemeral: true,
			});
		}
	},
};
