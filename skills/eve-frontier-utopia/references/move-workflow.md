# Move Workflow

Use this file when editing `contracts/bounty_board`.

## Development Rules

- Keep the Move package scoped to the minimal killmail state and event skeleton.
- Emit the killmail event shape the dapp needs to query from GraphQL.
- Avoid adding compatibility branches or speculative abstractions to the first implementation.

## Workflow

1. Change the Move module and its tests together.
2. Run `sui move test` inside `contracts/bounty_board`.
3. Publish to Utopia testnet when ready.
4. Update generated ids with `bun run sync:addresses`.
5. Review affected GraphQL documents and UI assumptions.

## Useful Commands

```bash
cd contracts/bounty_board
sui move test
sui client publish --gas-budget <budget>
```
