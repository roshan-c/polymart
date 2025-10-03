import { REST, Routes } from 'discord.js';
import { config } from './config';
import * as pollsCommand from './commands/polls';
import * as pollCommand from './commands/poll';
import * as createPollCommand from './commands/create-poll';
import * as betCommand from './commands/bet';

const commands = [
  pollsCommand.data.toJSON(),
  pollCommand.data.toJSON(),
  createPollCommand.data.toJSON(),
  betCommand.data.toJSON(),
];

const rest = new REST().setToken(config.discordToken);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    const data = await rest.put(
      Routes.applicationCommands(config.discordClientId),
      { body: commands },
    ) as any[];

    console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
