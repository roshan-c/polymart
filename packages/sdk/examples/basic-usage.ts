import { PolymartSDK, PolymartSDKError } from "@polymart/sdk";

const client = new PolymartSDK({
	apiKey: "your_api_key_here",
});

async function main() {
	try {
		console.log("Getting all active polls...");
		const { polls } = await client.getPolls({ status: "active" });
		console.log(`Found ${polls.length} active polls`);

		if (polls.length > 0) {
			console.log("\nFirst poll:", polls[0]);

			console.log("\nGetting detailed poll information...");
			const { poll } = await client.getPoll(polls[0]._id);
			console.log("Poll details:", poll);
		}

		console.log("\nCreating a new poll...");
		const { pollId } = await client.createPoll({
			title: "Will it rain tomorrow?",
			description: "Prediction market for rain forecast",
			outcomes: ["Yes", "No"],
		});
		console.log("Created poll with ID:", pollId);

		const { poll } = await client.getPoll(pollId);
		console.log("\nNew poll details:", poll);

		console.log("\nPlacing a bet...");
		const { bet } = await client.placeBet({
			pollId,
			outcomeId: poll.outcomes[0]._id,
			pointsWagered: 100,
		});
		console.log("Placed bet:", bet);

		console.log("\nGetting user information...");
		const { user, stats } = await client.getUser(poll.creator._id);
		console.log("User:", user);
		console.log("Stats:", stats);

		console.log("\nGetting user's bets...");
		const { bets } = await client.getUserBets(poll.creator._id);
		console.log(`User has ${bets.length} bets`);
	} catch (error) {
		if (error instanceof PolymartSDKError) {
			console.error("API Error:", error.message);
			console.error("Status Code:", error.statusCode);
			console.error("Response:", error.response);
		} else {
			console.error("Unexpected error:", error);
		}
	}
}

main();
