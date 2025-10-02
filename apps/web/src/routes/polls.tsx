import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/polls")({
	component: PollsLayout,
});

function PollsLayout() {
	return <Outlet />;
}
