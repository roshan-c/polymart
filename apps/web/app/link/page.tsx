"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@polymart/backend/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const AVAILABLE_SCOPES = [
	{ id: "polls:read", label: "View polls", description: "Read poll information" },
	{ id: "polls:create", label: "Create polls", description: "Create new polls on your behalf" },
	{ id: "bets:place", label: "Place bets", description: "Place bets on your behalf" },
];

function LinkPageContent() {
	const searchParams = useSearchParams();
	const { user, isLoaded } = useUser();
	const [token, setToken] = useState<string | null>(null);
	const [selectedScopes, setSelectedScopes] = useState<string[]>([
		"polls:read",
		"polls:create",
		"bets:place",
	]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [platform, setPlatform] = useState<string | null>(null);

	useEffect(() => {
		const tokenParam = searchParams.get("token");
		setToken(tokenParam);
	}, [searchParams]);

	const handleAuthorize = async () => {
		if (!token) {
			setError("No link token provided");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_CONVEX_URL?.replace(
					".cloud",
					".site"
				)}/api/link/verify`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						token,
						scopes: selectedScopes,
					}),
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to verify link token");
			}

			setPlatform(data.platform);
			setSuccess(true);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const toggleScope = (scopeId: string) => {
		setSelectedScopes((prev) =>
			prev.includes(scopeId)
				? prev.filter((s) => s !== scopeId)
				: [...prev, scopeId]
		);
	};

	if (!isLoaded) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Loader />
			</div>
		);
	}

	if (!user) {
		return (
			<div className="container max-w-2xl mx-auto py-8">
				<Card>
					<CardHeader>
						<CardTitle>Sign In Required</CardTitle>
						<CardDescription>
							Please sign in to link your account with third-party applications.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	if (!token) {
		return (
			<div className="container max-w-2xl mx-auto py-8">
				<Card>
					<CardHeader>
						<CardTitle>Invalid Link</CardTitle>
						<CardDescription>
							No link token provided. Please use the link provided by your application.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	if (success) {
		return (
			<div className="container max-w-2xl mx-auto py-8">
				<Card>
					<CardHeader>
						<CardTitle>✅ Authorization Successful!</CardTitle>
						<CardDescription>
							You've successfully linked your Polymart account with {platform}.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground mb-4">
							You can now use {platform} to interact with Polymart on your behalf.
							All actions will be performed using your account.
						</p>
						<p className="text-sm text-muted-foreground mb-4">
							You can revoke this authorization at any time from your{" "}
							<a href="/keys" className="text-primary hover:underline">
								API Keys page
							</a>
							.
						</p>
						<p className="text-sm text-muted-foreground">
							You can close this window now.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container max-w-2xl mx-auto py-8">
			<Card>
				<CardHeader>
					<CardTitle>Authorize Third-Party Application</CardTitle>
					<CardDescription>
						A third-party application is requesting access to your Polymart account.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div>
						<h3 className="font-semibold mb-3">Requested Permissions</h3>
						<div className="space-y-3">
							{AVAILABLE_SCOPES.map((scope) => (
								<div key={scope.id} className="flex items-start space-x-3">
									<Checkbox
										id={scope.id}
										checked={selectedScopes.includes(scope.id)}
										onCheckedChange={() => toggleScope(scope.id)}
									/>
									<div className="grid gap-1 leading-none">
										<Label
											htmlFor={scope.id}
											className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
										>
											{scope.label}
										</Label>
										<p className="text-sm text-muted-foreground">
											{scope.description}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{error && (
						<div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
							{error}
						</div>
					)}

					<div className="flex gap-3">
						<Button
							onClick={handleAuthorize}
							disabled={loading || selectedScopes.length === 0}
							className="flex-1"
						>
							{loading ? "Authorizing..." : "Authorize"}
						</Button>
						<Button
							variant="outline"
							onClick={() => window.close()}
							disabled={loading}
						>
							Cancel
						</Button>
					</div>

					<p className="text-xs text-muted-foreground">
						By authorizing, you allow this application to perform the selected actions
						on your behalf. You can revoke access at any time from your API Keys page.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

export default function LinkPage() {
	return (
		<Suspense fallback={<Loader />}>
			<LinkPageContent />
		</Suspense>
	);
}
