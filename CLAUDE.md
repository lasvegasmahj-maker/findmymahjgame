@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: Session Startup

**Before you do anything, read `architecture.md`, `security.md`, and `schema.md`.** These three files define how the app is built, how data is secured, and how the database is structured. Every decision you make should align with these docs.

## Project

Next.js 16 website for **Find My Mahj Game** (findmymahjgame.com) — a directory that connects mahjong players to local groups, venues, retreats, and tournaments across all 50 states.

## Sister Business

Las Vegas Mahjong (lasvegasmahj.com) is a mahjong instruction business. Separate project at `~/Projects/lasvegasmahj`.

## Commands

```bash
pnpm dev          # Start dev server at localhost:3000
pnpm build        # Production build
pnpm lint         # Run ESLint
```

## Architecture

See `architecture.md` for full details. Key points:
- Next.js 16 + Tailwind CSS 4 + shadcn/ui + Supabase
- No hard-coded data — everything dynamic comes from Supabase
- Core model: connectors → connections → referrals
- Vercel auto-deploys from GitHub on push to main
- Secrets in `.env.local` (never commit)

## Design System

- Navy: `--navy: #1a1f5e`
- Pink accent: `--pink: #e91e8c`
- Green accent: `--green: #2ec95c`
- Gold accent: `--gold: #f5c842`
- Fonts: Playfair Display (headings), DM Sans (body)

## Conventions

- All database column names use snake_case
- State pages use dynamic `[state]` route, with custom pages for Nevada/Florida
- "Traveling and Want to Play?" and "Retreats & Tournaments" are separate nav items (not combined)
- Original static HTML files preserved in `static-backup/` for reference
