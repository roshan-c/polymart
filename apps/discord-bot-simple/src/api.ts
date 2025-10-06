export class PolymartAPI {
	private baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	async initiateLinking(discordUserId: string, discordUserName: string): Promise<string> {
		const response = await fetch(`${this.baseUrl}/api/link/initiate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				platform: "discord",
				platformUserId: discordUserId,
				platformUserName: discordUserName,
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to initiate linking");
		}

		const data = await response.json();
		return data.linkUrl;
	}

	async getUserAuth(discordUserId: string): Promise<{ apiKey: string; userId: string } | null> {
		console.log(`Fetching user data for Discord ID: ${discordUserId}`);
		
		const userResponse = await fetch(
			`${this.baseUrl}/api/users/discord/${discordUserId}`
		);

		console.log(`User response status: ${userResponse.status}`);

		if (userResponse.status === 404) {
			console.log("User not found in /api/users/discord");
			return null;
		}

		if (!userResponse.ok) {
			const errorText = await userResponse.text();
			console.log(`User fetch error: ${errorText}`);
			throw new Error("Failed to get user");
		}

		const userData = await userResponse.json();
		console.log(`User data:`, userData);

		const authResponse = await fetch(
			`${this.baseUrl}/api/auth/discord/${discordUserId}`
		);

		console.log(`Auth response status: ${authResponse.status}`);

		if (authResponse.status === 404) {
			console.log("Auth not found in /api/auth/discord");
			return null;
		}

		if (!authResponse.ok) {
			const errorText = await authResponse.text();
			console.log(`Auth fetch error: ${errorText}`);
			throw new Error("Failed to get user API key");
		}

		const authData = await authResponse.json();
		console.log(`Auth data:`, authData);
		
		return {
			apiKey: authData.apiKey,
			userId: userData.user._id,
		};
	}

	async getUserApiKey(discordUserId: string): Promise<string | null> {
		const auth = await this.getUserAuth(discordUserId);
		return auth ? auth.apiKey : null;
	}

	async createPoll(
		apiKey: string,
		title: string,
		outcomes: string[],
		description?: string
	): Promise<{ pollId: string }> {
		const response = await fetch(`${this.baseUrl}/api/polls`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				title,
				outcomes,
				description,
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to create poll");
		}

		return await response.json();
	}

	async getPolls(status?: string): Promise<any> {
		const url = status 
			? `${this.baseUrl}/api/polls?status=${status}`
			: `${this.baseUrl}/api/polls`;
		
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error("Failed to fetch polls");
		}

		return await response.json();
	}

	async getPoll(pollId: string): Promise<any> {
		const response = await fetch(`${this.baseUrl}/api/polls/${pollId}`);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to fetch poll");
		}

		return await response.json();
	}

	async placeBet(
		apiKey: string,
		pollId: string,
		outcomeId: string,
		pointsWagered: number
	): Promise<any> {
		const response = await fetch(`${this.baseUrl}/api/bets`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				pollId,
				outcomeId,
				pointsWagered,
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to place bet");
		}

		return await response.json();
	}

	async getUserBets(apiKey: string, userId: string): Promise<any> {
		const response = await fetch(`${this.baseUrl}/api/users/${userId}/bets`);

		if (!response.ok) {
			throw new Error("Failed to fetch user bets");
		}

		return await response.json();
	}

	async getUserProfile(userId: string): Promise<any> {
		const response = await fetch(`${this.baseUrl}/api/users/${userId}`);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to fetch user profile");
		}

		return await response.json();
	}

	async resolvePoll(
		apiKey: string,
		pollId: string,
		winningOutcomeId: string,
		evidenceUrl?: string,
		evidenceText?: string
	): Promise<any> {
		const response = await fetch(`${this.baseUrl}/api/admin/polls/${pollId}/resolve`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				winningOutcomeId,
				evidenceUrl,
				evidenceText,
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to resolve poll");
		}

		return await response.json();
	}
}
