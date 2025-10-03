import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { PolymartAPI } from '../api';

export const data = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('View details of a specific poll')
  .addStringOption(option =>
    option
      .setName('id')
      .setDescription('Poll ID')
      .setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  await interaction.deferReply();

  try {
    const api = new PolymartAPI();
    const pollId = interaction.options.get('id', true).value as string;
    const poll = await api.getPoll(pollId);

    const embed = new EmbedBuilder()
      .setTitle(poll.title)
      .setDescription(poll.description || 'No description provided')
      .setColor(poll.status === 'active' ? 0x00ff00 : poll.status === 'resolved' ? 0x0099ff : 0x999999)
      .addFields(
        { name: 'Status', value: poll.status, inline: true },
        { name: 'Total Volume', value: `${poll.totalVolume} points`, inline: true },
        { name: 'Total Bets', value: poll.totalBets.toString(), inline: true },
        { name: 'Creator', value: poll.creator.name, inline: true },
        { name: '\u200B', value: '\u200B' },
        ...poll.outcomes.map(outcome => ({
          name: `${outcome.title} - ${outcome.probability.toFixed(1)}%`,
          value: `ID: \`${outcome._id}\`\nVolume: ${outcome.volume} | Bets: ${outcome.betCount}`,
          inline: true
        }))
      )
      .setFooter({ text: `Poll ID: ${poll._id}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    await interaction.editReply(`Error: ${error.message}`);
  }
}
