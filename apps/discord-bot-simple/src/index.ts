import { Client, GatewayIntentBits, Collection, Events } from "discord.js";
import { config } from "./config.js";
import { linkCommand } from "./commands/link.js";
import { createPollCommand } from "./commands/create-poll.js";

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
});

const commands = new Collection();
commands.set(linkCommand.data.name, linkCommand);
commands.set(createPollCommand.data.name, createPollCommand);

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
