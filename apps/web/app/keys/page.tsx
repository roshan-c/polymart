"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@polymart/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/useCurrentUser";
import Link from "next/link";
import type { Id } from "@polymart/backend/convex/_generated/dataModel";

export default function ApiKeysPage() {
	const currentUser = useCurrentUser();
	const apiKeys = useQuery(api.apiKeys.getUserApiKeys, {});
	const authorizations = useQuery(api.thirdPartyAuth.getUserAuthorizations, {});
	const createApiKey = useMutation(api.apiKeys.createApiKey);
	const revokeApiKey = useMutation(api.apiKeys.revokeApiKey);
	const revokeAuthorization = useMutation(api.thirdPartyAuth.revokeAuthorization);
	const [keyName, setKeyName] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const [revokingKeys, setRevokingKeys] = useState<Set<Id<"apiKeys">>>(new Set());
	const [revokingAuths, setRevokingAuths] = useState<Set<Id<"thirdPartyAuthorizations">>>(new Set());

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

	const handleRevokeAuthorization = async (authId: Id<"thirdPartyAuthorizations">) => {
		if (!confirm("Are you sure you want to revoke this authorization? The application will no longer be able to access your account.")) {
			return
		}

		setRevokingAuths((prev) => new Set(prev).add(authId));
		try {
			await revokeAuthorization({ authorizationId: authId });
			toast.success("Authorization revoked");
		} catch (error: any) {
			console.error("Error revoking authorization:", error);
			toast.error(error.message || "Failed to revoke authorization");
		} finally {
			setRevokingAuths((prev) => {
				const next = new Set(prev);
				next.delete(authId);
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
						<Link href="/sign-in">
							<Button>Sign In</Button>
						</Link>
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

			<Card className="mt-6">
				<CardHeader>
					<CardTitle>Third-Party Authorizations</CardTitle>
					<CardDescription>
						{authorizations === undefined
							? "Loading..."
							: authorizations.length === 0
								? "No third-party applications authorized"
								: `${authorizations.filter((a: any) => a.active).length} active authorization${authorizations.filter((a: any) => a.active).length === 1 ? "" : "s"}`}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{authorizations === undefined ? (
						<div className="text-center py-4 text-muted-foreground">Loading...</div>
					) : authorizations.length === 0 ? (
						<div className="text-center py-4 text-muted-foreground">
							No third-party applications have been authorized yet
						</div>
					) : (
						<div className="space-y-4">
							{authorizations.map((auth: any) => (
								<div
									key={auth._id}
									className={`flex items-center justify-between rounded-lg border p-4 ${!auth.active ? "opacity-50" : ""}`}
								>
									<div className="flex-1">
										<div className="flex items-center gap-2">
											<h3 className="font-medium capitalize">{auth.platform}</h3>
											{!auth.active && (
												<span className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded">
													Revoked
												</span>
											)}
										</div>
										<p className="text-sm text-muted-foreground mt-1">
											{auth.apiKeyName}
										</p>
										<div className="flex flex-wrap gap-1 mt-2">
											{auth.scopes.map((scope: string) => (
												<span
													key={scope}
													className="text-xs bg-muted px-2 py-0.5 rounded"
												>
													{scope}
												</span>
											))}
										</div>
										<p className="text-xs text-muted-foreground mt-2">
											Created {new Date(auth.createdAt).toLocaleDateString()}
											{auth.lastUsedAt && ` • Last used ${new Date(auth.lastUsedAt).toLocaleDateString()}`}
										</p>
									</div>
									{auth.active && (
										<Button
											variant="destructive"
											size="sm"
											onClick={() => handleRevokeAuthorization(auth._id)}
											disabled={revokingAuths.has(auth._id)}
										>
											{revokingAuths.has(auth._id) ? "Revoking..." : "Revoke"}
										</Button>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Card className="mt-6">
				<CardHeader>
					<CardTitle>API Documentation</CardTitle>
					<CardDescription>
						Learn how to use the Polymart API
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div>
						<h3 className="text-lg font-semibold mb-2">Base URL</h3>
						<code className="block bg-muted p-3 rounded text-sm font-mono">
							https://youthful-lark-845.convex.site
						</code>
					</div>

					<div>
						<h3 className="text-lg font-semibold mb-2">Authentication</h3>
						<p className="text-sm text-muted-foreground mb-2">
							Include your API key in the Authorization header:
						</p>
						<code className="block bg-muted p-3 rounded text-sm font-mono">
							Authorization: Bearer YOUR_API_KEY
						</code>
					</div>

					<div>
						<h3 className="text-lg font-semibold mb-2">Endpoints</h3>
						<div className="space-y-4">
							<div className="border rounded-lg p-4">
								<div className="flex items-center gap-2 mb-2">
									<span className="bg-blue-500 text-white text-xs px-2 py-1 rounded font-mono">GET</span>
									<code className="text-sm font-mono">/api/polls</code>
								</div>
								<p className="text-sm text-muted-foreground">Get all polls (optional: ?status=active)</p>
							</div>

							<div className="border rounded-lg p-4">
								<div className="flex items-center gap-2 mb-2">
									<span className="bg-blue-500 text-white text-xs px-2 py-1 rounded font-mono">GET</span>
									<code className="text-sm font-mono">/api/polls/:pollId</code>
								</div>
								<p className="text-sm text-muted-foreground">Get a specific poll by ID</p>
							</div>

							<div className="border rounded-lg p-4">
								<div className="flex items-center gap-2 mb-2">
									<span className="bg-green-500 text-white text-xs px-2 py-1 rounded font-mono">POST</span>
									<code className="text-sm font-mono">/api/polls</code>
								</div>
								<p className="text-sm text-muted-foreground mb-2">Create a new poll</p>
								<details className="mt-2">
									<summary className="text-sm font-medium cursor-pointer">Request Body</summary>
									<pre className="bg-muted p-3 rounded text-xs font-mono mt-2 overflow-x-auto">
{`{
  "title": "Will it rain tomorrow?",
  "description": "Prediction market for rain",
  "outcomes": ["Yes", "No"]
}`}
									</pre>
								</details>
							</div>

							<div className="border rounded-lg p-4">
								<div className="flex items-center gap-2 mb-2">
									<span className="bg-green-500 text-white text-xs px-2 py-1 rounded font-mono">POST</span>
									<code className="text-sm font-mono">/api/bets</code>
								</div>
								<p className="text-sm text-muted-foreground mb-2">Place a bet on an outcome</p>
								<details className="mt-2">
									<summary className="text-sm font-medium cursor-pointer">Request Body</summary>
									<pre className="bg-muted p-3 rounded text-xs font-mono mt-2 overflow-x-auto">
{`{
  "pollId": "abc123",
  "outcomeId": "out1",
  "pointsWagered": 100
}`}
									</pre>
								</details>
							</div>

							<div className="border rounded-lg p-4">
								<div className="flex items-center gap-2 mb-2">
									<span className="bg-blue-500 text-white text-xs px-2 py-1 rounded font-mono">GET</span>
									<code className="text-sm font-mono">/api/users/:userId/bets</code>
								</div>
								<p className="text-sm text-muted-foreground">Get all bets for a user</p>
							</div>

							<div className="border rounded-lg p-4">
								<div className="flex items-center gap-2 mb-2">
									<span className="bg-blue-500 text-white text-xs px-2 py-1 rounded font-mono">GET</span>
									<code className="text-sm font-mono">/api/users/:userId</code>
								</div>
								<p className="text-sm text-muted-foreground">Get user details and stats</p>
							</div>
						</div>
					</div>

					<div>
						<h3 className="text-lg font-semibold mb-2">Example Usage</h3>
						<details className="border rounded-lg p-4">
							<summary className="font-medium cursor-pointer">JavaScript / Node.js</summary>
							<pre className="bg-muted p-3 rounded text-xs font-mono mt-2 overflow-x-auto">
{`const API_BASE = 'https://youthful-lark-845.convex.site';
const API_KEY = 'your_api_key_here';

// Get all polls
const response = await fetch(\`\${API_BASE}/api/polls\`);
const { polls } = await response.json();

// Create a poll
const createResponse = await fetch(\`\${API_BASE}/api/polls\`, {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Will Bitcoin reach $100k in 2025?',
    outcomes: ['Yes', 'No']
  })
});
const { pollId } = await createResponse.json();`}
							</pre>
						</details>

						<details className="border rounded-lg p-4 mt-2">
							<summary className="font-medium cursor-pointer">Python</summary>
							<pre className="bg-muted p-3 rounded text-xs font-mono mt-2 overflow-x-auto">
{`import requests

API_BASE = 'https://youthful-lark-845.convex.site'
API_KEY = 'your_api_key_here'

# Get all polls
response = requests.get(f'{API_BASE}/api/polls')
polls = response.json()['polls']

# Create a poll
create_response = requests.post(
    f'{API_BASE}/api/polls',
    headers={'Authorization': f'Bearer {API_KEY}'},
    json={
        'title': 'Will Bitcoin reach $100k in 2025?',
        'outcomes': ['Yes', 'No']
    }
)
poll_id = create_response.json()['pollId']`}
							</pre>
						</details>

						<details className="border rounded-lg p-4 mt-2">
							<summary className="font-medium cursor-pointer">cURL</summary>
							<pre className="bg-muted p-3 rounded text-xs font-mono mt-2 overflow-x-auto">
{`# Get all polls
curl "https://youthful-lark-845.convex.site/api/polls"

# Create a poll
curl -X POST "https://youthful-lark-845.convex.site/api/polls" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Will Bitcoin reach $100k in 2025?",
    "outcomes": ["Yes", "No"]
  }'`}
							</pre>
						</details>
					</div>

					<div className="border-t pt-4">
						<p className="text-sm text-muted-foreground">
							For complete API documentation, see the{" "}
							<a
								href="https://github.com/roshan-c/polymart/blob/master/API.md"
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary hover:underline"
							>
								API.md
							</a>{" "}
							file in the repository.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
