# GraphQL Query Rules

Use this file when changing chain-read logic.

## Core Rules

- Keep all GraphQL request code in `packages/frontier-client/src/graphql`.
- Keep business-facing query functions in `packages/frontier-client/src/queries`.
- Keep the frontend data source limited to killmail events until new requirements are explicitly added.
- Do not place GraphQL strings or raw response parsing in React pages, features, or components.

## Query Shape

- Use GraphQL variables instead of string interpolation.
- Reuse fragments for fields that appear in multiple documents.
- Model list reads with cursor pagination and consume `pageInfo`.
- Prefer `nodes` for mapped payloads and keep `edges` only when the cursor itself is needed.

## Validation

- Verify empty data, missing fields, and next-page behavior in Bun tests.
- Mark unverified schema assumptions in code comments or task notes instead of guessing field names.

## Source

- Sui GraphQL guide: `https://docs.sui.io/guides/developer/accessing-data/query-with-graphql`
