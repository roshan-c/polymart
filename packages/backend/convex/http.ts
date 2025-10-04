import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
	path: "/api/polls",
	method: "GET",
	handler: httpAction(async (ctx, request) => {
		const url = new URL(request.url);
		const status = url.searchParams.get("status") as "active" | "resolved" | "cancelled" | null;
		
		const polls = await ctx.runQuery(api.polls.getAll, {
			status: status || undefined,
		});
		
		return new Response(JSON.stringify({ polls }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}),
});

http.route({
	path: "/api/polls/:pollId",
	method: "GET",
	handler: httpAction(async (ctx, request) => {
		const url = new URL(request.url);
		const pathParts = url.pathname.split("/");
		const pollId = pathParts[pathParts.length - 1];
		
		const poll = await ctx.runQuery(api.polls.get, { pollId: pollId as any });
		
		if (!poll) {
			return new Response(JSON.stringify({ error: "Poll not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}
		
		return new Response(JSON.stringify({ poll }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}),
});

http.route({
	path: "/api/polls",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const authHeader = request.headers.get("Authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return new Response(
				JSON.stringify({ error: "Missing or invalid authorization header" }),
				{ status: 401, headers: { "Content-Type": "application/json" } }
			);
		}

		const apiKey = authHeader.substring(7);
		const validation = await ctx.runQuery(api.apiKeys.validateApiKey, { key: apiKey });
		
		if (!validation || !validation.user) {
			return new Response(
				JSON.stringify({ error: "Invalid API key" }),
				{ status: 401, headers: { "Content-Type": "application/json" } }
			);
		}

		const body = await request.json();
		const { title, description, outcomes } = body;
		
		if (!title || !outcomes) {
			return new Response(
				JSON.stringify({ error: "Missing required fields: title, outcomes" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}
		
		if (outcomes.length < 2 || outcomes.length > 10) {
			return new Response(
				JSON.stringify({ error: "Polls must have between 2 and 10 outcomes" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}
		
		try {
			const pollId = await ctx.runMutation(api.polls.createWithAuth, {
				userId: validation.user._id,
				title,
				description,
				outcomes,
			});
			
			return new Response(JSON.stringify({ pollId }), {
				status: 201,
				headers: { "Content-Type": "application/json" },
			});
		} catch (error: any) {
			return new Response(
				JSON.stringify({ error: error.message }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}
	}),
});

http.route({
	path: "/api/bets",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const authHeader = request.headers.get("Authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return new Response(
				JSON.stringify({ error: "Missing or invalid authorization header" }),
				{ status: 401, headers: { "Content-Type": "application/json" } }
			);
		}

		const apiKey = authHeader.substring(7);
		const validation = await ctx.runQuery(api.apiKeys.validateApiKey, { key: apiKey });
		
		if (!validation || !validation.user) {
			return new Response(
				JSON.stringify({ error: "Invalid API key" }),
				{ status: 401, headers: { "Content-Type": "application/json" } }
			);
		}

		const body = await request.json();
		const { pollId, outcomeId, pointsWagered } = body;
		
		if (!pollId || !outcomeId || pointsWagered === undefined) {
			return new Response(
				JSON.stringify({ error: "Missing required fields: pollId, outcomeId, pointsWagered" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}
		
		try {
			const bet = await ctx.runMutation(api.bets.placeBetWithAuth, {
				userId: validation.user._id,
				pollId,
				outcomeId,
				pointsWagered: Number(pointsWagered),
			});
			
			return new Response(JSON.stringify({ bet }), {
				status: 201,
				headers: { "Content-Type": "application/json" },
			});
		} catch (error: any) {
			return new Response(
				JSON.stringify({ error: error.message }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}
	}),
});

http.route({
	path: "/api/users/:userId/bets",
	method: "GET",
	handler: httpAction(async (ctx, request) => {
		const url = new URL(request.url);
		const pathParts = url.pathname.split("/");
		const userId = pathParts[3];
		
		const bets = await ctx.runQuery(api.bets.getUserBets, { userId: userId as any });
		
		return new Response(JSON.stringify({ bets }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}),
});

http.route({
	path: "/api/users/:userId",
	method: "GET",
	handler: httpAction(async (ctx, request) => {
		const url = new URL(request.url);
		const pathParts = url.pathname.split("/");
		const userId = pathParts[3];
		
		const user = await ctx.runQuery(api.users.getUser, { userId: userId as any });
		const stats = await ctx.runQuery(api.users.getUserStats, { userId: userId as any });
		
		if (!user) {
			return new Response(JSON.stringify({ error: "User not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}
		
		return new Response(JSON.stringify({ user, stats }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}),
});

http.route({
	path: "/api/admin/polls/:pollId/resolve",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const url = new URL(request.url);
		const pathParts = url.pathname.split("/");
		const pollId = pathParts[4];
		
		const body = await request.json();
		const { winningOutcomeId, evidenceUrl, evidenceText } = body;
		
		if (!winningOutcomeId) {
			return new Response(
				JSON.stringify({ error: "Missing required fields: winningOutcomeId" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}
		
		try {
			const result = await ctx.runMutation(api.admin.resolvePoll, {
				pollId: pollId as any,
				winningOutcomeId,
				evidenceUrl,
				evidenceText,
			});
			
			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		} catch (error: any) {
			return new Response(
				JSON.stringify({ error: error.message }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}
	}),
});

http.route({
	path: "/api/users/discord/:discordId",
	method: "GET",
	handler: httpAction(async (ctx, request) => {
		const url = new URL(request.url);
		const pathParts = url.pathname.split("/");
		const discordId = pathParts[pathParts.length - 1];
		
		const user = await ctx.runQuery(api.users.getUserByDiscordId, { discordId });
		
		if (!user) {
			return new Response(JSON.stringify({ error: "User not found. Please sign in at https://polymart.xyz first." }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}
		
		return new Response(JSON.stringify({ user }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}),
});

export default http;
