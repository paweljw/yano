# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a T3 Stack project using:
- **Next.js 15** (App Router) - React framework
- **tRPC v11** - Type-safe API layer
- **Prisma** - ORM with SQLite database
- **NextAuth.js v5** - Authentication (Discord provider)
- **Tailwind CSS v4** - Styling
- **TypeScript** - Type safety

## Essential Commands

### Development
```bash
bun run dev          # Start development server with Turbo
bun run preview      # Build and start production server
```

### Code Quality
```bash
bun run check        # Run linting and type checking
bun run lint         # Run ESLint
bun run lint:fix     # Fix ESLint issues
bun run typecheck    # Type check with TypeScript
bun run format:check # Check code formatting
bun run format:write # Format code with Prettier
```

### Database
```bash
bun run db:push      # Push schema changes to database
bun run db:generate  # Generate Prisma migrations
bun run db:migrate   # Apply migrations
bun run db:studio    # Open Prisma Studio GUI
```

### Testing
```bash
bun run test         # Run tests with Vitest
bun run test:ui      # Run tests with interactive UI
bun run test:coverage # Run tests with coverage report
```

**Important**: Use `bun run test` (which runs Vitest) instead of `bun test`. The native Bun test runner doesn't properly support the jsdom environment needed for React component testing.

## High-Level Architecture

### Directory Structure
- `/src/app/` - Next.js App Router pages and API routes
  - `/api/auth/[...nextauth]/` - NextAuth.js API route
  - `/api/trpc/[trpc]/` - tRPC API endpoint
  - `/_components/` - Page-specific components
- `/src/server/` - Backend logic
  - `/api/` - tRPC routers and procedures
  - `/auth/` - NextAuth.js configuration
  - `/db.ts` - Prisma client instance
- `/src/trpc/` - tRPC client configuration
- `/prisma/` - Database schema and migrations

### Key Patterns

1. **tRPC Procedures**: Define type-safe API endpoints in `/src/server/api/routers/`
   - Use `publicProcedure` for unauthenticated endpoints
   - Use `protectedProcedure` for authenticated endpoints

2. **Database Access**: Always use the Prisma client from `/src/server/db.ts`

3. **Authentication**: Session available via `auth()` function or `ctx.session` in tRPC

4. **Environment Variables**: Validated through `/src/env.js` using Zod schemas
   - Required: `DATABASE_URL`, `AUTH_DISCORD_ID`, `AUTH_DISCORD_SECRET`
   - `AUTH_SECRET` required in production

5. **Type Safety**: The project uses strict TypeScript configuration with no implicit any

### Testing
The project uses Vitest for testing with the following setup:
- **Test Framework**: Vitest with React Testing Library
- **Test Environment**: jsdom for component testing
- **Test Files**: `*.test.ts` or `*.test.tsx` files
- **Setup File**: `/src/test/setup.ts` - Loads testing utilities and mocks
- **Config**: `/vitest.config.ts` - Configures jsdom environment and path aliases

### YaNo Application Features
The application is a task management system with unique features:
- **Inbox Review**: Tasks start in inbox where users decide: ya (accept to today), no (trash), l8r (postpone)
- **Time Tracking**: Tasks can be started, paused, and resumed with time tracking
- **Midnight Reset**: Paused tasks move to Today, untouched Today tasks return to Inbox
- **Keyboard Navigation**: Vim-style shortcuts (j/k for navigation, y/n/p for actions)
- **Task Properties**: Priority (1-5 bars), Spiciness (1-5 peppers for difficulty), Deadlines, Subtasks
- **Views**: Inbox, Today, Archive (completed), Trash (rejected)
- **Restore Functionality**: Tasks can be restored from Archive/Trash back to Inbox

### Known Issues & Solutions
1. **Keyboard shortcuts in inputs**: Shortcuts are disabled when focus is in input/textarea/select elements
2. **Edge Runtime**: Authentication logic must run in Node.js runtime, not Edge runtime
3. **Test Runner**: Must use `bun run test` (Vitest) not `bun test` for React component tests

### Type Safety Best Practices
1. **Avoid using `any` type**: Instead of using `type Task = any`, import proper types from Prisma:
   ```typescript
   import type { Task as PrismaTask, Subtask } from "@prisma/client";
   type Task = PrismaTask & { subtasks: Subtask[] };
   ```
2. **Fix TypeScript errors properly**: Don't suppress warnings with eslint-disable comments unless absolutely necessary
3. **useRef initialization**: When using `useRef` without an initial value, explicitly type it:
   ```typescript
   const storeRef = useRef<RootStore | undefined>(undefined);
   ```
4. **MobX Store Types**: The TaskStore type is available from:
   ```typescript
   import type { TaskStore } from "~/lib/store/task.store";
   ```

### Working with Linear
When the user requests that you implement a Linear task, assume the following:
- **Task description**: Interpret as instructions directed explicitly at you
- **Think and work hard**: The user expects you to deliver a complete, end-to-end solution to the task in a self-contained pull request
- **Move the task to In progress:** Update the status of the Linear task to In progress when you start working
- **Open a pull request:** After completing implementation of a task, open a pull request on GitHub, using the branch name you got from linear
- **Produce high-quality code:** make sure that linters and tests, as specified in the GitHub Actions workflow, pass. In particular make sure that `bun run check` and `bun run format:check` pass.
- **Write unit tests**: When you introduce new code, make sure you cover it with unit tests if applicable. Make sure `bun run test` passes.
- **Be independent:** Do your own research and make smart architecture decisions. Only ask the user for input when you need something you can't get yourself, such as an API key for an integration, or when you're making a decision that will change the direction of the product.
