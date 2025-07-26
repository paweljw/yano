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
bun run test         # Run tests in watch mode
bun run test:ui      # Run tests with UI
bun run test:coverage # Run tests with coverage report
```

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
No test framework is currently configured. Tests would need to be set up if required.