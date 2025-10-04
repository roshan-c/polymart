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

	async getUserApiKey(discordUserId: string): Promise<string | null> {
		const response = await fetch(
			`${this.baseUrl}/api/auth/discord/${discordUserId}`
		);

		if (response.status === 404) {
			return null;
		}

		if (!response.ok) {
			throw new Error("Failed to get user API key");
		}

		const data = await response.json();
		return data.apiKey;
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
}
