import { REST, Routes } from "discord.js";
import { config } from "./config.js";
import { linkCommand } from "./commands/link.js";
import { createPollCommand } from "./commands/create-poll.js";
import { betCommand } from "./commands/bet.js";
import { pollsCommand } from "./commands/polls.js";
import { pollCommand } from "./commands/poll.js";
import { myBetsCommand } from "./commands/my-bets.js";
import { profileCommand } from "./commands/profile.js";
import { resolvePollCommand } from "./commands/resolve-poll.js";

const commands = [
	linkCommand.data.toJSON(),
	createPollCommand.data.toJSON(),
	betCommand.data.toJSON(),
	pollsCommand.data.toJSON(),
	pollCommand.data.toJSON(),
	myBetsCommand.data.toJSON(),
	profileCommand.data.toJSON(),
	resolvePollCommand.data.toJSON(),
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
