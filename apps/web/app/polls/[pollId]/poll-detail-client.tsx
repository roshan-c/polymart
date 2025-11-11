"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@polymart/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/useCurrentUser";
import Link from "next/link";
import { ProbabilityChart } from "@/components/probability-chart";

export default function PollDetailClient({ pollId }: { pollId: string }) {
	const router = useRouter();
	const currentUser = useCurrentUser();
	const poll = useQuery(api.polls.get, { pollId: pollId as any });
	const probabilityHistory = useQuery(api.polls.getProbabilityHistory, { pollId: pollId as any });
	const placeBet = useMutation(api.bets.placeBet);
	const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
	const [betAmount, setBetAmount] = useState("");
	const [isPlacingBet, setIsPlacingBet] = useState(false);

	const handlePlaceBet = async () => {
		if (!currentUser) {
			toast.error("Please sign in to place a bet");
			return;
		}

		if (!selectedOutcome || !betAmount || Number(betAmount) <= 0) {
			toast.error("Please select an outcome and enter a valid bet amount");
			return;
		}

		setIsPlacingBet(true);
		try {
			await placeBet({
				pollId: pollId as any,
				outcomeId: selectedOutcome as any,
				pointsWagered: Number(betAmount),
			});
			toast.success("Bet placed successfully!");
			setBetAmount("");
			setSelectedOutcome(null);
		} catch (error: any) {
			const errorMessage = 
				error?.data || 
				error?.message || 
				(typeof error === "string" ? error : "Failed to place bet");
			toast.error(errorMessage);
		} finally {
			setIsPlacingBet(false);
		}
	};

	if (poll === undefined) {
		return (
			<div className="container mx-auto max-w-4xl px-4 py-8">
				<div className="space-y-4">
					<Skeleton className="h-8 w-3/4" />
					<Skeleton className="h-40 w-full" />
					<Skeleton className="h-60 w-full" />
				</div>
			</div>
		);
	}

	if (!poll) {
		return (
			<div className="container mx-auto max-w-4xl px-4 py-8">
				<Card>
					<CardContent className="pt-6">
						<p className="text-center text-muted-foreground">Poll not found</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const isResolved = poll.status === "resolved";
	const winningOutcome = poll.outcomes.find((o) => o._id === poll.winningOutcomeId);

	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<Button variant="ghost" onClick={() => router.push("/polls")} className="mb-4">
				← Back to Markets
			</Button>

			<div className="space-y-6">
				<Card>
					<CardHeader>
						<div className="flex items-start justify-between">
							<div>
								<CardTitle className="text-2xl">{poll.title}</CardTitle>
								<CardDescription>
									by {poll.creator?.name || "Unknown"} • {new Date(poll.createdAt).toLocaleDateString()}
								</CardDescription>
							</div>
							<div className={`rounded-full px-3 py-1 text-sm font-medium ${
								poll.status === "active" 
									? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
									: poll.status === "resolved"
									? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
									: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
							}`}>
								{poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{poll.description && <p className="text-muted-foreground mb-4">{poll.description}</p>}
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span className="text-muted-foreground">Total Volume</span>
								<p className="text-lg font-semibold">{poll.totalVolume.toLocaleString()} pts</p>
							</div>
							<div>
								<span className="text-muted-foreground">Total Bets</span>
								<p className="text-lg font-semibold">{poll.totalBets}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<ProbabilityChart
					data={probabilityHistory?.history || []}
					outcomes={probabilityHistory?.outcomes || []}
				/>

				{isResolved && winningOutcome && (
					<Card className="border-green-500">
						<CardHeader>
							<CardTitle className="text-lg">Resolved</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="mb-2">
								<span className="font-semibold">Winning Outcome:</span> {winningOutcome.title}
							</p>
							{poll.evidenceUrl && (
								<p className="mb-2">
									<span className="font-semibold">Evidence:</span>{" "}
									<a href={poll.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
										{poll.evidenceUrl}
									</a>
								</p>
							)}
							{poll.evidenceText && (
								<p>
									<span className="font-semibold">Notes:</span> {poll.evidenceText}
								</p>
							)}
						</CardContent>
					</Card>
				)}

				<Card>
					<CardHeader>
						<CardTitle>Outcomes</CardTitle>
						<CardDescription>Current market probabilities</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{poll.outcomes.map((outcome) => {
							const isWinner = isResolved && outcome._id === poll.winningOutcomeId;
							return (
								<div
									key={outcome._id}
									className={`rounded-lg border p-4 transition-colors ${
										selectedOutcome === outcome._id
											? "border-primary bg-primary/5"
											: isWinner
											? "border-green-500 bg-green-50 dark:bg-green-950"
											: "hover:bg-muted/50"
									} ${!isResolved && poll.status === "active" ? "cursor-pointer" : ""}`}
									onClick={() => {
										if (!isResolved && poll.status === "active") {
											setSelectedOutcome(outcome._id);
										}
									}}
								>
									<div className="flex items-center justify-between mb-2">
										<span className="font-medium">{outcome.title}</span>
										<span className="text-lg font-bold">{outcome.probability.toFixed(1)}%</span>
									</div>
									<div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-muted">
										<div
											className={`h-full ${isWinner ? "bg-green-500" : "bg-primary"}`}
											style={{ width: `${outcome.probability}%` }}
										/>
									</div>
									<div className="flex justify-between text-sm text-muted-foreground">
										<span>{outcome.volume.toLocaleString()} pts</span>
										<span>{outcome.betCount} bets</span>
									</div>
								</div>
							);
						})}
					</CardContent>
				</Card>

				{poll.status === "active" && (
					<Card>
						<CardHeader>
							<CardTitle>Place Bet</CardTitle>
							<CardDescription>
								{poll.allowMultipleVotes === true
									? "Select an outcome and enter your bet amount"
									: "Select one outcome and enter your bet amount (single-choice poll)"}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{!currentUser ? (
								<div className="text-center py-8">
									<p className="text-muted-foreground mb-4">Sign in to place bets</p>
									<Link href="/sign-in">
										<Button>Sign In</Button>
									</Link>
								</div>
							) : (
								<>
									{selectedOutcome ? (
										<div className="rounded-lg border border-primary bg-primary/5 p-3">
											<p className="text-sm font-medium">
												Selected: {poll.outcomes.find((o) => o._id === selectedOutcome)?.title}
											</p>
										</div>
									) : (
										<p className="text-sm text-muted-foreground">Click on an outcome above to select it</p>
									)}
									<div>
										<Label htmlFor="betAmount">Bet Amount (points)</Label>
										<Input
											id="betAmount"
											type="number"
											min="1"
											step="1"
											value={betAmount}
											onChange={(e) => setBetAmount(e.target.value)}
											placeholder="Enter amount"
											className="mt-1"
										/>
									</div>
									<Button
										onClick={handlePlaceBet}
										disabled={!selectedOutcome || !betAmount || isPlacingBet}
										className="w-full"
									>
										{isPlacingBet ? "Placing Bet..." : "Place Bet"}
									</Button>
								</>
							)}
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
