import { Client, GatewayIntentBits, Collection, Events, ChatInputCommandInteraction } from "discord.js";
import { config } from "./config.js";
import { linkCommand } from "./commands/link.js";
import { createPollCommand } from "./commands/create-poll.js";
import { betCommand } from "./commands/bet.js";
import { pollsCommand } from "./commands/polls.js";
import { pollCommand } from "./commands/poll.js";
import { myBetsCommand } from "./commands/my-bets.js";
import { profileCommand } from "./commands/profile.js";
import { resolvePollCommand } from "./commands/resolve-poll.js";

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
});

interface Command {
	data: any;
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const commands = new Collection<string, Command>();
commands.set(linkCommand.data.name, linkCommand);
commands.set(createPollCommand.data.name, createPollCommand);
commands.set(betCommand.data.name, betCommand);
commands.set(pollsCommand.data.name, pollsCommand);
commands.set(pollCommand.data.name, pollCommand);
commands.set(myBetsCommand.data.name, myBetsCommand);
commands.set(profileCommand.data.name, profileCommand);
commands.set(resolvePollCommand.data.name, resolvePollCommand);

client.once(Events.ClientReady, (c) => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = commands.get(interaction.commandName);
	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		const errorMessage = "There was an error executing this command!";
		
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: errorMessage, ephemeral: true });
		} else {
			await interaction.reply({ content: errorMessage, ephemeral: true });
		}
	}
});

client.login(config.discordToken);
