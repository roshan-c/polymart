import { config } from './config';

interface Poll {
  _id: string;
  title: string;
  description?: string;
  status: string;
  totalVolume: number;
  totalBets: number;
  outcomes: Array<{
    _id: string;
    title: string;
    probability: number;
    volume: number;
    betCount: number;
  }>;
  creator: {
    name: string;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  pointBalance: number;
  discordId?: string;
}

interface ApiResponse<T> {
  [key: string]: T;
}

export class PolymartAPI {
	private baseUrl: string;
	private apiKey: string;

	constructor(apiKey?: string) {
		this.baseUrl = config.polymartApiBase;
		this.apiKey = apiKey || config.polymartApiKey;
	}

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey && !endpoint.includes('/api/polls?') && options.method !== 'GET') {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getUserByDiscordId(discordId: string): Promise<User | null> {
    try {
      const data = await this.fetch<ApiResponse<User>>(`/api/users/discord/${discordId}`);
      return data.user;
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  async getPolls(status?: 'active' | 'resolved' | 'cancelled'): Promise<Poll[]> {
    const query = status ? `?status=${status}` : '';
    const data = await this.fetch<ApiResponse<Poll[]>>(`/api/polls${query}`);
    return data.polls;
  }

  async getPoll(pollId: string): Promise<Poll> {
    const data = await this.fetch<ApiResponse<Poll>>(`/api/polls/${pollId}`);
    return data.poll;
  }

	async createPoll(title: string, outcomes: string[], description?: string, allowMultipleVotes?: boolean): Promise<string> {
		const data = await this.fetch<{ pollId: string }>('/api/polls', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
			},
			body: JSON.stringify({ title, outcomes, description, allowMultipleVotes }),
		});
		return data.pollId;
	}

	async placeBet(pollId: string, outcomeId: string, pointsWagered: number): Promise<any> {
		const data = await this.fetch<{ bet: any }>('/api/bets', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
			},
			body: JSON.stringify({ pollId, outcomeId, pointsWagered }),
		});
		return data.bet;
	}

	async initiateLinking(platform: string, platformUserId: string): Promise<{ token: string; linkUrl: string }> {
		const data = await this.fetch<{ token: string; linkUrl: string }>('/api/link/initiate', {
			method: 'POST',
			body: JSON.stringify({ platform, platformUserId }),
		});
		return data;
	}

	async getUserApiKey(platform: string, platformUserId: string): Promise<string | null> {
		try {
			const data = await this.fetch<{ apiKey: string | null }>(`/api/auth/${platform}/${platformUserId}`);
			return data.apiKey;
		} catch (error: any) {
			if (error.message.includes('404') || error.message.includes('not found')) {
				return null;
			}
			throw error;
		}
	}
}
