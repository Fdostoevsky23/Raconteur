# 🪶 Cline New Addition Build Log — Project "Raconteur+"

> READ THIS FILE FIRST at the start of every new session. It is the single source of truth for this build. Update it after every chunk.

## 1. The Mission
- Classic Raconteur has great FEATURES but an outdated design. Build a second skin — **Raconteur+** — same features, brand-new layout/design/template.
- **DO NOT touch classic pages** (only sanctioned edit: BaseLayout mounts the SkinToggle).
- Two switch buttons at the top of the homepage: "Raconteur" and "Raconteur+" — users switch freely (like COSMOS/ORBIT in the boss's other project).
- Build in small chunks; every chunk ends by updating this log.

## 2. Resume protocol (every new session)
1. Read this file top to bottom.
2. Run `git status` — if there are UNCOMMITTED changes from a session that died mid-chunk, finish/verify that chunk first (see §8 notes), commit it, then continue.
3. Find the first chunk in §6 that is not ✅.
4. Read the classic counterpart file(s) listed for that chunk (the /plus page re-implements that logic).
5. Build. Verify: `npx astro dev --background` (per AGENTS.md) or `npm run build`.
6. Commit: `git add -A && git commit -m "Raconteur+ Chunk N: <name>"`. Update §6 status + session log (§8). Save this file.
7. At session end (or phase milestone): `git push`.

## 3. Hard rules (non-negotiable)
1. Classic skin is frozen. The ONLY classic edit allowed: `src/layouts/BaseLayout.astro` mounts `SkinToggle`. Any other classic edit → STOP and ask the boss.
2. New code lives only in: `src/pages/plus/**`, `src/components/plus/**`, `src/layouts/PlusLayout.astro`, `src/styles/plus.css`, `src/lib/skin.ts`.
3. Reuse the shared data layer as-is: `src/data/stories.ts`, `src/lib/storyLoader.ts`, `src/lib/supabase.ts`, `src/lib/escape.ts`, `src/data/authors.json`, `src/data/giants.json`. No DB schema changes.
4. Feature parity: each plus page re-implements its classic page's server logic + client scripts with new presentation.
5. Every /plus page: `<meta name="robots" content="noindex">` + canonical → classic counterpart (duplicate-content SEO protection).
6. No new npm dependencies without boss approval. Vanilla JS, CSS animations, IntersectionObserver only.
7. Mobile-first + `prefers-reduced-motion` respected in all animations.
8. **Git protocol (agreed Session 1): COMMIT after every chunk, PUSH at the end of every session** (and after any phase milestone). Commit message format: `Raconteur+ Chunk N: <name>` — keeps GitHub history mapped 1:1 to the chunks in §6. Never commit broken code; verify (dev server or `npm run build`) BEFORE committing. Never amend/rebase pushed commits. The build log file itself gets included in every chunk commit (it documents the chunk).

## 4. Feature inventory (audit 2026-09-11 — full parity required)
- `/`→`/plus`: hero (13 rotating images + rotating headlines), curated shelf (5 featured prose), featured poems, moods, quote interlude, stats, desk note, featured author, 2 rotating writers, literary giants, rotating book-of-the-day, altar, reading room (guest notes + visitor log)
- `/stories`→`/plus/stories`: search, genre chips, sort, trending strip, prose + poetry grids
- `/story/[slug]`→`/plus/story/[slug]`: chapter pager, dropcaps, quotes, read count, author bio, more-by-author, keyboard nav, reader actions
- `/author/[slug]`→`/plus/author/[slug]`: static+DB writers, bio/avatar/socials, verified badge, follow, stats, works, collections, poetry, share
- `/poetry/[id]`, `/collections`, `/collection/[slug]` → plus copies (poetry owner edit/export/delete included)
- `/feed`, `/saved`, `/messages`, `/dashboard`, `/submit` (Tiptap), `/admin`, `/digest` → plus copies
- `/login`, `/signup`, `/reset-password`, `/about`, `/privacy`, `/tos`, `/404` → plus copies
- APIs stay shared (no plus copy): `/api/send-digest`, `/api/delete-account`
- Layout-level features to re-create in PlusLayout: live search island (stories+writers), auth widget, notifications bell, PWA meta, footer
- Components to re-skin under plus: LivingBackground, FeaturedAuthor, LiteraryGiants, AuthorBooks, ShelfMark, TiptapEditor (core config reused)

## 5. Design direction — ✅ CONFIRMED (Session 1): "Obsidian Editorial" (boss gave Cline creative freedom — mix of A/B/C)
- **Base (from A — Obsidian Atelier):** dark luxe editorial. Ink-black canvas `#0B0B0E`, warm bone text `#F2EEE3`, brass-gold accent `#C9A24B`, a whisper of classic sage `#3d5a3c` for lineage. Glassmorphism sticky nav, subtle film-grain texture overlay, dark cards with 1px luminous borders.
- **Editorial discipline (from B — Gallery Light):** hairline rules as section dividers, numbered sections (`01 — Fresh from the desk`), generous asymmetric whitespace, serif italics for pull-quotes, museum-style caption labels.
- **Bold moments (from C — Neo-Zine):** oversized kinetic display type in the hero, marquee strips (e.g., rotating quotes), chunky accent-colored tags/underlines, scroll-triggered reveals.
- **Type stack:** Fraunces (display, italic moments) + Instrument Sans (UI/body) + JetBrains Mono (eyebrows, stats, numbers, meta) + Newsreader (long-form reading body). All Google Fonts, weights preloaded.
- **Motion:** scroll reveals (IntersectionObserver), parallax-lite hero, hover microinteractions, marquee ticker — all gated behind `prefers-reduced-motion`.
- Golden rule: the skin must feel like a **2026 award-site**, but the reading experience must stay **quiet, warm, and literary**. Loud chrome, calm reading room.

## 6. Build chunks (the roadmap)

### Phase 1 — Foundation
- [x] ✅ **Chunk 1 — Skeleton & Switch Mechanism** (done Session 2, 2026-09-11) — `src/lib/skin.ts` (path mapping /↔/plus), `src/components/plus/SkinToggle.astro` (server-rendered pill switch, works both skins, preserves query strings), `src/layouts/PlusLayout.astro` (full shell: glass sticky nav + scroll state, film-grain overlay, search island + live search, auth widget + notification bell clones, footer, noindex + canonical→classic, Obsidian Editorial fonts loaded), ONE sanctioned BaseLayout edit (import + toggle mount + .skin-switch-row CSS — 3 lines), `src/pages/plus/index.astro` (full data-layer copy of classic home + placeholder hero, marquee, numbered 01 Shelf + 02 Verse sections with bento lead card). Verified: dev 200 on / and /plus, prod build clean. Nav/auth/search links → classic pages with TODO(Chunk N) swap registry in PlusLayout.
- [ ] **Chunk 2 — Design System** — `src/styles/plus.css`: design tokens, font imports, button/card/nav/form/section utilities, film-grain, glass nav, marquee, reveal system, `prefers-reduced-motion`, smoke-test page /plus at every breakpoint. NOTE: PlusLayout + plus/index already carry working styles inline; Chunk 2 extracts shared tokens/utilities (buttons, cards, sections, forms) so later pages don't re-copy CSS.

### Phase 2 — Homepage (3 chunks)
- [ ] **Chunk 3 — Home: Hero + Shelf** — hero with rotating imagery + kinetic headline, marquee strip, curated shelf (5 featured prose cards with hover states), section numbering ("01 — Fresh from the desk").
- [ ] **Chunk 4 — Archive Library** — `/plus/stories` — plus copy of `/stories`: search, genre chips, sort, trending strip, prose + poetry grids, plus-poem card variant (serif italic text cover).
- [ ] **Chunk 5 — Home: Communities** — giants, rotating book-of-the-day, altar, reading room (guest notes + visitor log API logic copied), desk note + stats + quote interlude, mobile responsiveness.

### Phase 3 — Reading experience
- [ ] **Chunk 6 — Story Reader** — `/plus/story/[slug]`: chapter pager (multi-chapter + single-chapter), dropcaps, quotes, read count, author bio, more-by-author, keyboard nav, reader actions, reading progress bar, share sheet.
- [ ] **Chunk 7 — Poetry Collection** — `/plus/poetry/[id]`: collection header, poem tiles, owner edit/export/delete buttons.

### Phase 4 — People & Social (3 chunks)
- [ ] **Chunk 8 — Author Pages** — `/plus/author/[slug]`: static+DB logic, verified badge, follow, stats, works, collections, poetry, socials, share.
- [ ] **Chunk 9 — Collections Index** — `/plus/collections`: grid of curated collections.
- [ ] **Chunk 10 — Collection Reader** — `/plus/collection/[slug]`: header + story grid.

### Phase 4.5 — Personal (stays logged-in)
- [ ] **Chunk 11 — Auth-aware shell** — PlusLayout session widget (login state persists across skins via Supabase session), plus copies of auth redirects so users stay logged-in.
- [ ] **Chunk 12 — Feed + Saved** — plus copies of `/feed`, `/saved` — follow-graph queries + tiles.
- [ ] **Chunk 13 — Messages** — `/plus/messages`: DM inbox + thread view + polling logic.

### Phase 5 — Creator & Admin
- [ ] **Chunk 14 — Submit (Tiptap)** — `/plus/submit`: editor page + chapter mgmt + cover + genre, re-skinned TiptapEditor; `?edit=` mode + poem mode.
- [ ] **Chunk 15 — Dashboard** — `/plus/dashboard`: analytics + story list + edit links.
- [ ] **Chunk 16 — Admin** — `/plus/admin`: moderation table, homepage/feature toggles, collections curation, digest trigger.

### Phase 6 — Auth & Legal & Polish
- [ ] **Chunk 17 — Auth Pages** — `/plus/login`, `/plus/signup`, `/plus/reset-password`.
- [ ] **Chunk 18 — Static & Legal** — `/plus/about`, `/plus/privacy`, `/plus/tos`, plus 404 catch (src/pages/plus/[...slug].astro).
- [ ] **Chunk 19 — Global Polish & QA** — cross-page link audit (no dead /plus links), switch buttons present everywhere, a11y pass, reduced-motion pass, PWA meta, light Lighthouse-style checks, mobile + desktop QA. **MILESTONE: Raconteur+ fully live alongside classic.**

### Phase 7 — Future ideas (post-build, not promised)
- Theme picker (light/dark within plus), keyboard shortcuts palette, reading history sync.

## 7. Token & duration estimate (boss requested)
- Foundation: ~60k / ~2 sessions · Homepage: ~120k / ~4 sessions · Reading: ~70k / ~2 sessions · People & Social: ~80k / ~3 sessions · Creator & Admin: ~90k / ~3 sessions · Auth & Legal & Polish: ~70k / ~2 sessions
- **TOTAL: ~490k Cline tokens / ~17 working sessions / real-world ~2-4 weeks at a relaxed pace** (assumes: no new dependencies, parity only, static-ish content; new scope = extra estimate).
- Token rule of thumb: reading classic pages to clone logic ≈ 8-10k tokens/page; writing plus page ≈ 15-20k tokens/page; polish passes ≈ 5-8k/page.

- Line-count reference for classic pages being mirrored: index.astro 1781 · BaseLayout 862 · dashboard 1119 · submit 552 · stories 499 · admin 347 · FeaturedAuthor 317 · digest 278 · storyLoader 260 · LiteraryGiants 260 · TiptapEditor 258 · messages 213 · signup 180 · reset-password 177 · login 162 · saved 145 · about 127 · privacy 60 · tos 52 · AuthorBooks 82 · ShelfMark 40 · feed 124 · collections 115 · story/[slug] ≈950 (est) · author/[slug] 1175 · poetry/[id] 170 · collection/[slug] 205 (est) · 404 63

## 8. Session log (append after every chunk)
| # | Date | Chunks done | Token estimate | Notes |
|---|------|-------------|----------------|-------|
| 1 | 2026-09-11 | Blueprint session — full codebase audit, design research (Awwwards etc.), roadmap, this log, direction confirmed | ~25k | Direction: "Obsidian Editorial" (mix). Ready for Chunk 1 next session. |
| 2 | 2026-09-11 | ✅ Chunk 1 — Skeleton & Switch Mechanism complete + verified (dev 200 both skins, prod build clean) | ~45k | Files: skin.ts, SkinToggle.astro, PlusLayout.astro (822 ln), plus/index.astro (546 ln), BaseLayout sanctioned edit (3 ln). Next: Chunk 2 Design System. |

## 9. Open questions for the boss (defaults in effect unless overruled)
1. ~~Design direction~~ → ✅ ANSWERED Session 1: "Mix it up — Cline's call" → Obsidian Editorial (see §5).
2. Plus pages `noindex` — DEFAULT YES (SEO-safe; overrule anytime).
3. No DB schema changes — DEFAULT YES (plus reuses the same Supabase tables).

## 10. Legend
- ✅ = done and verified · 🟡 = in progress · ⏳ = not started · ⛔ = blocked (see session log)

