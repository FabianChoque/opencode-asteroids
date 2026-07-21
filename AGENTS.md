# AGENTS.md

## Project

Asteroids clone in vanilla JS — single-file game (`game.js`, ~420 lines, `'use strict'`). No build step, no dependencies, no bundler. HTML entry: `index.html`.

## Run

- Open `index.html` in a browser, **or** `npx serve .` → `http://localhost:3000`.

## Code conventions

- All game logic lives in `game.js`. Canvas is fixed 800×600.
- UI text and comments are in **Spanish**. Keep them in Spanish when editing.
- ES6 classes (Ship, Asteroid, Bullet, Particle), no modules/imports.
- Screen wrapping on all entities (toroidal space via `wrap()`).

## Gotchas

- No lint, typecheck, or test commands exist. Verify changes by opening in browser.
- `dt` is clamped to 0.05s max in the game loop to prevent physics explosions on tab-switch.
- Ship has 3s invincibility on spawn (blinking effect). Collision check respects this.
