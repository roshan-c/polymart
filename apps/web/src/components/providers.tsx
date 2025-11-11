"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useSession } from "@/lib/auth-client";
import { useMemo, useCallback } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ConvexAuthProvider({ children }: { children: React.ReactNode }) {
	const { data: session } = useSession();

	const fetchAccessToken = useCallback(async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
		if (!session?.session?.token) {
			return null;
		}
		return session.session.token;
	}, [session]);

	const auth = useMemo(() => ({
		isLoading: false,
		isAuthenticated: !!session?.session,
		fetchAccessToken,
	}), [session, fetchAccessToken]);

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
