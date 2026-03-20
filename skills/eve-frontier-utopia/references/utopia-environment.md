# Utopia Environment

Use this file when a task depends on environment constants or deployment assumptions.

## Defaults

- Network: Sui testnet
- Active environment: Utopia only
- World API: `https://world-api-utopia.uat.pub.evefrontier.com`
- World package: `0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75`

## Rules

- Do not switch the repo to Stillness or mainnet while implementing routine features.
- Keep GraphQL endpoints and package ids centralized in `packages/frontier-client/src/constants`.
- Treat killmail events as part of the world contract package.
- After publishing a new `bounty_board` package, sync the generated id with `bun run sync:addresses`.

## Sources

- EVE Frontier Resources: `https://docs.evefrontier.com/tools/resources`
- EVE Frontier SDK modules: `https://sui-docs.evefrontier.com/modules.html`
