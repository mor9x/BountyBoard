# BountyBoard

BountyBoard is an EVE Frontier dapp scaffold for the Utopia environment. The current codebase is intentionally narrow: it keeps a minimal `bounty_board` Move business package skeleton and a GraphQL client focused on world killmail events as the current external event feed.

## Introduction

Star Hunter Bounty Board is a player-driven bounty system for EVE Frontier.

The core loop is simple:

- A player places a bounty on another player.
- The reward is locked into a contract as tokens, items, or NFTs.
- Other players accept the bounty.
- If the target is successfully killed, the hunter receives the reward.

That simple structure creates a strong PvP loop where every player can become both a hunter and a target. The system is intentionally lightweight, but it is designed to make PvP more dynamic, social, and fun.

## Stack

- Bun workspace
- React + TypeScript + Vite
- TanStack Query + React Router
- Sui Move
- GraphQL-first chain reads for EVE Frontier / Sui testnet

## Repository Layout

- `apps/dapp`: the only frontend application
- `packages/frontier-client`: GraphQL client, killmail event query, and Utopia constants
- `contracts/bounty_board`: minimal Move package and tests for the local business skeleton
- `scripts`: small repository utilities such as address syncing
- `skills/eve-frontier-utopia`: repository-local skill for agent-assisted development
- `AGENTS.md`: repository-level collaboration and implementation rules

## Environment Rules

- Use Utopia only for development and debugging.
- Use Sui testnet only.
- Read chain data through GraphQL.
- Keep both `worldPackageId` and `bountyBoardPackageId` available to the frontend.
- Treat world killmail events as the current external trigger and verification feed.
- Keep GraphQL documents and query logic inside `packages/frontier-client`.
- Do not place raw GraphQL queries directly in React pages or components.

Copy `.env.example` to `.env.local` before local development.

## Getting Started

```bash
bun install
bun run dev
```

The default frontend entrypoint is `apps/dapp`.

## Common Commands

```bash
bun run dev
bun run build
bun run typecheck
bun run lint
bun run test
bun run test:move
bun run sync:addresses
```

Notes:

- `bun run test` runs Bun tests for `packages/frontier-client` and Move tests for `contracts/bounty_board`.
- `bun run sync:addresses` reads deployment output from `contracts/bounty_board/.deployment/utopia-testnet.json` and updates generated ids in `packages/frontier-client/src/constants/generated.ts`.

## Development Workflow

1. Add or update Move modules in `contracts/bounty_board`.
2. Run `sui move test` or `bun run test:move`.
3. Publish to Utopia testnet when ready.
4. Sync the new `bounty_board` package id with `bun run sync:addresses`.
5. Update the killmail event query and dapp views as needed.

## Collaboration Notes

- Keep changes scoped to the explicit feature or fix.
- Prefer the smallest correct complete solution over patch-style workarounds.
- If a schema, package id, or field is still unknown, document it as an assumption instead of guessing.
- Read `AGENTS.md` before making structural or agent-assisted changes.
