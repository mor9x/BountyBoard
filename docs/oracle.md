# Oracle Service

`apps/oracle` is the chain-offchain relayer for `bounty_board`.

## Responsibilities

- Read `bounty_board` lifecycle events through GraphQL.
- Read `world::killmail::KillmailCreatedEvent` through GraphQL.
- Maintain an SQLite index of active single bounties, multi bounties, and insurance orders.
- Match killmails against active records.
- Use `OracleCap` to write settlement transactions back on-chain.

## Runtime Shape

- Bun daemon
- SQLite state store
- `SerialTransactionExecutor` for a single oracle signer
- Tiny Bun HTTP server for `/healthz` and `/readyz`

## Transaction Boundaries

All SQLite writes use transactions.

- Lifecycle replay writes `active_*` changes and the per-stream cursor in one transaction.
- Successful oracle writes store `processed_actions`, update/remove active records, and update service state in one transaction.
- Killmail cursor advancement is committed only after all actions for that killmail edge finish successfully.

This keeps replay idempotent while avoiding partial local state.

## Required Environment

Frontend-facing values:

- `VITE_SUI_NETWORK`
- `VITE_SUI_GRAPHQL_URL`
- `VITE_WORLD_API_URL`
- `VITE_WORLD_PACKAGE`
- `VITE_BOUNTY_BOARD_PACKAGE`

Oracle runtime values:

- `UTOPIA_GRAPHQL_URL`
- `SUI_GRPC_URL`
- `WORLD_PACKAGE_ID`
- `WORLD_OBJECT_REGISTRY_ID`
- `BOUNTY_BOARD_PACKAGE_ID`
- `BOARD_ID`
- `ORACLE_CAP_ID`
- `ORACLE_PRIVATE_KEY`
- `ORACLE_DB_PATH` (`.data/oracle.db` when running from `apps/oracle`)
- `ORACLE_POLL_INTERVAL_MS`

Deployment reference values kept in `.env.local`:

- `BOUNTY_BOARD_UPGRADE_CAP_ID`
- `WORLD_ADMIN_ACL_ID`
- `WORLD_GOVERNOR_CAP_ID`
- `WORLD_KILLMAIL_REGISTRY_ID`
- `EXPECTED_SENDER`
- `EXPECTED_ENV`

## Matching Rules

- `AnyLoss` matches all killmails for the target.
- `ShipOnly` matches `loss_type == SHIP`.
- `StructureOnly` matches `loss_type == STRUCTURE`.
- Character object ids are derived from `WORLD_OBJECT_REGISTRY_ID + TenantItemId`.
- Insurance trigger writes also require `BOARD_ID` because `Board` now owns the active object registry used for on-chain state tracking.
