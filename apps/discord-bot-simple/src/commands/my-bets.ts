import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { PolymartAPI } from "../api.js";
import { config } from "../config.js";
import { getStatusEmoji, replyWithTruncation } from "../utils.js";

const api = new PolymartAPI(config.polymartApiBase);

export const myBetsCommand = {
	data: new SlashCommandBuilder()
		.setName("my-bets")
		.setDescription("View your betting history"),
	
	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });

		try {
			const auth = await api.getUserAuth(interaction.user.id);
			
			if (!auth) {
				await interaction.editReply({
					content: "You need to link your account first. Use `/link` to get started.",
				});
				return;
			}

			const result = await api.getUserBets(auth.apiKey, auth.userId);
			
			if (!result.bets || result.bets.length === 0) {
				await interaction.editReply({
					content: "You haven't placed any bets yet.",
				});
				return;
			}

			const betsList = result.bets.slice(0, 10).map((bet: any) => {
				const date = new Date(bet.createdAt).toLocaleDateString();
				const statusEmoji = getStatusEmoji(bet.poll.status);
				return `${statusEmoji} **${bet.poll.title}**\n` +
					`Outcome: ${bet.outcome.title} | Wagered: ${bet.pointsWagered} pts | ${date}`;
			}).join("\n\n");

			const message = `**Your Bets**\n\n${betsList}`;

			await replyWithTruncation(interaction, message);
		} catch (error: any) {
			console.error("My bets error:", error);
			await interaction.editReply({
				content: `Failed to fetch your bets: ${error.message}`,
			});
		}
	},
};
