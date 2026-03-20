# Frontend Style Guide

## Visual Direction

The dapp should follow an explicitly EVE Frontier visual language:

- dark
- industrial
- aerospace
- militarized
- survival-oriented
- entropy-driven
- infrastructure-centric
- player-governed
- high-contrast
- cinematic

The interface should feel closer to an in-universe ship console, logistics board, smart-assembly control panel, or tactical terminal than to a modern SaaS dashboard, cyberpunk nightlife UI, or game launcher landing page.

The most important mood shift is this: do not aim for “cool sci-fi.” Aim for “Frontier operations in a dangerous, decaying, player-shaped universe.”

## Frontier-Specific Themes

When choosing visuals, copy, layout emphasis, or interaction patterns, bias toward EVE Frontier ideas:

- entropy and decay
- rebuilding and expansion
- player-built infrastructure
- contested ownership
- fuel, upkeep, and risk
- access control, permissions, and tactical decisions
- bounty hunting as an operational system, not an arcade effect

Pages should feel like they belong to a living frontier where structures can be deployed, attacked, defended, programmed, and lost.

## Color System

- Primary background: `#000000`
- Secondary background: gunmetal / deep metallic gray / burned metal
- Panel background: around `#2A2A2A`, optionally with subtle transparency
- Primary text: `#E0E0E0`
- Strong text: `#FFFFFF`
- Secondary text: `#A0A0A0`
- Brand / action accent: `#FF4500`

Rules:

- Use orange as the main accent for branding, focus states, and primary CTA buttons.
- Keep the rest of the palette in black, charcoal, gunmetal, steel gray, and white.
- Do not introduce extra bright accent colors unless there is a clear product reason.
- Prefer a restrained, functional palette over neon contrast.

## Typography

- Use a two-layer system:
- Technical sans-serif for headings, navigation, buttons, and structural labels.
- Monospace for numbers, object IDs, timers, status readouts, coordinates, access states, code-like data, and terminal-style metadata.
- Good directions include `IBM Plex Sans`, `Roboto Condensed`, `Eurostile`-like industrial sans, paired with `IBM Plex Mono` or `Roboto Mono`.
- Use uppercase headings when a screen benefits from a stronger militarized or ceremonial tone.
- Increase letter spacing on headings, labels, and CTA text to reinforce the industrial sci-fi feel.
- Keep body copy compact and readable rather than decorative.

## Controls

- Inputs: dark fill, orange border or focus ring, high contrast text
- Buttons: orange fill for primary actions, dark text, minimal corner radius
- Panels and dialogs: deep charcoal or metallic surfaces with crisp borders
- Close or secondary controls: muted gray so they do not compete with the main action
- Status modules should look operational: compact labels, strong state contrast, clear ownership/risk indicators

Avoid soft consumer styling such as oversized radius, pastel fills, glossy gradient buttons, or oversized floating glass cards.

## Backgrounds and Atmosphere

- Use black-heavy backdrops with deep space imagery, wreckage silhouettes, industrial structures, scan noise, smoke, dust, black-hole or gravitational distortion cues, and tactical overlays when a page needs narrative weight.
- Keep backgrounds supportive, not distracting. The action area must stay readable and structured.
- Maintain a strong separation between atmospheric background art and foreground interaction containers.
- Favor environmental storytelling over character-poster styling.
- If the page needs a scene reference, think anchored assembly, damaged hull plating, signal noise, docking structure, or field operations rather than generic “space wallpaper”.

## Layout Principles

- Keep the visual flow strict and deliberate.
- Align fields and buttons cleanly.
- Let one primary action dominate the screen.
- Use spacing to create tension and seriousness, not airy lifestyle-product aesthetics.
- Treat each screen as an operational surface: data first, action second, decoration last.
- Prefer segmented information blocks, status strips, tables, tactical summaries, permissions panels, and operational checklists where appropriate.
- Surface ownership, eligibility, bounty state, or danger state early in the layout when relevant.

## What To Avoid

- Bright multi-color palettes
- Purple-heavy default AI styling
- Neon cyberpunk city aesthetics
- Hacker-green terminal clichés
- Generic startup dashboard aesthetics
- Soft glassmorphism-first layouts
- Glossy launcher-style marketing pages
- Playful motion or whimsical illustrations
- Rounded, bubbly mobile-app visual language
- Abstract sci-fi decoration with no sense of system, risk, or infrastructure
