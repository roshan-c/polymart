import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { PolymartAPI } from '../api';

export const data = new SlashCommandBuilder()
	.setName('link')
	.setDescription('Link your Discord account to Polymart');

export async function execute(interaction: CommandInteraction) {
	await interaction.deferReply({ ephemeral: true });

	try {
		const api = new PolymartAPI();
		const linkData = await api.initiateLinking('discord', interaction.user.id);

		await interaction.editReply(
			`🔗 **Link your Polymart account**\n\n` +
			`Click the link below to authorize Polymart Discord bot:\n` +
			`${linkData.linkUrl}\n\n` +
			`⏱️ This link expires in 10 minutes.\n\n` +
			`After linking, you'll be able to:\n` +
			`• Place bets using \`/bet\`\n` +
			`• Create polls using \`/create-poll\`\n` +
			`• View your personalized poll data`
		);
	} catch (error: any) {
		await interaction.editReply(`❌ Error: ${error.message}`);
	}
}
