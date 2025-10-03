import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
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

    const pollId = interaction.options.get('poll-id', true).value as string;
    const outcomeId = interaction.options.get('outcome-id', true).value as string;
    const points = interaction.options.get('points', true).value as number;

    const bet = await api.placeBet(pollId, outcomeId, points);

    await interaction.editReply(
      `✅ Bet placed successfully!\n` +
      `Wagered: **${points} points**\n` +
      `Remaining balance: **${user.pointBalance - points} points**\n` +
      `Bet ID: \`${bet._id}\`\n\n` +
      `View poll: https://polymart.xyz/polls/${pollId}`
    );
  } catch (error: any) {
    await interaction.editReply(`Error: ${error.message}`);
  }
}
