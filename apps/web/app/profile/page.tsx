"use client";

import { useQuery } from "convex/react";
import { api } from "@polymart/backend/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/lib/useCurrentUser";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
	const currentUser = useCurrentUser();
	const user = useQuery(api.users.getUser, currentUser ? { userId: currentUser._id } : "skip");
	const stats = useQuery(api.users.getUserStats, currentUser ? { userId: currentUser._id } : "skip");
	const bets = useQuery(api.bets.getUserBets, currentUser ? { userId: currentUser._id } : "skip");

	if (currentUser === undefined || user === undefined || stats === undefined || bets === undefined) {
		return (
			<div className="container mx-auto max-w-6xl px-4 py-8">
				<Skeleton className="mb-6 h-10 w-48" />
				<div className="grid gap-6 md:grid-cols-3">
					<Skeleton className="h-32" />
					<Skeleton className="h-32" />
					<Skeleton className="h-32" />
				</div>
			</div>
		);
	}

	if (!currentUser) {
		return (
			<div className="container mx-auto max-w-6xl px-4 py-8">
				<Card>
					<CardContent className="pt-6 text-center">
						<p className="text-muted-foreground mb-4">Sign in to view your profile</p>
						<Link href="/sign-in">
							<Button>Sign In</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!user || !stats) {
		return (
			<div className="container mx-auto max-w-6xl px-4 py-8">
				<Card>
					<CardContent className="pt-6">
						<p className="text-center text-muted-foreground">User not found</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const activeBets = bets.filter((bet) => !bet.settled);
	const settledBets = bets.filter((bet) => bet.settled);
	const winningBets = settledBets.filter((bet) => (bet.payout || 0) > bet.pointsWagered);

	return (
		<div className="container mx-auto max-w-6xl px-4 py-8">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">{user.name}</h1>
				<p className="text-muted-foreground">{user.email}</p>
			</div>

			<div className="mb-8 grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="pb-3">
						<CardDescription>Point Balance</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold">{stats.pointBalance.toLocaleString()}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardDescription>Total Bets</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold">{stats.totalBets}</p>
						<p className="text-sm text-muted-foreground">{stats.activeBets} active</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardDescription>Win Rate</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold">
							{stats.settledBets > 0
								? ((winningBets.length / stats.settledBets) * 100).toFixed(1)
								: 0}%
						</p>
						<p className="text-sm text-muted-foreground">
							{winningBets.length} / {stats.settledBets} won
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardDescription>Net Profit</CardDescription>
					</CardHeader>
					<CardContent>
						<p className={`text-3xl font-bold ${stats.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
							{stats.netProfit >= 0 ? "+" : ""}{stats.netProfit.toLocaleString()}
						</p>
						<p className="text-sm text-muted-foreground">
							{stats.totalPayout.toLocaleString()} won
						</p>
					</CardContent>
				</Card>
			</div>

			{activeBets.length > 0 && (
				<section className="mb-8">
					<h2 className="mb-4 text-xl font-semibold">Active Bets</h2>
					<div className="space-y-3">
						{activeBets.map((bet) => (
							<Card key={bet._id}>
								<CardContent className="flex items-center justify-between py-4">
									<div>
										<p className="font-medium">{bet.poll?.title}</p>
										<p className="text-sm text-muted-foreground">
											Betting on: {bet.outcome?.title}
										</p>
									</div>
									<div className="text-right">
										<p className="font-semibold">{bet.pointsWagered} pts</p>
										<p className="text-sm text-muted-foreground">
											{bet.sharesReceived.toFixed(2)} shares
										</p>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</section>
			)}

			{settledBets.length > 0 && (
				<section>
					<h2 className="mb-4 text-xl font-semibold">Bet History</h2>
					<div className="space-y-3">
						{settledBets.map((bet) => {
							const isWin = (bet.payout || 0) > 0;
							const profit = (bet.payout || 0) - bet.pointsWagered;
							return (
								<Card key={bet._id} className={isWin ? "border-green-500/50" : "border-red-500/50"}>
									<CardContent className="flex items-center justify-between py-4">
										<div>
											<p className="font-medium">{bet.poll?.title}</p>
											<p className="text-sm text-muted-foreground">
												Bet on: {bet.outcome?.title}
											</p>
										</div>
										<div className="text-right">
											<p className="font-semibold">
												{bet.pointsWagered} pts → {bet.payout?.toFixed(0) || 0} pts
											</p>
											<p className={`text-sm font-medium ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
												{profit >= 0 ? "+" : ""}{profit.toFixed(0)} pts
											</p>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</section>
			)}

			{bets.length === 0 && (
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-muted-foreground">No bets yet. Start betting on some polls!</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
