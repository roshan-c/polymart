"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ClerkProvider>
			<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					disableTransitionOnChange
					storageKey="vite-ui-theme"
				>
					{children}
					<Toaster richColors />
				</ThemeProvider>
			</ConvexProviderWithClerk>
		</ClerkProvider>
	);
}
