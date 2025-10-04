"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@polymart/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { SignInButton } from "@clerk/nextjs";

export default function AdminPage() {
	const currentUser = useCurrentUser();
	const polls = useQuery(api.polls.getAll, { status: "active" });
	const resolvePoll = useMutation(api.admin.resolvePoll);
	const cancelPoll = useMutation(api.admin.cancelPoll);
	const [resolving, setResolving] = useState<string | null>(null);
	const [selectedWinner, setSelectedWinner] = useState<{ [pollId: string]: string }>({});
	const [evidenceUrl, setEvidenceUrl] = useState<{ [pollId: string]: string }>({});
	const [evidenceText, setEvidenceText] = useState<{ [pollId: string]: string }>({});

	const handleResolve = async (pollId: string) => {
		if (!currentUser) {
			toast.error("Please sign in");
			return;
		}

		if (!currentUser.isAdmin) {
			toast.error("Admin access required");
			return;
		}

		const winnerId = selectedWinner[pollId];
		if (!winnerId) {
			toast.error("Please select a winning outcome");
			return;
		}

		setResolving(pollId);
		try {
			await resolvePoll({
				pollId: pollId as any,
				winningOutcomeId: winnerId as any,
				evidenceUrl: evidenceUrl[pollId] || undefined,
				evidenceText: evidenceText[pollId] || undefined,
			});
			toast.success("Poll resolved successfully!");
			setSelectedWinner({ ...selectedWinner, [pollId]: "" });
			setEvidenceUrl({ ...evidenceUrl, [pollId]: "" });
			setEvidenceText({ ...evidenceText, [pollId]: "" });
		} catch (error: any) {
			toast.error(error.message || "Failed to resolve poll");
		} finally {
			setResolving(null);
		}
	};

	const handleCancel = async (pollId: string) => {
		if (!currentUser) {
			toast.error("Please sign in");
			return;
		}

		if (!currentUser.isAdmin) {
			toast.error("Admin access required");
			return;
		}

		if (!confirm("Are you sure you want to cancel this poll? All bets will be refunded.")) {
			return;
		}

		setResolving(pollId);
		try {
			await cancelPoll({
				pollId: pollId as any,
			});
			toast.success("Poll cancelled and bets refunded");
		} catch (error: any) {
			toast.error(error.message || "Failed to cancel poll");
		} finally {
			setResolving(null);
		}
	};

	if (polls === undefined || currentUser === undefined) {
		return (
			<div className="container mx-auto max-w-6xl px-4 py-8">
				<h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>
				<p>Loading...</p>
			</div>
		);
	}

	if (!currentUser) {
		return (
			<div className="container mx-auto max-w-6xl px-4 py-8">
				<h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>
				<Card>
					<CardContent className="pt-6 text-center">
						<p className="text-muted-foreground mb-4">Sign in to access the admin dashboard</p>
						<SignInButton mode="modal">
							<Button>Sign In</Button>
						</SignInButton>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!currentUser.isAdmin) {
		return (
			<div className="container mx-auto max-w-6xl px-4 py-8">
				<h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>
				<Card>
					<CardContent className="pt-6">
						<p className="text-center text-muted-foreground">Admin access required</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-6xl px-4 py-8">
			<h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>

			{polls.length === 0 ? (
				<Card>
					<CardContent className="pt-6">
						<p className="text-center text-muted-foreground">No active polls to manage</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-6">
					{polls.map((poll) => (
						<Card key={poll._id}>
							<CardHeader>
								<CardTitle>{poll.title}</CardTitle>
								<CardDescription>
									Created by {poll.creator?.name || "Unknown"} • {poll.totalBets} bets • {poll.totalVolume} pts volume
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Label>Select Winning Outcome</Label>
									<div className="mt-2 space-y-2">
										{poll.outcomes.map((outcome) => (
											<div
												key={outcome._id}
												className={`cursor-pointer rounded-lg border p-3 transition-colors ${
													selectedWinner[poll._id] === outcome._id
														? "border-primary bg-primary/5"
														: "hover:bg-muted/50"
												}`}
												onClick={() =>
													setSelectedWinner({ ...selectedWinner, [poll._id]: outcome._id })
												}
											>
												<div className="flex items-center justify-between">
													<span className="font-medium">{outcome.title}</span>
													<span className="text-sm text-muted-foreground">
														{outcome.probability.toFixed(1)}% • {outcome.volume} pts
													</span>
												</div>
											</div>
										))}
									</div>
								</div>

								<div>
									<Label htmlFor={`evidence-url-${poll._id}`}>Evidence URL (optional)</Label>
									<Input
										id={`evidence-url-${poll._id}`}
										value={evidenceUrl[poll._id] || ""}
										onChange={(e) =>
											setEvidenceUrl({ ...evidenceUrl, [poll._id]: e.target.value })
										}
										placeholder="https://example.com/proof"
										className="mt-1"
									/>
								</div>

								<div>
									<Label htmlFor={`evidence-text-${poll._id}`}>Evidence Notes (optional)</Label>
									<Input
										id={`evidence-text-${poll._id}`}
										value={evidenceText[poll._id] || ""}
										onChange={(e) =>
											setEvidenceText({ ...evidenceText, [poll._id]: e.target.value })
										}
										placeholder="Additional context or explanation"
										className="mt-1"
									/>
								</div>

								<div className="flex gap-2">
									<Button
										onClick={() => handleResolve(poll._id)}
										disabled={resolving === poll._id || !selectedWinner[poll._id]}
										className="flex-1"
									>
										{resolving === poll._id ? "Resolving..." : "Resolve Poll"}
									</Button>
									<Button
										variant="destructive"
										onClick={() => handleCancel(poll._id)}
										disabled={resolving === poll._id}
									>
										Cancel Poll
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
