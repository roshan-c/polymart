"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useSession } from "@/lib/auth-client";
import { useMemo, useCallback, useEffect, useState } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ConvexAuthProvider({ children }: { children: React.ReactNode }) {
	const { data: session, isPending } = useSession();
	const [authToken, setAuthToken] = useState<string | null>(null);

	useEffect(() => {
		if (session?.session) {
			fetch('/api/auth/get-token', {
				credentials: 'include',
			})
				.then(res => res.json())
				.then(data => setAuthToken(data.token))
				.catch(() => setAuthToken(null));
		} else {
			setAuthToken(null);
		}
	}, [session]);

	const fetchAccessToken = useCallback(async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
		if (!session?.session) {
			return null;
		}
		
		try {
			const res = await fetch('/api/auth/get-token', {
				credentials: 'include',
			});
			const data = await res.json();
			return data.token || null;
		} catch {
			return null;
		}
	}, [session]);

	const auth = useMemo(() => ({
		isLoading: isPending,
		isAuthenticated: !!session?.session,
		fetchAccessToken,
	}), [session, isPending, fetchAccessToken]);

	return (
		<ConvexProvider client={convex} auth={auth}>
			{children}
		</ConvexProvider>
	);
}

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ConvexAuthProvider>
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				disableTransitionOnChange
				storageKey="vite-ui-theme"
			>
				{children}
				<Toaster richColors />
			</ThemeProvider>
		</ConvexAuthProvider>
	);
}
