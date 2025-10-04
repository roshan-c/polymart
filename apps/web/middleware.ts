import { NextRequest, NextResponse } from "next/server";

export const config = {
	matcher: "/polls/:pollId*",
};

export default async function middleware(req: NextRequest) {
	const userAgent = req.headers.get("user-agent") || "";
	
	const isSocialCrawler = /bot|crawler|spider|facebook|twitter|linkedin|slack|discord/i.test(userAgent);
	
	if (!isSocialCrawler) {
		return NextResponse.next();
	}

	const url = new URL(req.url);
	const pollIdMatch = url.pathname.match(/\/polls\/([^/]+)/);
	
	if (!pollIdMatch) {
		return NextResponse.next();
	}

	const pollId = pollIdMatch[1];

	try {
		const convexUrl = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
		if (!convexUrl) {
			return NextResponse.next();
		}

		const apiUrl = convexUrl.replace("convex.cloud", "convex.site");
		const pollResponse = await fetch(`${apiUrl}/api/polls/${pollId}`);

		if (!pollResponse.ok) {
			return NextResponse.next();
		}

		const { poll } = await pollResponse.json();

		const topOutcome = poll.outcomes.sort((a: any, b: any) => b.probability - a.probability)[0];
		const description = `${topOutcome.title} leading at ${topOutcome.probability.toFixed(0)}% • ${poll.totalVolume.toLocaleString()} pts volume • ${poll.totalBets} bets`;

		const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${poll.title} - Polymart</title>
    <meta name="description" content="${description}" />
    
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url.toString()}" />
    <meta property="og:title" content="${poll.title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${url.origin}/api/og/poll?id=${pollId}" />

    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${url.toString()}" />
    <meta property="twitter:title" content="${poll.title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="${url.origin}/api/og/poll?id=${pollId}" />
  </head>
  <body>
    <h1>${poll.title}</h1>
    <p>${description}</p>
    <a href="${url.toString()}">View on Polymart</a>
  </body>
</html>
		`;

		return new NextResponse(html, {
			headers: {
				"Content-Type": "text/html",
			},
		});
	} catch (error) {
		console.error("Error in middleware:", error);
		return NextResponse.next();
	}
}
