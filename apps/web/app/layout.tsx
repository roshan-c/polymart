import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import HeaderClient from "@/components/header-client";
import "@/index.css";

export const metadata: Metadata = {
	title: "Polymart - Prediction Markets",
	description: "Create and bet on prediction markets. Trade on real-world events and outcomes.",
	openGraph: {
		title: "Polymart - Prediction Markets",
		description: "Create and bet on prediction markets. Trade on real-world events and outcomes.",
		url: "https://polymart.xyz/",
		images: [{
			url: "https://polymart.xyz/hero.png",
			width: 1200,
			height: 630,
		}],
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Polymart - Prediction Markets",
		description: "Create and bet on prediction markets. Trade on real-world events and outcomes.",
		images: ["https://polymart.xyz/hero.png"],
	},
	icons: {
		icon: "/favicon.ico",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
			</head>
			<body>
				<Providers>
					<div className="grid grid-rows-[auto_1fr] h-svh">
						<HeaderClient />
						{children}
					</div>
				</Providers>
			</body>
		</html>
	);
}
