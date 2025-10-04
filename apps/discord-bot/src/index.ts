import { Client, Collection, GatewayIntentBits, Events, ChatInputCommandInteraction } from 'discord.js';
import { config } from './config';
import * as pollsCommand from './commands/polls';
import * as pollCommand from './commands/poll';
import * as createPollCommand from './commands/create-poll';
import * as betCommand from './commands/bet';
import * as linkCommand from './commands/link';

interface Command {
	data: any;
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
});

const commands = new Collection<string, Command>();
commands.set(pollsCommand.data.name, pollsCommand as Command);
commands.set(pollCommand.data.name, pollCommand as Command);
commands.set(createPollCommand.data.name, createPollCommand as Command);
commands.set(betCommand.data.name, betCommand as Command);
commands.set(linkCommand.data.name, linkCommand as Command);

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const reply = { content: 'There was an error executing this command!', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.login(config.discordToken);
