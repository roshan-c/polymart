import { useQuery, useMutation } from "convex/react";
import { api } from "@polymart/backend/convex/_generated/api";
import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";

export function useCurrentUser() {
	const { isSignedIn } = useAuth();
	const user = useQuery(api.users.getCurrentUser);
	const syncUser = useMutation(api.users.syncUser);
	const syncAttempted = useRef(false);

	useEffect(() => {
		if (isSignedIn && user === null && !syncAttempted.current) {
			syncAttempted.current = true;
			syncUser().catch(console.error);
		}
		
		if (user !== null) {
			syncAttempted.current = false;
		}
	}, [isSignedIn, user, syncUser]);

	return user;
}
