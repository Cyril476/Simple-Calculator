# Precision Calculator

A focused, offline-first calculator packaged as a React web app and a Capacitor Android application.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/simple-calculator run dev` — run the calculator web preview
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `cd artifacts/simple-calculator && npm run android:sync` — build and sync Android web assets
- `cd artifacts/simple-calculator && npm run android:release` — create a release bundle when local signing values are configured
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/simple-calculator/src/App.tsx` — calculator UI, interaction state, keyboard and Android back handling
- `artifacts/simple-calculator/src/lib/calculator.ts` — arithmetic engine and operator precedence
- `artifacts/simple-calculator/src/index.css` — source-of-truth visual identity and touch-safe layout
- `artifacts/simple-calculator/android/` — generated Capacitor Android project
- `artifacts/simple-calculator/ANDROID_RELEASE.md` — Android sync, signing, and Google Play release guide

## Architecture decisions

- Capacitor packages the production Vite bundle; Android does not duplicate calculator logic.
- The Android project targets API 36, locks the experience to portrait, and declares no app permissions.
- Relative Vite asset URLs make the same production build load from Capacitor's local WebView.
- Release signing is conditional and reads only ignored local properties or environment variables.

## Product

Precision Calculator supports arithmetic, percentage, decimals, sign toggling, deletion, clear, repeated equals, recent history, keyboard input, and offline Android use.

## User preferences

- Preserve the existing calculator visual identity when improving platform compatibility.

## Gotchas

- Run `npm run build` before `npx cap sync android` so the local Android bundle is current.
- The workspace uses pnpm at the repository root; the calculator package can also be installed independently with npm.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
