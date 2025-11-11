"use client";

import NextLink from "next/link";
import { ModeToggle } from "./mode-toggle";
import { useSession, signOut } from "@/lib/auth-client";
import { useCurrentUser } from "../lib/useCurrentUser";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";

export default function Header() {
	const { data: session } = useSession();
	const currentUser = useCurrentUser();

	const links = [
		{ to: "/", label: "Home" },
		{ to: "/profile", label: "Profile" },
		{ to: "/keys", label: "API" },
	] as const;

	const handleSignOut = async () => {
		await signOut();
	};

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<NextLink href="/" className="flex items-center">
					<img src="/hero.png" alt="Polymart" className="h-8" />
				</NextLink>
				<nav className="flex gap-4 text-lg">
					{links.map(({ to, label }) => {
						return (
							<NextLink key={to} href={to}>
								{label}
							</NextLink>
						);
					})}
				</nav>
				<div className="flex items-center gap-4">
					{currentUser && (
						<div className="text-sm font-medium">
							{currentUser.pointBalance} points
						</div>
					)}
					{session?.session ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="rounded-full">
									<User className="h-5 w-5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>My Account</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<NextLink href="/profile">Profile</NextLink>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<NextLink href="/keys">API Keys</NextLink>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleSignOut}>
									Sign Out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<div className="flex items-center gap-2">
							<NextLink href="/sign-in">
								<Button variant="ghost" size="sm">
									Sign In
								</Button>
							</NextLink>
							<NextLink href="/sign-up">
								<Button size="sm">
									Sign Up
								</Button>
							</NextLink>
						</div>
					)}
					<ModeToggle />
				</div>
			</div>
			<hr />
		</div>
	);
}
