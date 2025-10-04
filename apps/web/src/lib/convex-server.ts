import { ConvexHttpClient } from "convex/browser";
import { api } from "@polymart/backend/convex/_generated/api";

export const convexServerClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function getPollById(pollId: string) {
	try {
		const poll = await convexServerClient.query(api.polls.get, { pollId: pollId as any });
		return poll;
	} catch (error) {
		console.error("Error fetching poll:", error);
		return null;
	}
}
