import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@polymart/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { SignInButton } from "@clerk/clerk-react";
import type { Id } from "@polymart/backend/convex/_generated/dataModel";

export const Route = createFileRoute("/keys")({
	component: ApiKeysComponent,
});

function ApiKeysComponent() {
	const currentUser = useCurrentUser();
	const apiKeys = useQuery(api.apiKeys.getUserApiKeys, {});
	const createApiKey = useMutation(api.apiKeys.createApiKey);
	const revokeApiKey = useMutation(api.apiKeys.revokeApiKey);
	const [keyName, setKeyName] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const [revokingKeys, setRevokingKeys] = useState<Set<Id<"apiKeys">>>(new Set());

	const handleCreate = async () => {
		if (!currentUser) {
			toast.error("Please sign in to create API keys");
			return
		}

		if (!keyName.trim()) {
			toast.error("Please enter a key name");
			return
		}

		setIsCreating(true);
		try {
			const newKey = await createApiKey({
				name: keyName.trim(),
			})
			toast.success("API key created successfully!");
			setKeyName("");
		} catch (error: any) {
			console.error("Error creating API key:", error);
			toast.error(error.message || "Failed to create API key");
		} finally {
			setIsCreating(false);
		}
	}

	const handleRevoke = async (keyId: Id<"apiKeys">) => {
		if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
			return
		}

		setRevokingKeys((prev) => new Set(prev).add(keyId));
		try {
			await revokeApiKey({ keyId });
			toast.success("API key revoked");
		} catch (error: any) {
			console.error("Error revoking API key:", error);
			toast.error(error.message || "Failed to revoke API key");
		} finally {
			setRevokingKeys((prev) => {
				const next = new Set(prev);
				next.delete(keyId);
				return next
			})
		}
	}

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard");
	}

	if (!currentUser) {
		return (
			<div className="container mx-auto max-w-4xl px-4 py-8">
				<h1 className="mb-6 text-3xl font-bold">API Keys</h1>
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-muted-foreground mb-4">Sign in to manage API keys</p>
						<SignInButton mode="modal">
							<Button>Sign In</Button>
						</SignInButton>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<h1 className="mb-6 text-3xl font-bold">API Keys</h1>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Create New API Key</CardTitle>
					<CardDescription>
						API keys allow you to interact with the Polymart API programmatically
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault()
							handleCreate()
						}}
						className="space-y-4"
					>
						<div>
							<Label htmlFor="keyName">Key Name</Label>
							<Input
								id="keyName"
								value={keyName}
								onChange={(e) => setKeyName(e.target.value)}
								placeholder="e.g., Production Key, Development Key"
								className="mt-1"
							/>
						</div>
						<Button type="submit" disabled={isCreating}>
							{isCreating ? "Creating..." : "Create API Key"}
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Your API Keys</CardTitle>
					<CardDescription>
						{apiKeys === undefined
							? "Loading..."
							: apiKeys.length === 0
								? "You don't have any API keys yet"
								: `You have ${apiKeys.length} API key${apiKeys.length === 1 ? "" : "s"}`}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{apiKeys === undefined ? (
						<div className="text-center py-4 text-muted-foreground">Loading...</div>
					) : apiKeys.length === 0 ? (
						<div className="text-center py-4 text-muted-foreground">
							Create your first API key above
						</div>
					) : (
						<div className="space-y-4">
							{apiKeys.map((key) => (
								<div
									key={key._id}
									className={`flex items-center justify-between rounded-lg border p-4 ${!key.active ? "opacity-50" : ""}`}
								>
									<div className="flex-1">
										<div className="flex items-center gap-2">
											<h3 className="font-medium">{key.name}</h3>
											{!key.active && (
												<span className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded">
													Revoked
												</span>
											)}
										</div>
										<div className="mt-1 flex items-center gap-2">
											<code className="text-sm text-muted-foreground font-mono">
												{key.key}
											</code>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => copyToClipboard(key.key)}
											>
												Copy
											</Button>
										</div>
										<p className="text-xs text-muted-foreground mt-1">
											Created {new Date(key.createdAt).toLocaleDateString()}
										</p>
									</div>
									{key.active && (
										<Button
											variant="destructive"
											size="sm"
											onClick={() => handleRevoke(key._id)}
											disabled={revokingKeys.has(key._id)}
										>
											{revokingKeys.has(key._id) ? "Revoking..." : "Revoke"}
										</Button>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
