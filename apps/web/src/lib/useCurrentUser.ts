import { useQuery, useMutation } from "convex/react";
import { api } from "@polymart/backend/convex/_generated/api";
import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";

export function useCurrentUser() {
	const { isSignedIn } = useAuth();
	const { user: clerkUser } = useUser();
	const user = useQuery(api.users.getCurrentUser);
	const syncUser = useMutation(api.users.syncUser);
	const updateDiscordId = useMutation(api.users.updateDiscordId);
	const syncAttempted = useRef(false);
	const discordIdUpdated = useRef(false);

	useEffect(() => {
		if (isSignedIn && user === null && !syncAttempted.current) {
			syncAttempted.current = true;
			syncUser().catch(console.error);
		}
		
		if (user !== null) {
			syncAttempted.current = false;
		}
	}, [isSignedIn, user, syncUser]);

	useEffect(() => {
		if (user && clerkUser && !discordIdUpdated.current) {
			const discordAccount = clerkUser.externalAccounts.find(
				(account) => account.provider === 'oauth_discord'
			);
			
			if (discordAccount?.externalId && !user.discordId) {
				discordIdUpdated.current = true;
				updateDiscordId({ discordId: discordAccount.externalId })
					.catch(console.error);
			}
		}
	}, [user, clerkUser, updateDiscordId]);

	return user;
}
