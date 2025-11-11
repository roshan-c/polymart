import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = [
	"/",
	"/polls",
	"/api/og",
	"/sign-in",
	"/sign-up",
	"/api/auth",
];

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	
	const isPublicRoute = publicRoutes.some(route => 
		pathname === route || pathname.startsWith(`${route}/`)
	);

	if (isPublicRoute) {
		return NextResponse.next();
	}

	const sessionToken = request.cookies.get("better-auth.session_token");
	
	if (!sessionToken) {
		const url = request.nextUrl.clone();
		url.pathname = "/sign-in";
		url.searchParams.set("redirect", pathname);
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!_next|api/og|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(trpc)(.*)",
	],
};
