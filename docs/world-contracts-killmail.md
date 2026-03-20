# world-contracts Killmail Notes

This repository keeps the killmail-related read path from the EVE Frontier integration surface while leaving local business logic in the `bounty_board` package.

## Local Reference

Relevant source files from the local `world-contracts` checkout:

- `contracts/world/sources/killmail/killmail.move`
- `contracts/world/sources/registry/killmail_registry.move`
- `contracts/world/tests/killmail/killmail_tests.move`

## What This Repo Uses From World

- module name: `killmail`
- event name: `KillmailCreatedEvent`
- event-driven query flow for frontend reads
- Utopia / testnet-only assumptions

## What This Repo Intentionally Does Not Copy Yet

- `AdminACL`
- `Character`
- `TenantItemId`
- `KillmailRegistry`
- full world object registry integration
- extra builder / bounty extension scripts

## Why

The current goal is a real GraphQL event query path for killmail data and a separate local `bounty_board` business package skeleton, not a partial reimplementation of the full EVE Frontier world contract tree.
