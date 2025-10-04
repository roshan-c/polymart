import { Link } from "@tanstack/react-router";
import { ModeToggle } from "./mode-toggle";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/clerk-react";
import { useCurrentUser } from "../lib/useCurrentUser";

export default function Header() {
	const { isSignedIn } = useAuth();
	const currentUser = useCurrentUser();

	const links = [
		{ to: "/", label: "Home" },
		{ to: "/profile", label: "Profile" },
		{ to: "/keys", label: "API" },
	] as const;

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<Link to="/" className="flex items-center">
					<img src="/hero.png" alt="Polymart" className="h-8" />
				</Link>
				<nav className="flex gap-4 text-lg">
					{links.map(({ to, label }) => {
						return (
							<Link key={to} to={to}>
								{label}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-4">
					{currentUser && (
						<div className="text-sm font-medium">
							{currentUser.pointBalance} points
						</div>
					)}
					{isSignedIn ? (
						<UserButton />
					) : (
						<div className="flex items-center gap-2">
							<SignInButton mode="modal">
								<button className="px-3 py-1 text-sm font-medium hover:underline">
									Sign In
								</button>
							</SignInButton>
							<SignUpButton mode="modal">
								<button className="px-3 py-1 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
									Sign Up
								</button>
							</SignUpButton>
						</div>
					)}
					<ModeToggle />
				</div>
			</div>
			<hr />
		</div>
	);
}
