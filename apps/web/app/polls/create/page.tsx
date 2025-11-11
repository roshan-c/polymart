"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@polymart/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/useCurrentUser";
import Link from "next/link";

export default function CreatePollPage() {
	const router = useRouter();
	const currentUser = useCurrentUser();
	const createPoll = useMutation(api.polls.create);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [outcomes, setOutcomes] = useState(["", ""]);
	const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
	const [isCreating, setIsCreating] = useState(false);

	const addOutcome = () => {
		if (outcomes.length < 10) {
			setOutcomes([...outcomes, ""]);
		}
	};

	const removeOutcome = (index: number) => {
		if (outcomes.length > 2) {
			setOutcomes(outcomes.filter((_, i) => i !== index));
		}
	};

	const updateOutcome = (index: number, value: string) => {
		const newOutcomes = [...outcomes];
		newOutcomes[index] = value;
		setOutcomes(newOutcomes);
	};

	const handleCreate = async () => {
		if (!currentUser) {
			toast.error("Please sign in to create a poll");
			return;
		}

		if (!title.trim()) {
			toast.error("Please enter a poll title");
			return;
		}

		const validOutcomes = outcomes.filter((o) => o.trim() !== "");
		if (validOutcomes.length < 2) {
			toast.error("Please enter at least 2 outcomes");
			return;
		}

		if (validOutcomes.length > 10) {
			toast.error("Maximum 10 outcomes allowed");
			return;
		}

		setIsCreating(true);
		try {
			const pollId = await createPoll({
				title: title.trim(),
				description: description.trim() || undefined,
				outcomes: validOutcomes,
				allowMultipleVotes,
			});
			toast.success("Poll created successfully!");
			router.push(`/polls/${pollId}`);
		} catch (error: any) {
			console.error("Error creating poll:", error);
			toast.error(error.message || "Failed to create poll");
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<Button variant="ghost" onClick={() => router.push("/polls")} className="mb-4">
				← Back to Markets
			</Button>

			<Card>
				<CardHeader>
					<CardTitle>Create New Poll</CardTitle>
					<CardDescription>Create a prediction market for your friends to bet on</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{!currentUser ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground mb-4">Sign in to create polls</p>
							<Link href="/sign-in">
								<Button>Sign In</Button>
							</Link>
						</div>
					) : (
						<form onSubmit={(e) => {
							e.preventDefault();
							handleCreate();
						}} className="space-y-6">
					<div>
						<Label htmlFor="title">Poll Title *</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="e.g., Will it rain tomorrow?"
							className="mt-1"
						/>
					</div>

					<div>
						<Label htmlFor="description">Description (optional)</Label>
						<Input
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Add more context about this poll"
							className="mt-1"
						/>
					</div>

					<div className="flex items-center space-x-2">
						<Checkbox
							id="allowMultipleVotes"
							checked={allowMultipleVotes}
							onCheckedChange={(checked) => setAllowMultipleVotes(checked as boolean)}
						/>
						<Label htmlFor="allowMultipleVotes" className="cursor-pointer">
							Allow users to vote on multiple outcomes
						</Label>
					</div>

					<div>
						<div className="mb-2 flex items-center justify-between">
							<Label>Outcomes (2-10) *</Label>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addOutcome}
								disabled={outcomes.length >= 10}
							>
								+ Add Outcome
							</Button>
						</div>
						<div className="space-y-2">
							{outcomes.map((outcome, index) => (
								<div key={index} className="flex gap-2">
									<Input
										value={outcome}
										onChange={(e) => updateOutcome(index, e.target.value)}
										placeholder={`Outcome ${index + 1}`}
									/>
									{outcomes.length > 2 && (
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => removeOutcome(index)}
										>
											×
										</Button>
									)}
								</div>
							))}
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							{outcomes.filter((o) => o.trim() !== "").length} of min 2, max 10 outcomes
						</p>
					</div>

					<Button 
						type="submit"
						disabled={isCreating} 
						className="w-full"
					>
						{isCreating ? "Creating..." : "Create Poll"}
					</Button>
					</form>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
