import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { PolymartAPI } from '../api';

export const data = new SlashCommandBuilder()
	.setName('bet')
	.setDescription('Place a bet on a poll outcome')
	.addStringOption(option =>
		option
			.setName('poll-id')
			.setDescription('Poll ID')
			.setRequired(true)
	)
	.addStringOption(option =>
		option
			.setName('outcome-id')
			.setDescription('Outcome ID to bet on')
			.setRequired(true)
	)
	.addIntegerOption(option =>
		option
			.setName('points')
			.setDescription('Points to wager')
			.setRequired(true)
			.setMinValue(1)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	await interaction.deferReply();

	try {
		const api = new PolymartAPI();
		
		const userApiKey = await api.getUserApiKey('discord', interaction.user.id);
		if (!userApiKey) {
			await interaction.editReply(
				'❌ You need to link your Polymart account first!\n\n' +
				'Use `/link` to connect your Discord account to Polymart.'
			);
			return;
		}

		const userApi = new PolymartAPI(userApiKey);

		const pollId = interaction.options.get('poll-id', true).value as string;
		const outcomeId = interaction.options.get('outcome-id', true).value as string;
		const points = interaction.options.get('points', true).value as number;

		const bet = await userApi.placeBet(pollId, outcomeId, points);

		const user = await userApi.getUserByDiscordId(interaction.user.id);

		await interaction.editReply(
			`✅ Bet placed successfully!\n` +
			`Wagered: **${points} points**\n` +
			`Remaining balance: **${user?.pointBalance || 0} points**\n` +
			`Bet ID: \`${bet._id}\`\n\n` +
			`View poll: https://polymart.xyz/polls/${pollId}`
		);
	} catch (error: any) {
		await interaction.editReply(`❌ Error: ${error.message}`);
	}
}
