# Repository Guidelines

## Project Structure & Module Organization

- `apps/dapp` is the only web app. Keep React pages, feature modules, and UI here.
- `packages/frontier-client` is the only chain-access layer. Keep GraphQL documents, killmail queries, and constants here.
- `contracts/bounty_board` contains the minimal business Move package and tests.
- `scripts` holds repo utilities such as address syncing. `skills/eve-frontier-utopia` holds the repo-local agent skill.

## Build, Test, and Development Commands

- `bun install`: install workspace dependencies.
- `bun run dev`: start the Vite dapp.
- `bun run build`: build the frontend bundle.
- `bun run typecheck`: run TypeScript checks across the app and client package.
- `bun run lint`: run ESLint across workspace TypeScript files.
- `bun run test`: run Bun tests for `frontier-client` and `sui move test` for the Move package.
- `bun run sync:addresses`: update the generated `bounty_board` package id from deployment output.

## Environment & Data Access Rules

- Develop and debug only against Utopia on Sui testnet.
- Read chain data through GraphQL only. Use variables, fragments, and cursor pagination.
- Do not write GraphQL strings in React pages or components.
- Keep both `worldPackageId` and `bountyBoardPackageId` available to the frontend.
- Treat killmail events from the world package as the current external trigger and verification feed until fuller business flows exist.
- Keep package ids and endpoints in `packages/frontier-client/src/constants`.
- Treat `packages/frontier-client` as the only boundary for chain reads.

## Coding Style & Naming Conventions

- Use TypeScript everywhere in the app and client package. Prefer 2-space indentation and named exports.
- Keep React components in PascalCase, hooks in `useXxx` form, and utility files in kebab-case or concise noun-based names.
- Prefer the smallest complete change that satisfies the request. Avoid unrelated fallbacks, feature expansion, or parallel designs.
- Run a chain check before finishing: input, processing flow, state changes, output, and upstream/downstream impact.

## Frontend UI Direction

- Keep the dapp explicitly closer to EVE Frontier than to generic EVE-inspired sci-fi. The mood should center on entropy, survival, contested space, player-built infrastructure, and rebuilding inside a hostile universe.
- Favor ship-console, tactical-terminal, logistics-board, and infrastructure-control-panel cues over generic SaaS dashboards, glossy launcher screens, or abstract cyberpunk UI.
- Use black, gunmetal, charcoal, burned metal, and metallic gray as the base palette. Use orange as the main action and warning accent, and keep other bright accents heavily constrained.
- Prefer sharp edges, thin borders, grid structure, and compact spacing over soft cards, oversized radii, or playful consumer patterns.
- Use typography in two layers: technical sans-serif for headings/navigation and monospace for data, IDs, timers, states, coordinates, and machine-like readouts.
- Keep text high-contrast and functional: off-white for primary content, steel gray for labels and secondary actions, orange for emphasis only when it signals action or status.
- Background atmosphere should suggest deep space, black-hole danger, wreckage, anchored structures, scan noise, dust, smoke, and tactical overlays. Avoid drifting into poster-like character collage or neon city aesthetics.
- Design pages to feel like in-universe operational interfaces where information hierarchy, state clarity, risk visibility, and action priority matter more than decorative flourish.
- When a page needs narrative flavor, bias toward frontier survival, fuel/upkeep pressure, territorial control, access control, bounty hunting, and programmable infrastructure instead of vague sci-fi ornament.
- Avoid purple-heavy AI styling, neon cyberpunk palettes, hacker-green terminal clichés, glassmorphism-first treatments, bubbly mobile-app styling, or marketing-site hero sections.
- When implementing a new screen, preserve this hierarchy: black/metal base, structured panels, strong data presentation, operational status visibility, and one clearly dominant orange action.

## Requirement Handling Principles

- Start from the raw requirement. Do not assume the user has already fixed the goal, constraints, or implementation path.
- Clarify only when ambiguity would materially change the solution or create high error cost. Otherwise proceed with the most reasonable interpretation and state the assumption.
- Design only around the explicit goal. Prefer the smallest correct complete solution over a patchy compatibility workaround.
- Add necessary validation, state checks, and boundary protection, but do not add unrelated downgrade paths or speculative branches.
- If something cannot be verified, mark it as an assumption or unverified prerequisite. Do not present inference as fact.

## Testing, Commits, and Pull Requests

- Add Bun tests beside killmail query and pagination logic. Keep Move tests in `contracts/bounty_board/tests`.
- There is no existing commit history to infer a house style from yet; use Conventional Commits such as `feat: add frontier client pagination helper`.
- PRs should summarize user-visible changes, note Utopia/testnet assumptions, and call out any unverified GraphQL schema or deployment ids.
