# AGENTS.md

## Project Overview

This is a simple transaction tracking application built for learning.

The goal of the project is to keep the codebase small, understandable, and easy to modify.

Users should be able to:

- Add an income or expense transaction
- View transactions
- Edit a transaction
- Delete a transaction
- Filter transactions by type, category, and date range
- See total income, total expenses, and the current balance

Do not add features unless they are explicitly requested.

## Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Table

Keep dependencies to a minimum.

## Transaction Model

A transaction should contain:

```ts
type Transaction = {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
  updatedAt: string;
};
```

## Project Structure

Prefer a simple structure.

```text
src/
  components/
  types/
  utils/
  App.tsx
  main.tsx
```

Do not create additional architectural layers unless they are needed.

## React Rules

- Use functional components.
- Use React hooks when necessary.
- Prefer `useState` for simple local state.
- Do not introduce global state libraries unless explicitly requested.
- Keep state as close as possible to the components that use it.
- Avoid unnecessary abstractions.

## TypeScript Rules

- Use TypeScript for all application code.
- Avoid `any`.
- Define clear types for application data.
- Prefer simple types and interfaces over complex generic abstractions.

## Component Rules

Keep components focused on one responsibility.

Possible components include:

```text
TransactionForm
TransactionList
TransactionItem
TransactionSummary
```

Do not create a component only to reduce a few lines of code.

Extract a component when it makes the application easier to understand.

## Data Storage

Initially, transactions can be stored in React state.

Do not add:

- a backend
- a database
- authentication
- an API

unless explicitly requested.

Persistence may be added later using `localStorage`.

## UI Rules

Keep the interface simple.

Prioritize:

- readability
- clear labels
- basic accessibility
- simple forms
- understandable code

Do not spend significant time on visual styling unless the task specifically requests it.

## Validation

When creating or editing a transaction:

- Type must be `income` or `expense`.
- Description cannot be empty.
- Amount must be greater than zero.
- Category cannot be empty.
- Date must be valid.

## Commands

Use the available project commands to verify changes.

Typically:

```bash
pnpm dev
pnpm test
pnpm lint
pnpm build
```

Do not invent commands that are not configured in `package.json`.

## Agent Workflow

Before modifying code:

1. Read the task.
2. Inspect the relevant files.
3. Understand the current implementation.
4. Decide on the smallest change needed.

While working:

1. Make focused changes.
2. Do not modify unrelated code.
3. Do not add features that were not requested.
4. Prefer simple solutions.

After making changes:

1. Run the relevant checks.
2. Run the linter.
3. Run the build.
4. Review the git diff.
5. Fix problems introduced by the changes.
6. Summarize what was changed.

## Git Rules

- Do not modify unrelated files.
- Do not commit secrets.
- Do not force push.
- Do not rewrite Git history.
- Do not merge directly into `main`.
- Keep each task focused.

## Important

This is a learning project.

Prefer code that is easy to understand over code that is highly abstract or optimized.

Do not redesign the application architecture unless explicitly requested.

When multiple approaches are possible, choose the simplest reasonable solution.
