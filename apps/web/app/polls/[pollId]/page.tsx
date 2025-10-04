import { Metadata } from "next";
import { getPollById } from "@/lib/convex-server";
import PollDetailClient from "./poll-detail-client";

export async function generateMetadata({ params }: { params: Promise<{ pollId: string }> }): Promise<Metadata> {
	const { pollId } = await params;
	const poll = await getPollById(pollId);

	if (!poll) {
		return {
			title: "Poll Not Found | Polymart",
			description: "This prediction market could not be found.",
		};
	}

	const topOutcomes = poll.outcomes
		.sort((a, b) => b.probability - a.probability)
		.slice(0, 3);

	const outcomesSummary = topOutcomes
		.map((o) => `${o.title} (${o.probability.toFixed(0)}%)`)
		.join(", ");

	const description = poll.description 
		? `${poll.description} | ${outcomesSummary}`
		: `Current predictions: ${outcomesSummary}`;

	const ogImageUrl = `https://polymart.xyz/api/og/poll?id=${pollId}`;

	return {
		title: `${poll.title} | Polymart`,
		description,
		openGraph: {
			title: poll.title,
			description,
			url: `https://polymart.xyz/polls/${pollId}`,
			images: [{
				url: ogImageUrl,
				width: 1200,
				height: 630,
				alt: poll.title,
			}],
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title: poll.title,
			description,
			images: [ogImageUrl],
		},
	};
}

export default async function PollDetailPage({ params }: { params: Promise<{ pollId: string }> }) {
	const { pollId } = await params;
	return <PollDetailClient pollId={pollId} />;
}
