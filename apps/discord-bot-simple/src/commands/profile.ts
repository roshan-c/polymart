import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { PolymartAPI } from "../api.js";
import { config } from "../config.js";

const api = new PolymartAPI(config.polymartApiBase);

export const profileCommand = {
	data: new SlashCommandBuilder()
		.setName("profile")
		.setDescription("View user profile and stats")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("The user to view (defaults to yourself)")
				.setRequired(false)
		),
	
	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });

		try {
			const targetUser = interaction.options.getUser("user") || interaction.user;
			const discordId = targetUser.id;

			const userResponse = await fetch(`${config.polymartApiBase}/api/users/discord/${discordId}`);
			
			if (userResponse.status === 404) {
				await interaction.editReply({
					content: "User profile not found. They may need to link their account first.",
				});
				return;
			}

			if (!userResponse.ok) {
				throw new Error("Failed to fetch user");
			}

			const userData = await userResponse.json();
			const userId = userData.user._id;

			const result = await api.getUserProfile(userId);
			
			if (!result.user) {
				await interaction.editReply({
					content: "User profile not found. They may need to link their account first.",
				});
				return;
			}

			const user = result.user;
			const stats = result.stats;

			const message = `**${user.name}'s Profile**\n\n` +
				`**Points:** ${user.points}\n` +
				`**Member since:** ${new Date(user.createdAt).toLocaleDateString()}\n\n` +
				`**Stats:**\n` +
				`• Total Bets: ${stats.totalBets}\n` +
				`• Total Wagered: ${stats.totalWagered} pts\n` +
				`• Total Winnings: ${stats.totalWinnings} pts\n` +
				`• Net Profit: ${stats.netProfit >= 0 ? '+' : ''}${stats.netProfit} pts\n` +
				`• Polls Created: ${stats.pollsCreated}`;

			await interaction.editReply({ content: message });
		} catch (error: any) {
			console.error("Profile error:", error);
			await interaction.editReply({
				content: `Failed to fetch profile: ${error.message}`,
			});
		}
	},
};
