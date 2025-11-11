import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function GET() {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("better-auth.session_token");
		
		if (!sessionToken) {
			return NextResponse.json({ token: null }, { status: 401 });
		}

		const session = await auth.api.getSession({
			headers: {
				cookie: `better-auth.session_token=${sessionToken.value}`,
			},
		});

		if (!session?.session || !session?.user) {
			return NextResponse.json({ token: null }, { status: 401 });
		}

		const secret = new TextEncoder().encode(
			process.env.BETTER_AUTH_SECRET || "secret-key-for-development-only"
		);

		const token = await new SignJWT({
			sub: session.user.id,
			email: session.user.email,
			name: session.user.name,
		})
			.setProtectedHeader({ alg: "HS256" })
			.setIssuedAt()
			.setIssuer(process.env.BETTER_AUTH_URL || "http://localhost:3001")
			.setAudience("polymart")
			.setExpirationTime("7d")
			.sign(secret);
		
		return NextResponse.json({ token });
	} catch (error) {
		console.error("Error getting auth token:", error);
		return NextResponse.json({ token: null }, { status: 500 });
	}
}
