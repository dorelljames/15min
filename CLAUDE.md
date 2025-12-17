# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Timi (15min)** is a time-tracking application that helps users log activities in 15-minute increments. It exists in two forms:
- A Next.js web application (primary)
- A Chrome extension that replaces the new tab page

The app features on-device AI summarization using Chrome's built-in Summarizer API (Gemini Nano), keeping all data local and private.

## Common Commands

```bash
# Development
pnpm dev              # Start Next.js dev server with Turbopack (http://localhost:3000)
pnpm build            # Production build for Next.js
pnpm lint             # Run Next.js linting

# Chrome Extension
pnpm build:extension  # Build extension to dist/ directory
pnpm watch:extension  # Watch mode for extension development
```

To test the extension: Load `dist/` as an unpacked extension at `chrome://extensions/`

## Architecture

### Dual Build System
- **Next.js app**: Standard Next.js 15 App Router (`app/` directory)
- **Chrome extension**: Webpack builds `extension.tsx` → `dist/bundle.js` using `tsconfig.extension.json`

Both share the same React components from `app/components/`.

### Key Components
- `ActivityTracker.tsx` - Main component managing state, Chrome AI integration, and localStorage persistence
- `TimelineView.tsx` - Visual timeline showing 24-hour day starting at 5 AM with 15-minute blocks
- `ThemeProvider.tsx` / `ThemeSwitcher.tsx` - Dark/light mode support

### Data Model (`app/types.ts`)
```typescript
Activity {
  id: string;           // UUID
  description: string;  // Max 280 chars (Twitter-length)
  timestamp: Date;
  completed: boolean;   // Legacy, kept for backward compatibility
  timeBlock: string;    // "HH:MM" format (e.g., "09:00", "09:15")
}

DailySummary {
  date: string;         // "YYYY-MM-DD"
  summary: { text: string; isAI: boolean; }
}
```

### Storage
All data persists to `localStorage`:
- `activities` - Array of Activity objects
- `dailySummaries` - Array of DailySummary objects
- `userName` - User's display name
- `autoRefresh` - Boolean for auto-summary toggle

### Chrome AI Integration
The app uses `window.ai.summarizer` API (Chrome 131+) for on-device activity summarization. See `CHROME_AI_SETUP.md` for origin trial token configuration via `NEXT_PUBLIC_ORIGIN_TRIAL_TOKENS` environment variable.

## Tech Stack
- Next.js 15 with App Router and Turbopack
- React 19
- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- TypeScript (strict mode)
- shadcn/ui components with Radix UI primitives
- Webpack 5 for extension bundling
