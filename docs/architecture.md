# Architecture

## Read Path

The dapp reads chain data through `packages/frontier-client`. GraphQL request code lives in `src/graphql`, and the only application-facing query currently exposed is the killmail event feed. Frontend configuration must still carry both the world package id for killmail events and the local `bounty_board` package id for business flows.

## Write Path

The frontend does not expose business transaction builders yet. The only local on-chain write surface kept in this repository is the minimal `bounty_board` Move package skeleton in `contracts/bounty_board`.

## Network Rules

Development targets EVE Frontier Utopia on Sui testnet only. Keep endpoints and published ids in `src/constants` and update generated values through `scripts/sync-addresses.ts`.
