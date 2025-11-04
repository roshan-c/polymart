import type {
	SDKConfig,
	GetPollsParams,
	GetPollsResponse,
	GetPollResponse,
	CreatePollParams,
	CreatePollResponse,
	PlaceBetParams,
	PlaceBetResponse,
	GetUserBetsResponse,
	GetUserResponse,
	ResolvePollParams,
	ResolvePollResponse,
	ErrorResponse,
} from "./types";

export class PolymartSDKError extends Error {
	constructor(
		message: string,
		public statusCode?: number,
		public response?: ErrorResponse
	) {
		super(message);
		this.name = "PolymartSDKError";
	}
}

export class PolymartSDK {
	private baseUrl: string;
	private apiKey?: string;

	constructor(config: SDKConfig = {}) {
		this.baseUrl = config.baseUrl || "https://youthful-lark-845.convex.site";
		this.apiKey = config.apiKey;
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			...(options.headers as Record<string, string>),
		};

		if (this.apiKey && !headers["Authorization"]) {
			headers["Authorization"] = `Bearer ${this.apiKey}`;
		}

		const response = await fetch(url, {
			...options,
			headers,
		});

		let data: any;
		try {
			data = await response.json();
		} catch (error) {
			if (!response.ok) {
				throw new PolymartSDKError(
					`HTTP ${response.status}: ${response.statusText}`,
					response.status
				);
			}
			throw new PolymartSDKError(
				"Failed to parse response as JSON",
				response.status
			);
		}

		if (!response.ok) {
			throw new PolymartSDKError(
				data.error || `HTTP ${response.status}: ${response.statusText}`,
				response.status,
				data
			);
		}

		return data as T;
	}

	async getPolls(params?: GetPollsParams): Promise<GetPollsResponse> {
		const queryParams = new URLSearchParams();
		if (params?.status) {
			queryParams.set("status", params.status);
		}
		const queryString = queryParams.toString();
		const endpoint = `/api/polls${queryString ? `?${queryString}` : ""}`;
		return this.request<GetPollsResponse>(endpoint);
	}

	async getPoll(pollId: string): Promise<GetPollResponse> {
		return this.request<GetPollResponse>(`/api/polls/${pollId}`);
	}

	async createPoll(params: CreatePollParams): Promise<CreatePollResponse> {
		if (!this.apiKey) {
			throw new PolymartSDKError(
				"API key is required for this operation. Please provide an API key when initializing the SDK."
			);
		}

		return this.request<CreatePollResponse>("/api/polls", {
			method: "POST",
			body: JSON.stringify(params),
		});
	}

	async placeBet(params: PlaceBetParams): Promise<PlaceBetResponse> {
		if (!this.apiKey) {
			throw new PolymartSDKError(
				"API key is required for this operation. Please provide an API key when initializing the SDK."
			);
		}

		return this.request<PlaceBetResponse>("/api/bets", {
			method: "POST",
			body: JSON.stringify(params),
		});
	}

	async getUserBets(userId: string): Promise<GetUserBetsResponse> {
		return this.request<GetUserBetsResponse>(`/api/users/${userId}/bets`);
	}

	async getUser(userId: string): Promise<GetUserResponse> {
		return this.request<GetUserResponse>(`/api/users/${userId}`);
	}

	async resolvePoll(
		pollId: string,
		params: ResolvePollParams
	): Promise<ResolvePollResponse> {
		if (!this.apiKey) {
			throw new PolymartSDKError(
				"API key is required for this operation. Please provide an API key when initializing the SDK."
			);
		}

		return this.request<ResolvePollResponse>(
			`/api/admin/polls/${pollId}/resolve`,
			{
				method: "POST",
				body: JSON.stringify(params),
			}
		);
	}

	setApiKey(apiKey: string): void {
		this.apiKey = apiKey;
	}

	setBaseUrl(baseUrl: string): void {
		this.baseUrl = baseUrl;
	}
}
