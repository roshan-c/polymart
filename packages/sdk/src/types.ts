export type PollStatus = "active" | "resolved" | "cancelled";

export interface User {
	_id: string;
	name: string;
	email: string;
	points?: number;
	createdAt: number;
}

export interface Outcome {
	_id: string;
	title: string;
	probability: number;
	volume: number;
	betCount: number;
}

export interface Poll {
	_id: string;
	title: string;
	description?: string;
	status: PollStatus;
	createdAt: number;
	totalVolume: number;
	totalBets: number;
	outcomes: Outcome[];
	creator: User;
}

export interface Bet {
	_id: string;
	pollId: string;
	outcomeId: string;
	pointsWagered: number;
	createdAt: number;
	poll?: {
		title: string;
		status: PollStatus;
	};
	outcome?: {
		title: string;
	};
}

export interface UserStats {
	totalBets: number;
	totalWagered: number;
	totalWinnings: number;
	netProfit: number;
	pollsCreated: number;
}

export interface GetPollsParams {
	status?: PollStatus;
}

export interface GetPollsResponse {
	polls: Poll[];
}

export interface GetPollResponse {
	poll: Poll;
}

export interface CreatePollParams {
	title: string;
	description?: string;
	outcomes: string[];
}

export interface CreatePollResponse {
	pollId: string;
}

export interface PlaceBetParams {
	pollId: string;
	outcomeId: string;
	pointsWagered: number;
}

export interface PlaceBetResponse {
	bet: Bet;
}

export interface GetUserBetsResponse {
	bets: Bet[];
}

export interface GetUserResponse {
	user: User;
	stats: UserStats;
}

export interface ResolvePollParams {
	winningOutcomeId: string;
	evidenceUrl?: string;
	evidenceText?: string;
}

export interface ResolvePollResponse {
	message: string;
	winnersCount: number;
	totalPayout: number;
}

export interface ErrorResponse {
	error: string;
}

export interface SDKConfig {
	baseUrl?: string;
	apiKey?: string;
}
