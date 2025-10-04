# Agent Guidelines

## Build/Test/Lint Commands
- **Build all**: `bun run build` or `turbo build`
- **Type check**: `bun run check-types` (runs tsc --noEmit across workspace)
- **Dev server**: `bun run dev:web` (web), `bun run dev:server` (backend), `bun run dev` (all)
- **No tests configured**: Check for test setup before assuming testing framework

## Code Style
- **Tabs for indentation** (as seen in all source files)
- **TypeScript**: Strict mode enabled, use explicit types
- **Imports**: Path aliases use `@/*` for src/ in web app, import from `@polymart/backend/convex/_generated/api` for backend
- **React**: Function components, hooks pattern, no class components
- **No comments**: DO NOT ADD COMMENTS unless explicitly requested
- **Error handling**: Throw `Error` with descriptive messages in mutations/queries, use toast.error() in UI
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Async/await**: Prefer over promises with .then()

## Framework-Specific
- **Backend**: Convex (mutation/query exports), validate with `v` from `convex/values`
- **Frontend**: React 19, TanStack Router, Clerk auth, Tailwind CSS, shadcn/ui components
- **UI Components**: Use existing shadcn components from `@/components/ui/`, use `cn()` from `@/lib/utils` for className merging
- **State**: Convex queries/mutations via `useQuery`/`useMutation` hooks
- **Discord Bot**: discord.js with SlashCommandBuilder pattern
