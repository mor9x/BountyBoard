---
name: eve-frontier-utopia
description: EVE Frontier Utopia workflow for this repository. Use when working on the BountyBoard dapp, its Move package, the killmail GraphQL query layer, or deployment constants. Apply it for tasks in apps/dapp, packages/frontier-client, contracts/bounty_board, and related scripts whenever Codex needs to keep the project on Utopia and Sui testnet, route reads through GraphQL, and preserve the repo's agent rules.
---

# EVE Frontier Utopia

## Overview

Use this skill to make changes inside the BountyBoard repo without breaking its architecture. Keep reads in the GraphQL client layer, keep the current frontend data source limited to killmail events, and keep all development pointed at Utopia on Sui testnet.

## Workflow

1. Confirm the task touches one of these areas: `apps/dapp`, `packages/frontier-client`, `contracts/bounty_board`, or `scripts`.
2. Read [references/utopia-environment.md](references/utopia-environment.md) before changing endpoints, package ids, or deployment assumptions.
3. Read [references/graphql-query-rules.md](references/graphql-query-rules.md) before adding or changing data-fetching logic.
4. Read [references/move-workflow.md](references/move-workflow.md) before editing Move modules, tests, or deployment scripts.
5. Keep repository-wide behavior aligned with the root `AGENTS.md`.

## Rules

- Treat Utopia as the only supported environment for active development and debugging.
- Treat Sui testnet as the only supported network.
- Route chain reads through `packages/frontier-client`. Do not place GraphQL strings in React pages or components.
- Keep both the world package id and the local `bounty_board` package id available to frontend code.
- Treat killmail events as the current external trigger and verification feed until new requirements are explicitly added.
- Use variables and cursor pagination for GraphQL queries.
- Keep package ids in `packages/frontier-client/src/constants`.
- After changing Move deployment outputs, run `bun run sync:addresses`.

## Typical Tasks

- Add or refine the killmail event query: update `graphql/documents`, then expose a small typed function in `queries`.
- Change killmail contract state: update the Move module, sync the package id, then review the event query and UI assumptions.

## Validation

- Run `bun test packages/frontier-client/test` or `bun --filter @bounty-board/frontier-client test` for killmail query and pagination changes.
- Run `sui move test` in `contracts/bounty_board` for Move changes.
- If dependency installation is available, run `bun run typecheck` before finishing.

## References

- [references/utopia-environment.md](references/utopia-environment.md)
- [references/graphql-query-rules.md](references/graphql-query-rules.md)
- [references/move-workflow.md](references/move-workflow.md)
