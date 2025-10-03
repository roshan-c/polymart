import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@polymart/backend/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export const Route = createFileRoute("/polls/")({
	component: PollsIndexComponent,
});

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

function PollCard({ poll }: { poll: any }) {
	const probabilityHistory = useQuery(api.polls.getProbabilityHistory, { pollId: poll._id });

	const chartData = probabilityHistory?.history || [];
	const outcomes = probabilityHistory?.outcomes || [];

	return (
		<Link to="/polls/$pollId" params={{ pollId: poll._id }}>
			<Card className="h-full transition-shadow hover:shadow-lg">
				<CardHeader>
					<CardTitle className="line-clamp-2">{poll.title}</CardTitle>
					<CardDescription>by {poll.creator?.name || "Unknown"}</CardDescription>
				</CardHeader>
				<CardContent>
					{chartData.length > 0 && (
						<div className="mb-4">
							<div className="h-24">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
										<YAxis
											domain={[0, 100]}
											ticks={[0, 50, 100]}
											tickFormatter={(value) => `${value}%`}
											width={35}
											className="text-xs"
										/>
										{outcomes.map((outcome: string, index: number) => (
											<Line
												key={outcome}
												type="monotone"
												dataKey={outcome}
												stroke={COLORS[index % COLORS.length]}
												strokeWidth={2}
												dot={false}
											/>
										))}
									</LineChart>
								</ResponsiveContainer>
							</div>
							<div className="mt-2 flex flex-wrap gap-2">
								{outcomes.map((outcome: string, index: number) => {
									const latestData = chartData[chartData.length - 1];
									const probability = latestData?.[outcome] || 0;
									return (
										<div key={outcome} className="flex items-center gap-1.5 text-xs">
											<div
												className="h-2 w-2 rounded-full"
												style={{ backgroundColor: COLORS[index % COLORS.length] }}
											/>
											<span className="text-muted-foreground truncate max-w-[80px]">{outcome}</span>
											<span className="font-medium">{probability.toFixed(0)}%</span>
										</div>
									);
								})}
							</div>
						</div>
					)}
					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Volume</span>
							<span className="font-medium">{poll.totalVolume.toLocaleString()} pts</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Bets</span>
							<span className="font-medium">{poll.totalBets}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Outcomes</span>
							<span className="font-medium">{poll.outcomes.length}</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}

function PollsIndexComponent() {
	const polls = useQuery(api.polls.getAll, {});

	if (polls === undefined) {
		return (
			<div className="container mx-auto max-w-6xl px-4 py-8">
				<div className="mb-6 flex items-center justify-between">
					<h1 className="text-3xl font-bold">Markets</h1>
					<Skeleton className="h-10 w-32" />
				</div>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<Card key={i}>
							<CardHeader>
								<Skeleton className="h-6 w-3/4" />
								<Skeleton className="h-4 w-1/2" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-20 w-full" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	const activePolls = polls.filter((p) => p.status === "active");
	const resolvedPolls = polls.filter((p) => p.status === "resolved");

	return (
		<div className="container mx-auto max-w-6xl px-4 py-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Markets</h1>
				<Link to="/polls/create">
					<Button>Create Poll</Button>
				</Link>
			</div>

			{activePolls.length > 0 && (
				<section className="mb-8">
					<h2 className="mb-4 text-xl font-semibold">Active Markets</h2>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{activePolls.map((poll) => (
							<PollCard key={poll._id} poll={poll} />
						))}
					</div>
				</section>
			)}

			{resolvedPolls.length > 0 && (
				<section>
					<h2 className="mb-4 text-xl font-semibold">Resolved Markets</h2>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{resolvedPolls.map((poll) => (
							<div key={poll._id} className="opacity-75 transition-opacity hover:opacity-100">
								<PollCard poll={poll} />
							</div>
						))}
					</div>
				</section>
			)}

			{polls.length === 0 && (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<p className="mb-4 text-lg text-muted-foreground">No markets yet</p>
					<Link to="/polls/create">
						<Button>Create the first poll</Button>
					</Link>
				</div>
			)}
		</div>
	);
}
