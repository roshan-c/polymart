import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { PolymartAPI } from '../api';

export const data = new SlashCommandBuilder()
  .setName('polls')
  .setDescription('List all active prediction markets')
  .addStringOption(option =>
    option
      .setName('status')
      .setDescription('Filter by status')
      .addChoices(
        { name: 'Active', value: 'active' },
        { name: 'Resolved', value: 'resolved' },
        { name: 'Cancelled', value: 'cancelled' }
      )
  );

export async function execute(interaction: CommandInteraction) {
  await interaction.deferReply();

  try {
    const api = new PolymartAPI();
    const status = interaction.options.get('status')?.value as 'active' | 'resolved' | 'cancelled' | undefined;
    const polls = await api.getPolls(status);

    if (polls.length === 0) {
      await interaction.editReply('No polls found.');
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`${status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'} Polls`)
      .setColor(status === 'active' ? 0x00ff00 : status === 'resolved' ? 0x0099ff : 0x999999)
      .setDescription(polls.slice(0, 10).map(poll => {
        const topOutcome = poll.outcomes.sort((a, b) => b.probability - a.probability)[0];
        return `**${poll.title}**\n` +
          `ID: \`${poll._id}\` | Status: ${poll.status}\n` +
          `Leading: ${topOutcome.title} (${topOutcome.probability.toFixed(1)}%)\n` +
          `Volume: ${poll.totalVolume} points | Bets: ${poll.totalBets}`;
      }).join('\n\n'))
      .setFooter({ text: polls.length > 10 ? `Showing 10 of ${polls.length} polls` : `${polls.length} poll(s)` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    await interaction.editReply(`Error: ${error.message}`);
  }
}
