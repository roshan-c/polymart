import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { PolymartAPI } from '../api';

export const data = new SlashCommandBuilder()
	.setName('create-poll')
	.setDescription('Create a new prediction market')
	.addStringOption(option =>
		option
			.setName('title')
			.setDescription('Poll title')
			.setRequired(true)
	)
	.addStringOption(option =>
		option
			.setName('outcomes')
			.setDescription('Comma-separated outcomes (e.g., "Yes,No" or "A,B,C")')
			.setRequired(true)
	)
	.addStringOption(option =>
		option
			.setName('description')
			.setDescription('Poll description (optional)')
	)
	.addBooleanOption(option =>
		option
			.setName('allow-multiple-votes')
			.setDescription('Allow users to vote on multiple outcomes (default: false)')
	);

export async function execute(interaction: CommandInteraction) {
	await interaction.deferReply();

	try {
		const api = new PolymartAPI();
		
		const user = await api.getUserByDiscordId(interaction.user.id);
		if (!user) {
			await interaction.editReply(
				'❌ You need to sign in to Polymart first!\n\n' +
				'Visit https://polymart.xyz and sign in with Discord to link your account.'
			);
			return;
		}

		const title = interaction.options.get('title', true).value as string;
		const outcomesStr = interaction.options.get('outcomes', true).value as string;
		const description = interaction.options.get('description')?.value as string | undefined;
		const allowMultipleVotes = interaction.options.get('allow-multiple-votes')?.value as boolean | undefined;

		const outcomes = outcomesStr.split(',').map(o => o.trim()).filter(o => o);

		if (outcomes.length < 2 || outcomes.length > 10) {
			await interaction.editReply('Error: Polls must have between 2 and 10 outcomes.');
			return;
		}

		const pollId = await api.createPoll(title, outcomes, description, allowMultipleVotes);

		await interaction.editReply(
			`✅ Poll created successfully!\n` +
			`**${title}**\n` +
			`Outcomes: ${outcomes.join(', ')}\n` +
			`Multiple votes allowed: ${allowMultipleVotes ? 'Yes' : 'No'}\n` +
			`Poll ID: \`${pollId}\`\n\n` +
			`View it: https://polymart.xyz/polls/${pollId}`
		);
	} catch (error: any) {
		await interaction.editReply(`Error: ${error.message}`);
	}
}
