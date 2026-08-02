# DataDock

> Store smarter. Organize beautifully.

A premium, desktop-inspired cloud storage SaaS. The frontend is being built first,
against mock services; the backend is rebuilt from scratch afterwards.

## Read before working

The specification lives in `docs/`. Read in order:

1. `docs/01-PRD.md` — product scope, features, personas
2. `docs/02-FRONTEND_ARCHITECTURE.md` — stack, structure, coding standards
3. `docs/03-DESIGN_SYSTEM.md` — visual language, motion, themes
4. `docs/04-UI_FLOW.md` — screens, flows, required UI states
5. `docs/05-CLAUDE.md` — development rules
6. `docs/06-IMPLEMENTATION_DECISIONS.md` — **authoritative** where it conflicts with 01–05
7. `docs/07-IMPLEMENTATION_PHILOSOPHY.md` — how faithfully to follow the design

Reference boards for the visual language are in `docs/references/`.

## Ground rules

- **The Claude Design is direction, not a pixel spec.** Implement the design language
  faithfully, but improve responsiveness, motion, accessibility, and component
  structure beyond it. Do not behave like a screenshot copier.
- Small engineering improvements may be made directly. Material UX or visual changes
  require discussion first.
- Ask before installing any dependency.
- Do not edit files in `docs/` — report inconsistencies instead.
- Do not build the same component twice. `FileRow` serves the preview, files table,
  search results, starred and trash.

## Layout

```
client/           Next.js 16 · React 19 · JavaScript · Tailwind v4 · App Router
  src/app/        routes — (marketing), (auth), dashboard
  src/components/ ui (shadcn) · common · landing · dashboard · auth · palette
  src/providers/  theme + accent
  src/services/   API layer — mock until the backend exists
  src/constants/  src/hooks/  src/lib/  src/utils/
server/           throwaway Express learning prototype — ignore it
docs/             the specification
```

## Design tokens

All tokens live in `client/src/app/globals.css`. Two independent axes on `<html>`:

- `class="dark"` / `"light"` — owned by `next-themes`, dark is default
- `data-accent="blue|purple|teal"` — owned by `AccentProvider`, blue is default

Components consume semantic tokens only (`bg-surface`, `border-line`, `text-muted-foreground`,
`bg-brand`, `text-brand-contrast`). Never hardcode a hex value in a component.

`--brand` is the switchable accent. shadcn's `--accent` is the subtle hover surface —
they are different things, do not conflate them.

Fonts: Instrument Sans (`font-sans`), JetBrains Mono (`font-mono`).
Easing: `ease-out-expo` for entrances, `ease-standard` for state changes.

## Commands

```bash
cd client
npm run dev      # dev server
npm run build    # production build
npm run lint     # eslint
```

## Build order

Foundation → Shared Components → Theme System → Landing Page → Auth → Dashboard
Layout → Dashboard Pages → Responsive → Accessibility → Performance.

Build one section at a time and stop for review. Do not skip ahead.
