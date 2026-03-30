# BloodContract

BloodContract is an EVE Frontier hackathon project for Utopia. The repo now contains a real `bounty_board` Move package with oracle-driven settlement flows, plus a GraphQL client focused on world killmail events as the external trigger feed.

## Introduction

Star Hunter BloodContract is a player-driven bounty system for EVE Frontier.

The core loop is simple:

- A player places a bounty on another player.
- The reward is locked into a contract as tokens.
- Oracle logic watches killmail events from the world package.
- When a matching killmail is verified, the hunter can claim the reward on-chain.

That simple structure creates a strong PvP loop where every player can become both a hunter and a target. The system is intentionally lightweight, but it is designed to make PvP more dynamic, social, and fun.

## Stack

- Bun workspace
- React + TypeScript + Vite
- TanStack Query + React Router
- Sui Move
- GraphQL-first chain reads for EVE Frontier / Sui testnet

## Repository Layout

- `apps/dapp`: the only frontend application
- `apps/oracle`: Bun watcher/relayer that listens to bounty and killmail events
- `packages/frontier-client`: GraphQL event queries, board-state reads, and Utopia constants
- `contracts/bounty_board`: the local Move business package and tests
- `scripts`: small repository utilities such as address syncing
- `skills/eve-frontier-utopia`: repository-local skill for agent-assisted development
- `AGENTS.md`: repository-level collaboration and implementation rules

## Environment Rules

- Use Utopia only for development and debugging.
- Use Sui testnet only.
- Read chain data through GraphQL.
- Read `Board` registry state through `packages/frontier-client` RPC helpers when current on-chain truth is needed.
- Keep both `worldPackageId` and `bountyBoardPackageId` available to the frontend.
- Treat world killmail events as the external trigger and verification feed.
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
bun run oracle:dev
bun run oracle:start
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
5. Update oracle-side matching rules and the killmail event query as needed.
6. Update the dapp views after settlement or claim flow changes.

## Oracle Service

The oracle is a Bun service in `apps/oracle`.

- It reads `bounty_board` lifecycle events and `world::killmail::KillmailCreatedEvent` through GraphQL.
- It stores cursors and active object indexes in SQLite.
- It writes back on-chain using `OracleCap`.
- It uses the shared `Board` object as a small registry/config root for active bounty and insurance state.
- It exposes `/healthz` and `/readyz`.

Local commands:

```bash
bun run oracle:dev
bun run oracle:start
bun run oracle:typecheck
bun run oracle:test
```

Required oracle env:

- `BOARD_ID`
- `WORLD_OBJECT_REGISTRY_ID`
- `BOUNTY_BOARD_PACKAGE_ID`
- `ORACLE_CAP_ID`
- `ORACLE_PRIVATE_KEY`

## Collaboration Notes

- Keep changes scoped to the explicit feature or fix.
- Prefer the smallest correct complete solution over patch-style workarounds.
- If a schema, package id, or field is still unknown, document it as an assumption instead of guessing.
- Read `AGENTS.md` before making structural or agent-assisted changes.
