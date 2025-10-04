import { REST, Routes } from "discord.js";
import { config } from "./config.js";
import { linkCommand } from "./commands/link.js";
import { createPollCommand } from "./commands/create-poll.js";

const commands = [
	linkCommand.data.toJSON(),
	createPollCommand.data.toJSON(),
];

const rest = new REST().setToken(config.discordToken);

async function deployCommands() {
	try {
		console.log(`Deploying ${commands.length} application commands...`);

		await rest.put(
			Routes.applicationCommands(config.discordClientId),
			{ body: commands }
		);

		console.log("Successfully deployed application commands.");
	} catch (error) {
		console.error("Error deploying commands:", error);
	}
}

deployCommands();
