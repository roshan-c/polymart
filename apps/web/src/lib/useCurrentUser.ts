import { useQuery, useMutation } from "convex/react";
import { api } from "@polymart/backend/convex/_generated/api";
import { useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";

export function useCurrentUser() {
	const { data: session } = useSession();
	const user = useQuery(api.users.getCurrentUser);
	const syncUser = useMutation(api.users.syncUser);
	const syncAttempted = useRef(false);

	useEffect(() => {
		if (session?.session && user === null && !syncAttempted.current) {
			syncAttempted.current = true;
			syncUser().catch(console.error);
		}
		
		if (user !== null) {
			syncAttempted.current = false;
		}
	}, [session?.session, user, syncUser]);

	return user;
}
