# ðŸª¶ Cline New Addition Build Log â€” Project "Raconteur+"

> READ THIS FILE FIRST at the start of every new session. It is the single source of truth for this build. Update it after every chunk.

## 1. The Mission
- Classic Raconteur has great FEATURES but an outdated design. Build a second skin â€” **Raconteur+** â€” same features, brand-new layout/design/template.
- **DO NOT touch classic pages** (only sanctioned edit: BaseLayout mounts the SkinToggle).
- Two switch buttons at the top of the homepage: "Raconteur" and "Raconteur+" â€” users switch freely (like COSMOS/ORBIT in the boss's other project).
- Build in small chunks; every chunk ends by updating this log.

## 2. Resume protocol (every new session)
1. Read this file top to bottom.
2. Run `git status` â€” if there are UNCOMMITTED changes from a session that died mid-chunk, finish/verify that chunk first (see Â§8 notes), commit it, then continue.
3. Find the first chunk in Â§6 that is not âœ….
4. Read the classic counterpart file(s) listed for that chunk (the /plus page re-implements that logic).
5. Build. Verify: `npx astro dev --background` (per AGENTS.md) or `npm run build`.
6. Commit: `git add -A && git commit -m "Raconteur+ Chunk N: <name>"`. Update Â§6 status + session log (Â§8). Save this file.
7. At session end (or phase milestone): `git push`.

## 3. Hard rules (non-negotiable)
1. Classic skin is frozen. The ONLY classic edit allowed: `src/layouts/BaseLayout.astro` mounts `SkinToggle`. Any other classic edit â†’ STOP and ask the boss.
2. New code lives only in: `src/pages/plus/**`, `src/components/plus/**`, `src/layouts/PlusLayout.astro`, `src/styles/plus.css`, `src/lib/skin.ts`.
3. Reuse the shared data layer as-is: `src/data/stories.ts`, `src/lib/storyLoader.ts`, `src/lib/supabase.ts`, `src/lib/escape.ts`, `src/data/authors.json`, `src/data/giants.json`. No DB schema changes.
4. Feature parity: each plus page re-implements its classic page's server logic + client scripts with new presentation.
5. Every /plus page: `<meta name="robots" content="noindex">` + canonical â†’ classic counterpart (duplicate-content SEO protection).
6. No new npm dependencies without boss approval. Vanilla JS, CSS animations, IntersectionObserver only.
7. Mobile-first + `prefers-reduced-motion` respected in all animations.
8. **Git protocol (agreed Session 1): COMMIT after every chunk, PUSH at the end of every session** (and after any phase milestone). Commit message format: `Raconteur+ Chunk N: <name>` â€” keeps GitHub history mapped 1:1 to the chunks in Â§6. Never commit broken code; verify (dev server or `npm run build`) BEFORE committing. Never amend/rebase pushed commits. The build log file itself gets included in every chunk commit (it documents the chunk).

## 4. Feature inventory (audit 2026-09-11 â€” full parity required)
- `/`â†’`/plus`: hero (13 rotating images + rotating headlines), curated shelf (5 featured prose), featured poems, moods, quote interlude, stats, desk note, featured author, 2 rotating writers, literary giants, rotating book-of-the-day, altar, reading room (guest notes + visitor log)
- `/stories`â†’`/plus/stories`: search, genre chips, sort, trending strip, prose + poetry grids
- `/story/[slug]`â†’`/plus/story/[slug]`: chapter pager, dropcaps, quotes, read count, author bio, more-by-author, keyboard nav, reader actions
- `/author/[slug]`â†’`/plus/author/[slug]`: static+DB writers, bio/avatar/socials, verified badge, follow, stats, works, collections, poetry, share
- `/poetry/[id]`, `/collections`, `/collection/[slug]` â†’ plus copies (poetry owner edit/export/delete included)
- `/feed`, `/saved`, `/messages`, `/dashboard`, `/submit` (Tiptap), `/admin`, `/digest` â†’ plus copies
- `/login`, `/signup`, `/reset-password`, `/about`, `/privacy`, `/tos`, `/404` â†’ plus copies
- APIs stay shared (no plus copy): `/api/send-digest`, `/api/delete-account`
- Layout-level features to re-create in PlusLayout: live search island (stories+writers), auth widget, notifications bell, PWA meta, footer
- Components to re-skin under plus: LivingBackground, FeaturedAuthor, LiteraryGiants, AuthorBooks, ShelfMark, TiptapEditor (core config reused)

## 5. Design direction â€” âœ… CONFIRMED (Session 1): "Obsidian Editorial" (boss gave Cline creative freedom â€” mix of A/B/C)
- **Base (from A â€” Obsidian Atelier):** dark luxe editorial. Ink-black canvas `#0B0B0E`, warm bone text `#F2EEE3`, brass-gold accent `#C9A24B`, a whisper of classic sage `#3d5a3c` for lineage. Glassmorphism sticky nav, subtle film-grain texture overlay, dark cards with 1px luminous borders.
- **Editorial discipline (from B â€” Gallery Light):** hairline rules as section dividers, numbered sections (`01 â€” Fresh from the desk`), generous asymmetric whitespace, serif italics for pull-quotes, museum-style caption labels.
- **Bold moments (from C â€” Neo-Zine):** oversized kinetic display type in the hero, marquee strips (e.g., rotating quotes), chunky accent-colored tags/underlines, scroll-triggered reveals.
- **Type stack:** Fraunces (display, italic moments) + Instrument Sans (UI/body) + JetBrains Mono (eyebrows, stats, numbers, meta) + Newsreader (long-form reading body). All Google Fonts, weights preloaded.
- **Motion:** scroll reveals (IntersectionObserver), parallax-lite hero, hover microinteractions, marquee ticker â€” all gated behind `prefers-reduced-motion`.
- Golden rule: the skin must feel like a **2026 award-site**, but the reading experience must stay **quiet, warm, and literary**. Loud chrome, calm reading room.

## 6. Build chunks (the roadmap)

### Phase 1 â€” Foundation
- [x] âœ… **Chunk 1 â€” Skeleton & Switch Mechanism** (done Session 2, 2026-09-11) â€” `src/lib/skin.ts` (path mapping /â†”/plus), `src/components/plus/SkinToggle.astro` (server-rendered pill switch, works both skins, preserves query strings), `src/layouts/PlusLayout.astro` (full shell: glass sticky nav + scroll state, film-grain overlay, search island + live search, auth widget + notification bell clones, footer, noindex + canonicalâ†’classic, Obsidian Editorial fonts loaded), ONE sanctioned BaseLayout edit (import + toggle mount + .skin-switch-row CSS â€” 3 lines), `src/pages/plus/index.astro` (full data-layer copy of classic home + placeholder hero, marquee, numbered 01 Shelf + 02 Verse sections with bento lead card). Verified: dev 200 on / and /plus, prod build clean. Nav/auth/search links â†’ classic pages with TODO(Chunk N) swap registry in PlusLayout.
- [x] âœ… **Chunk 2 â€” Design System** (done Session 3, 2026-09-11) â€” `src/styles/plus.css` (~720 lines, 18 families): design tokens (--ph-* palette/type/radii/shadows/motion), type helpers, **[data-reveal] scroll-reveal system** (stagger via --reveal-delay), hairline dividers, numbered section shells, bento card family (.ph-grid/.ph-card/-lead/-verse/-empty covers), generic .ph-tile, buttons (gold/ghost/sm), chips + badges (brass/sage/danger), forms (input/select/textarea/label), tables, **reader prose** (.ph-prose with brass dropcaps, .ph-pullquote, flourish dividers), stats row, avatars (sm/lg/initials), empty states, alerts, page shells (.ph-narrow/.ph-wide), marquee, responsive rules, pulse loader, focus states. PlusLayout: imports plus.css + **reveal engine script** (IntersectionObserver, reduced-motion safe, no-IO fallback). Homepage refactored to consume the system (ph-grid, data-reveal staggers, page CSS reduced to hero-only + tokenized). Verified: dev 200 + all markers present, prod build clean.

### Phase 2 â€” Homepage (3 chunks)
- [x] âœ… **Chunk 3 â€” Home: Hero + Shelf** (done Session 4, 2026-09-11) â€” Full cinematic hero, 5 layers: (0) daily-rotating hero image w/ deep vignette + 36s Ken Burns drift; (1) breathing brass+sage glow blobs; (2) 12 deterministic dust motes rising w/ brass glow; (3) editorial chrome â€” museum corner brackets + mono meta ("EST. 2026 Â· KOHIMA Â· IN" / "EDITION NÂº {dayOfYear}") + brass frame; (4) kinetic headline â€” line-by-line rise-in + ROTATING accent word (wantâ†’loveâ†’craveâ†’deserve, 3s cycle, sizer reserves width) + mono stats strip (works/words/âˆž); (5) animated scroll cue. Shelf cards upgraded: numbered index badges (01â€“05, glass pills). Full reduced-motion safety (static hero, no motes, no rotation). Word rotator JS in page script. Fixed en route: `two()` helper lost in frontmatter edit â†’ 500 error â†’ restored. Verified: dev 200 (all 8 hero markers present), classic / 200, prod build clean.
- [x] âœ… **Chunk 4 â€” Archive Library** (done Session 7, 2026-09-11) â€” `/plus/stories` (465 ln): full data clone of classic (static+DB merge, band computation, genre tags, reads_weekly trending). Obsidian Editorial presentation: editorial masthead w/ mono count, glass pill trending strip, brass-search + band/tag ph-chips + ph-select sort, uniform 3-col bento grid (no lead span), poetry divider ("Verse âœ¦") + italic-serif poem teasers, live result counter ("Showing N works"), empty state, back link. Filter/sort/search client logic cloned from classic (incl. poem-divider visibility sync). Flipped navHref.stories + hero button + archive link â†’ /plus/stories; removed last classic-route links from plus pages. Verified: /plus/stories 200 (all 11 markers), classic /stories 200, /plus links clean, prod build clean.
- [ ] **Chunk 5 â€” Home: Full Rhythm** (rescoped per boss decision Session 6) â€” ALL remaining homepage sections: moods explorer, quote interlude, stats band, writer's desk note, featured author spotlight, 2 rotating community writers, literary giants gallery, book-of-the-day/altar, reading room (guest notes + visitor log). After this, boss judges the hero in full context (option B/C/D amplifications deferred until then).
  - [x] âœ… **5A** (Session 8) â€” 03 Moods (6 feeling tiles w/ emoji hover-joy, deep-link ?q= search in /plus/stories â€” plus-exclusive resurrection, classic had dead CSS only), Quote interlude (7 rotating literary quotes, 8s fade cycle, reduced-motion static), Stats band (count-up on scroll via IO, ease-out cubic, âˆž third stat), 04 Desk Note (editor's letter w/ avatar + brass left-rule). Fixed en route: motes config lost in edit â†’ restored; missing `)}` after verse section â†’ compiler caught, restored; hero mobile CSS block accidentally replaced â†’ restored. Verified: dev 200 all 7 markers, ?q=rain 200, prod build clean.
  - [ ] **5B** â€” featured author spotlight (Nzan profile), 2 rotating community writers, literary giants gallery (14 portraits), altar/book-of-the-day, reading room (whispers + notes + visitor log).

### Phase 3 â€” Reading experience
- [ ] **Chunk 6 â€” Story Reader** â€” `/plus/story/[slug]`: chapter pager (multi-chapter + single-chapter), dropcaps, quotes, read count, author bio, more-by-author, keyboard nav, reader actions, reading progress bar, share sheet.
- [ ] **Chunk 7 â€” Poetry Collection** â€” `/plus/poetry/[id]`: collection header, poem tiles, owner edit/export/delete buttons.

### Phase 4 â€” People & Social (3 chunks)
- [ ] **Chunk 8 â€” Author Pages** â€” `/plus/author/[slug]`: static+DB logic, verified badge, follow, stats, works, collections, poetry, socials, share.
- [ ] **Chunk 9 â€” Collections Index** â€” `/plus/collections`: grid of curated collections.
- [ ] **Chunk 10 â€” Collection Reader** â€” `/plus/collection/[slug]`: header + story grid.

### Phase 4.5 â€” Personal (stays logged-in)
- [ ] **Chunk 11 â€” Auth-aware shell** â€” PlusLayout session widget (login state persists across skins via Supabase session), plus copies of auth redirects so users stay logged-in.
- [ ] **Chunk 12 â€” Feed + Saved** â€” plus copies of `/feed`, `/saved` â€” follow-graph queries + tiles.
- [ ] **Chunk 13 â€” Messages** â€” `/plus/messages`: DM inbox + thread view + polling logic.

### Phase 5 â€” Creator & Admin
- [ ] **Chunk 14 â€” Submit (Tiptap)** â€” `/plus/submit`: editor page + chapter mgmt + cover + genre, re-skinned TiptapEditor; `?edit=` mode + poem mode.
- [ ] **Chunk 15 â€” Dashboard** â€” `/plus/dashboard`: analytics + story list + edit links.
- [ ] **Chunk 16 â€” Admin** â€” `/plus/admin`: moderation table, homepage/feature toggles, collections curation, digest trigger.

### Phase 6 â€” Auth & Legal & Polish
- [ ] **Chunk 17 â€” Auth Pages** â€” `/plus/login`, `/plus/signup`, `/plus/reset-password`.
- [ ] **Chunk 18 â€” Static & Legal** â€” `/plus/about`, `/plus/privacy`, `/plus/tos`, plus 404 catch (src/pages/plus/[...slug].astro).
- [ ] **Chunk 19 â€” Global Polish & QA** â€” cross-page link audit (no dead /plus links), switch buttons present everywhere, a11y pass, reduced-motion pass, PWA meta, light Lighthouse-style checks, mobile + desktop QA. **MILESTONE: Raconteur+ fully live alongside classic.**

### Phase 7 â€” Future ideas (post-build, not promised)
- Theme picker (light/dark within plus), keyboard shortcuts palette, reading history sync.

## 7. Token & duration estimate (boss requested)
- Foundation: ~60k / ~2 sessions Â· Homepage: ~120k / ~4 sessions Â· Reading: ~70k / ~2 sessions Â· People & Social: ~80k / ~3 sessions Â· Creator & Admin: ~90k / ~3 sessions Â· Auth & Legal & Polish: ~70k / ~2 sessions
- **TOTAL: ~490k Cline tokens / ~17 working sessions / real-world ~2-4 weeks at a relaxed pace** (assumes: no new dependencies, parity only, static-ish content; new scope = extra estimate).
- Token rule of thumb: reading classic pages to clone logic â‰ˆ 8-10k tokens/page; writing plus page â‰ˆ 15-20k tokens/page; polish passes â‰ˆ 5-8k/page.

- Line-count reference for classic pages being mirrored: index.astro 1781 Â· BaseLayout 862 Â· dashboard 1119 Â· submit 552 Â· stories 499 Â· admin 347 Â· FeaturedAuthor 317 Â· digest 278 Â· storyLoader 260 Â· LiteraryGiants 260 Â· TiptapEditor 258 Â· messages 213 Â· signup 180 Â· reset-password 177 Â· login 162 Â· saved 145 Â· about 127 Â· privacy 60 Â· tos 52 Â· AuthorBooks 82 Â· ShelfMark 40 Â· feed 124 Â· collections 115 Â· story/[slug] â‰ˆ950 (est) Â· author/[slug] 1175 Â· poetry/[id] 170 Â· collection/[slug] 205 (est) Â· 404 63

## 8. Session log (append after every chunk)
| # | Date | Chunks done | Token estimate | Notes |
|---|------|-------------|----------------|-------|
| 1 | 2026-09-11 | Blueprint session â€” full codebase audit, design research (Awwwards etc.), roadmap, this log, direction confirmed | ~25k | Direction: "Obsidian Editorial" (mix). Ready for Chunk 1 next session. |
| 2 | 2026-09-11 | âœ… Chunk 1 â€” Skeleton & Switch Mechanism complete + verified (dev 200 both skins, prod build clean) | ~45k | Files: skin.ts, SkinToggle.astro, PlusLayout.astro (822 ln), plus/index.astro (546 ln), BaseLayout sanctioned edit (3 ln). Next: Chunk 2 Design System. |
| 3 | 2026-09-11 | âœ… Chunk 2 â€” Design System complete + verified (plus.css ~720 ln/18 families, reveal engine, homepage refactored to tokens) | ~40k | plus.css is now the single source of truth for shared styles; later pages import via PlusLayout automatically. Next: Chunk 3 (Home: Hero + Shelf full design). |
| 4 | 2026-09-11 | âœ… Chunk 3 â€” Home: Hero + Shelf complete + verified (5-layer cinematic hero, rotating word, numbered cards; fixed two() 500 regression; dev+build clean) | ~35k | Hero is flagship quality. Next: Chunk 4 â€” Archive Library (/plus/stories: search, chips, sort, trending, grids). |
| 5 | 2026-09-11 | ðŸ”§ Hotfix â€” boss-reported header jumble | ~5k | ROOT CAUSE: base `.plus-nav-right { margin-left: auto }` rule was accidentally lost in Chunk 1's split writes â€” right cluster never pushed from logo/nav â†’ collisions. Fixed + added flex-wrap safety at 3 levels (header-inner, nav-right, auth), 1180px nav-drop breakpoint, trimmed logged-in widget (Feed/Digest â†’ footer only). Also added standard `line-clamp` beside -webkit prefix (VSC warning). Verified: dev 200, build clean. LESSON: after big split-writes, grep for every intended rule before commit. |
| 6 | 2026-09-11 | ðŸ’¬ Direction checkpoint â€” boss "not feeling" current homepage | ~3k | Answered honestly: homepage is ~40% built (hero+shelf+verse only). Boss picked: finish the page (Chunks 4â€“5) BEFORE judging the hero; amplification options B/C/D deferred. Chunk 5 rescoped to "Home: Full Rhythm" (all remaining sections). |
| 7 | 2026-09-11 | âœ… Chunk 4 â€” Archive Library complete + verified (resumed across 2 task-resumptions; fixed totalWordsArchive() bug caught in self-review) | ~40k | /plus/stories live w/ full filter/sort/search parity. All plus links now internal. Next: Chunk 5 â€” Home: Full Rhythm (moods, quote, stats, desk note, author spotlight, rotating writers, giants, altar/book, reading room). |
| 8 | 2026-09-12 | âœ… Chunk 5A â€” Home: Moods + Quote + Stats + Desk Note complete + verified (3 mid-build slips caught & fixed: motes deletion, missing `)}`, hero mobile CSS) | ~35k | Moods deep-link into archive via ?q= (plus-exclusive feature). Next: Chunk 5B â€” author spotlight, rotating writers, giants gallery, altar, reading room. Then boss judges hero. |
| 9 | 2026-09-12 | ðŸŽ¨ Boss detour (pre-5B) â€” anti-black-hole background + royal masthead | ~15k | Boss: flat #0b0b0e felt like a black hole; single-row header felt cramped. Internet research (Aurora UI trend, editorial masthead pattern) â†’ PlusLayout rebuilt: **Gilded Aurora** layer (4 drifting blurred color fields â€” wine/brass/sage/indigo, 36â€“48s loops, vignette, reduced-motion safe, lighter blur on phones) + **two-row header** (Row 1 royal masthead: big centered Raconteur+ crest w/ brass rules, sits directly on aurora; Row 2 glass utility bar: nav+search+toggle+auth; both condense on scroll >80px). Removed all .plus-logo/.plus-header-inner CSS. Verified: build clean, /plus + /plus/stories 200, all 9 markers present, old markers absent. |
| 10 | 2026-09-12 | ðŸŽ¨ Boss detour pt.2 â€” regal switch + masthead rearrange; background options delivered as links | ~12k | Boss: aurora "not feeling it" (replacement directions given as LINKS for boss to pick â€” nothing built until verdict). Meanwhile: SkinToggle moved OUT of utility bar â†’ enthroned at the very top of the masthead crest (above wordmark+tagline). New `variant="regal"` prop on SkinToggle: brass-gradient active pill (#e6cc7dâ†’#c9a24bâ†’#a8842f, obsidian text), Fraunces serif, gilded border on obsidian glass â€” classic cream pill untouched. Masthead now column: toggle â†’ crest â†’ tagline; utility bar slimmed to navÂ·searchÂ·auth. Mobile max-height 160â†’220px. Verified: prod build clean, /plus + /plus/stories 200, toggle-in-masthead + regal markers present, exactly 1 regal toggle (utility copy gone). AWAITING: boss's background pick from the menu. |
| 11 | 2026-09-12 | Boss detour pt.3 â€” background verdict in: built "Obsidian & Gold" living silk mesh | ~10k | Boss picked menu option 1 (noise-gradient/silk) + mandated a 10s color loop. Gilded Aurora blobs replaced by **Silk Mesh** in PlusLayout: (1) two crossfading mesh fields â€” gold-forward (brass+light-gold+wine+indigo radials) and wine-forward (wine+indigo+brass+ember) â€” drifting in opposite directions while opacity-breathe in opposition (gold swells as wine retreats, then reverses); (2) a rotating disc of blurred golden conic "light veins" (360deg per loop, inset -30% so edges never show); (3) vignette + existing film-grain supply the editorial-dark + noise halves. EVERY animation is a seamless 10s loop (0%=100% keyframes â€” no visible restart). Reduced-motion safe, lighter blurs on phones (38/18px). Verified: prod build clean, /plus + /plus/stories 200, 10 silk markers each, aurora-blob absent. NOTE for future sessions: boss plans FOUR homepages (Raconteur / + / Pro / Max) as build-offs â€” worst removed at the end, ship 2â€“3; switch row will grow, keep SkinToggle scalable. Next: Chunk 5B (author spotlight, rotating writers, giants, altar, reading room). |
| 13 | 2026-09-12 | 🎬 Boss detour pt.5 — royal entrance splash + cover fix | ~12k | NEW **SkinSplash.astro**: switching classic→plus now lands on a full-screen interstitial FIRST — boss's exact Mesher settings (bg hsla(263,100%,50%,1), palette peach hsla(28,100%,74%,1) + cyan hsla(189,100%,56%,1), grain 0) — with "Raconteur+" in giant Fraunces 900, letters materialising one-by-one (blur+rise, 130ms stagger), "+" lands in peach, holds 1s, then curtain lifts (0.7s fade+zoom) revealing the plus page. Trigger: SkinToggle appends `?welcome=1` ONLY when switching INTO plus (in-skin nav + refreshes + direct visits never replay it; param scrubbed from URL instantly). Click-to-skip, scroll-locked during, reduced-motion safe. Built variant-driven (`plus`/`pro`/`max`) — Pro/Max share the mechanic but get their own looks (boss: NOT this gradient). COVER FIX: portrait 400×600 art in landscape slots was zooming ~2x into a smeared band (lead card worst at ~780×320) → now `object-fit: contain` letterbox over a blurred darkened copy of itself (inline bg-image on .ph-card-cover + ::before blur-fill) — full art visible, ambient glow sides, on both /plus home shelf and /plus/stories grid. Verified: build clean; /plus?welcome=1 200 w/ splash+10 letters+3070ms duration; classic toggle carries welcome=1; plain /plus self-removes splash; bundled CSS contain count=1 (right rule only), classic skins untouched. |
| 12 | 2026-09-12 | ðŸ”§ Boss detour pt.4 â€” silk refined: rotation killed, real 10s colour cycle built | ~8k | Boss feedback: rotating conic veins distracting; previous crossfade too subtle (read as static after 20s). Fix: veins layer DELETED entirely; two-field breathe â†’ **4 hand-poured mesh mixtures on a stepped cycle** â€” Gilded Dusk (brass/wine/indigo) â†’ Moonlit Indigo (indigo/slate + gold ember) â†’ Ember Study (copper/brass/wine) â†’ Sage & Brass (sage/brass/indigo) â€” one mixture per 10s window, ~2s crossfade hand-offs, seamless 40s master loop (0%=100% all tracks) + 20s alternate scale breathe (barely-there, no rotation). Different colour mixture every 10s as mandated. Reduced-motion: scenes 2-4 display:none (one static mixture remains). Verified: build clean, /plus + /plus/stories 200, 4 scene spans each, veins + old mesh absent from HTML and bundled CSS. |

## 9. Open questions for the boss (defaults in effect unless overruled)
1. ~~Design direction~~ â†’ âœ… ANSWERED Session 1: "Mix it up â€” Cline's call" â†’ Obsidian Editorial (see Â§5).
2. Plus pages `noindex` â€” DEFAULT YES (SEO-safe; overrule anytime).
3. No DB schema changes â€” DEFAULT YES (plus reuses the same Supabase tables).

## 10. Legend
- âœ… = done and verified Â· ðŸŸ¡ = in progress Â· â³ = not started Â· â›” = blocked (see session log)

