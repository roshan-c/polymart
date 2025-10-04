import { ImageResponse } from "@vercel/og";

export const config = {
	runtime: "edge",
};

export default async function handler(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const pollId = searchParams.get("id");

		if (!pollId) {
			return new Response("Missing poll id parameter", { status: 400 });
		}

		const convexUrl = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
		if (!convexUrl) {
			return new Response("Convex URL not configured", { status: 500 });
		}

		const apiUrl = convexUrl.replace("convex.cloud", "convex.site");
		const pollResponse = await fetch(`${apiUrl}/api/polls/${pollId}`);

		if (!pollResponse.ok) {
			return new Response("Poll not found", { status: 404 });
		}

		const { poll } = await pollResponse.json();

		const topOutcomes = poll.outcomes
			.sort((a: any, b: any) => b.probability - a.probability)
			.slice(0, 3);

		return new ImageResponse(
			(
				<div
					style={{
						height: "100%",
						width: "100%",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						backgroundColor: "#000",
						backgroundImage: "radial-gradient(circle at 25px 25px, #333 2%, transparent 0%), radial-gradient(circle at 75px 75px, #333 2%, transparent 0%)",
						backgroundSize: "100px 100px",
					}}
				>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							padding: "60px",
							maxWidth: "1000px",
						}}
					>
						<div
							style={{
								fontSize: 72,
								fontWeight: 700,
								color: "white",
								textAlign: "center",
								marginBottom: 40,
								lineHeight: 1.2,
							}}
						>
							{poll.title}
						</div>

						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: 20,
								width: "100%",
							}}
						>
							{topOutcomes.map((outcome: any, index: number) => {
								const colors = ["#3b82f6", "#ef4444", "#10b981"];
								const color = colors[index];
								
								return (
									<div
										key={outcome._id}
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											backgroundColor: "rgba(255, 255, 255, 0.1)",
											borderRadius: 16,
											padding: "24px 32px",
										}}
									>
										<div
											style={{
												fontSize: 40,
												fontWeight: 600,
												color: "white",
												flex: 1,
											}}
										>
											{outcome.title}
										</div>
										<div
											style={{
												fontSize: 56,
												fontWeight: 700,
												color: color,
											}}
										>
											{outcome.probability.toFixed(0)}%
										</div>
									</div>
								);
							})}
						</div>

						<div
							style={{
								display: "flex",
								marginTop: 40,
								fontSize: 28,
								color: "#888",
								gap: 40,
							}}
						>
							<div>{poll.totalVolume.toLocaleString()} pts volume</div>
							<div>•</div>
							<div>{poll.totalBets} bets</div>
						</div>
					</div>
				</div>
			),
			{
				width: 1200,
				height: 630,
			}
		);
	} catch (error) {
		console.error("Error generating OG image:", error);
		return new Response("Failed to generate image", { status: 500 });
	}
}
