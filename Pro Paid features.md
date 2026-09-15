# 🏛️ PRO PAID FEATURES — The Pro Pass Build Catalog
> The study doc for the Raconteur Pro one-time-buy edition. Boss: read, mark, reorder — then we build.
> **THE MODEL:** Classic (free forever) + Raconteur+ (free forever) = reading & community for everyone.
> **Raconteur Pro (max skin) = the one-time Pro Pass** — a writer's toolkit wearing the editorial flagship.
>
> **THE GOLDEN RULE (decides every feature):** Gate CREATION powers, never READING.
> Anything a pass-holder publishes stays readable by everyone on every skin. The pass
> unlocks tools for writers — it never locks content away from readers. Free readers
> become writers become pass-holders. That's the whole growth engine.

---

## 🎯 THE THREE BOSS-CONFIRMED PILLARS

### P1 · Articles — a third content kind
The submit form's kind toggle gains **Article** beside Story / Poem.
- Articles get their own editorial presentation: newspaper-style headline, byline rule, no dropcap, date line — a page that reads like a broadsheet, not a book.
- Article genre tags: *Essay, Craft, Letter to a Young Writer, Review, On Writing, Literary Travel*.
- **"The Essayist"** — a dedicated articles shelf on the Pro home + an Articles filter in the library.
- Articles display in all three skins (readable by everyone, written by pass-holders).
- **Foundation:** the kind plumbing already exists (`kind: 'poem'` flows through submit → storyLoader → every reader); we add `'article'` and its presentation layer.

### P2 · Unlimited words + the Novel band
Today's cap is 40,000 words (all skins). Pass-holders write **as long as they want.**
- **The Novel band (80,000+ words)** joins Flash Fiction → Short Story → Novelette → Novella → **Novel**. A band meter that finally has a summit.
- The reader *already pages chapters like an ebook* ("Chapter 1" → own page). Novels page beautifully — this finishes the promise.
- **Resume where you left off** — every reader (pass-holder or not) reopening a long work lands on the exact paragraph they stopped at. A tiny `reading_progress` row per reader per story.
- Classic and + keep the 40k cap. The submit form's word counter shows the climb: "40,000 / unlimited — a Pro Pass unlocks the summit."

### P3 · Quotes — the quotable Raconteur
- **Pull a quote** — select any line inside a story → "Save as quote" → stored in a quotes table with the story + writer linked.
- **The Quote Gallery** — per-writer quote walls on author pages + a site-wide gallery page ("The Commonplace Book").
- **Shareable quote cards** — canvas-rendered images in each skin's typography: a vermilion-ink card for Pro, cream Playfair for Classic, cognac amber for +. Story title + writer name on every card.
- **Free marketing:** every card shared on social is an advertisement for the story. Nothing sells a quiet literary site like a beautiful quote.

---

## 📚 THE FULL CATALOG — everything on the table for Pro

*Organized by build value. Mark ✅ / ❌ / ⏸️ next to each — we build the ✅s in order.*

### A · WRITER POWER (the toolkit core)

**A1 · Volumes / Anthologies** — bind multiple stories into one *book*: cover, table of contents, a spine standing on the shelf. Poetry collections already exist (`poetry_collections` + collection pages) — we generalize to prose. A volume page: jacket, contents, "read from the beginning."

**A2 · The Serial** — publish a novel chapter-by-chapter; readers tap **"Follow the serial"** → a notification the moment a new installment lands (notifications table + bell already exist — nearly free to build). Serial page shows the installment list + "you're caught up." Cliffhanger culture, built-in return visits.

**A3 · Drafts, revisions & scheduled publishing** — save unpublished works in the dashboard (drafts); version history ("what changed since Tuesday" — restore any prior revision); scheduled publish (pick a date, it goes live while you sleep). Sunday-morning writers.

**A4 · Writer analytics** — real charts on real data (de-vibe law satisfied): reads over time per work (reads table exists), likes/comments/follows per story, which chapters get reread (reading-progress data), where readers stop. Presented in Pro's bento style.

**A5 · EPUB / PDF export** — "Take my novel offline": a typeset, book-jacketed export of your own works. Print-ready PDFs for the serious ones. Your work, portable, forever.

**A6 · Portfolio builder** — art-direct your public author page: banner art, featured-shelf order, bio typography, which works lead. The fields (bio, socials, photo) already exist — this makes them arrangeable.

**A7 · Author-chosen reading themes** — the reader ships light/sepia/dark; pass-holders pick their story's *default* theme + accent. Every reader lands in the writer's chosen light.

### B · READER-FACING DELIGHTS (made by pass-holders, free for everyone)

**B1 · Audio readings** — attach a recorded reading to any work; a quiet player in the reader. Voice-memo intimacy: the writer reads their own words. (Storage upload path already exists for covers.)

**B2 · Illustrations / inline images** — inline images inside stories (Tiptap image extension + the existing storage bucket). Picture-books for grown-ups; chapter covers.

**B3 · The Archive — public reading lists** — pass-holders curate shelves as public reading lists with a note on why each work is on it: "read my winter list."

### C · IDENTITY & CEREMONY (the tools we just built)

**C1 · The Pro Pass seal** — a brass-and-vermilion pass card in the dashboard (holder since, pass number) + a small seal on the writer's public page. Quiet prestige, never loud.

**C2 · The unlock ceremony** — redeem/buy → a *dedicated* splash + its own chord motif (the ceremony voice exists; every skin gets a unique "pass unlocked" theme). Buying Pro should feel like being handed a brass key.

**C3 · Founders wall** — the first N pass-holders' names letterpress-printed on `/pro/founders`. One-time price + named forever = urgency without sleaze.

**C4 · Early access** — pass-holders try new Pro features first, before they land anywhere else.

---

## 🔧 THE PASS PLUMBING — how every feature above gets unlocked

- `profiles.pro_pass` boolean + a `passes` audit table (user_id, source, code/receipt, granted_at).
- RLS-locked the same way the site already works: users read their own row; writes only through a service-role endpoint (the `/api/delete-account.ts` pattern — same door, same trust model).
- One `hasProPass()` helper used everywhere — the UI hides locked tools, the server verifies every gated write path (submit, quote pull, volume bind). No scattered checks, no client-only trust.
- Locked-but-visible tools show a brass key + one quiet line: *"A Pro Pass unlocks this."* A door with light behind it — never a wall.
- The admin desk gains a **Pro Passes** section: grant/revoke a pass, audit its source, (later) generate unlock-code batches.

## 🚫 WHAT PRO IS NOT — the golden rule, enforced

- **Never paywalled reading.** Every published story, article, poem, quote card, and volume is readable by everyone on all three skins.
- **Never paywalled community.** Likes, comments, follows, bookmarks, notifications — free forever, all skins.
- **Never a subscription.** One price, one time, forever.
- **Never loud.** No badges shouting inside the reader; the seal lives on the writer's page and their dashboard. Prestige is quiet.

## 🗺️ BUILD ORDER

| Chunk | What ships | Why it's here |
|---|---|---|
| **1 — The Pass itself** | SQL + `hasProPass()` + gating plumbing + `/pro/pass` pitch page + dashboard seal + unlock ceremony + admin Pro desk | Everything else locks onto this |
| **2 — Articles** | Kind toggle → broadsheet cards → article reader → library filters → The Essayist shelf | Cheapest pillar — the `kind` plumbing already exists |
| **3 — Unlimited words** | Novel band + no cap for pass-holders + reading progress (resume-where-you-left-off, free for every reader) | The flagship promise |
| **4 — Quotes** | Pull-a-quote → per-writer galleries + the Commonplace Book → canvas quote cards in each skin | The free-marketing engine |

**Then by your call:** Volumes → Serials → Drafts & revisions → Analytics → Audio → Illustrations → EPUB → Portfolio → Archive shelves → Founders wall.

## 💳 THE PAYMENT DOOR — parked on purpose

Your ruling stands: **the money wall is the last thing we worry about.** Every feature above gets built and gated behind the pass plumbing first. When the door decision comes (unlock codes vs. Stripe Payment Link vs. Lemon Squeezy merchant-of-record), it bolts on with zero rework — every path writes the same row through the same endpoint. The wall gets built last; the house gets built first.

---

## THE MODEL, ONE LINE EACH

- **Classic** — free forever. The original paper home.
- **Raconteur+** — free forever. The warm modern desk.
- **Raconteur Pro** — the one-time Pro Pass. A writer's toolkit wearing the editorial flagship.

> *Gate creation, never reading. That's the whole model.*

---
---

# 💰 PART 2 — THE MONEY SHELF & THE CAREER LADDER

> The strategic shift: **Part 1 sells tools. Part 2 sells outcomes.**
> Tools make the pass worth buying once. A career ladder makes it priceless — and it's how
> Raconteur itself earns without ads, lock-ins, or betraying the golden rule.
> The line that becomes the brand: **"Raconteur makes money when writers make money.
> Never before, never instead."**

## THE BANDCAMP PRINCIPLE (resolves the selling-vs-free-reading tension)

The golden rule says reading is free forever — so we never sell *access*. We sell the **artifact**.
- **On Raconteur, reading stays free — everyone, every skin, forever.**
- **What's sold is ownership, not access:** the offline EPUB, the printed paperback, the tip, the gift, the commission. Readers pay to OWN, to GIFT, to SUPPORT — never to READ.
- Proven by Bandcamp in music: stream free, own it for money. Every sale is voluntary gratitude, never a toll booth.
- DRM-free, like Bandcamp — trust is the literary choice.

## D · SELLING ON RACONTEUR (the bookshop suite)

**D1 · The Author Bookshop** *(boss pillars 1 + 4 — one system)*
Every pass-holder's author page gains a bookshop shelf. List a work for sale — EPUB delivered instantly on purchase (Part 1's A5 export becomes the delivery truck).
- Writer sets the price, including **pay-what-you-want with a floor** (floor can be $0 — pure support).
- The buy button appears at the perfect moment: **after the final chapter** — *"Loved it? Own it offline. $4.99."*
- **Link-shelf for books published elsewhere** — trad-published writers list their buy links; Raconteur is their storefront either way.
- Sell the **audio edition** too, once B1 audio exists.
- Poetry collections sell as **chapbooks** — a real poetry-world tradition; poetry finally has a product.
- The marketing channel already exists: follows + notifications + the Sunday digest — *"new book from a writer you follow."*

**D2 · The Tip Jar — pay-what-you-want on every work**
Not every work is a book. A poem can move someone to pay $2.
- A quiet "leave a tip" button on every work — pay what you want.
- Optional **supporter wall** — tippers may leave their name on the work's supporters list. Quiet gratitude, never badges.
- This monetizes **poetry**, which cannot be sold as ebooks — half this community's heart.
- Zero reader lockout by definition: a gift.

**D3 · Reader support tiers — "the regulars"**
Pro is never a subscription — but READERS supporting a WRITER monthly is the Patreon model, and it's how serial writers actually live.
- $3/mo "support this writer" → supporter mark + **first-look access**.
- **Golden-rule-compliant exclusivity:** time-gated, never content-gated — supporters get installments early (e.g., 30 days), then free for everyone. *First look, then everyone.*

**D4 · The Raconteur Bookshop — the site-wide storefront**
One central bookshop page: every ebook for sale, browsable by genre, "new this week," boss-curated windows. Every listing links to the author page. The shop is a discovery engine wearing a cash register.

**D5 · Print-on-demand paperbacks**
After ebooks prove out: partner with a POD printer (API-driven). A writer's volume (A1) → a real printed book. No inventory, Raconteur never ships a box; writer earns a royalty, site takes a small cut. The arrival moment: *your Raconteur volume, printed, on your own shelf.*

## E · GETTING THEM PUBLISHED (the career ladder — your #2 + #3, done honestly)

**E1 · Raconteur Recommends — the scout program** *(boss pillar 3)*
The boss as trusted literary scout — the most powerful and most delicate feature in Part 2.
- Pass-holders submit finished works for consideration → boss reads → the rare ones the boss genuinely believes in get a **warm introduction to agent/publisher contacts**, backed by the writer's real Raconteur numbers.
- **Guardrails (non-negotiable):** never a fee for an introduction (charging writers to "reach agents" is the industry's oldest scam — this is free with the pass); the Raconteur name is lent only where the boss truly stands behind the work; zero promises, ever; the writer's submission stays theirs, always.
- The code is trivial; the trust is the real cost. But done right, "discovered on Raconteur" becomes the brand.

**E2 · The Readership Report** *(the killer feature — nearly free to build)*
An exportable one-page PDF per work, on real data the site already collects: reads over time, **completion rate (from reading-progress data)**, follower conversion, likes, comments, finale spike.
- A query letter that says *"12,000 reads, 64% completion, 900 followers gained during serialization"* carries evidence no other writing community can hand a writer.
- Agents ask "is there an audience?" — Raconteur answers with numbers.
- Ships with zero money plumbing. **The earliest shippable piece of Part 2.**

**E3 · The Query Toolkit** — query letter + synopsis builders (guided templates in Raconteur's typography), monthly "office hours" threads where writers workshop queries together.

**E4 · The Manuscript Formatter** — one click from any work to industry-standard submission format: 12pt serif, double-spaced, title page, slug + page numbers. From Raconteur page to agent's inbox in one click.

**E5 · The Submissions Desk** *(boss pillar 2)* — a curated, live directory of literary magazines, anthologies, and contests: deadlines, genres, pay rates, response times — with notification alerts when windows open.
- **Warning badges** on vanity publishers and fee-charging "agents" — the trust move that makes Raconteur the safe harbor.
- Serious SEO play: writers search "where to submit short stories" at 2am. Raconteur should be the answer.
- Syncs to the notifications table — "the window for The Willow Review closes Friday."

**E6 · Wide distribution, one click** — the real "publish elsewhere": push a finished ebook out to Apple Books, Kobo, libraries (Draft2Digital-style, non-exclusive). Raconteur becomes the **launchpad**, never a walled garden. Pairs with the golden rule: the work stays free to read here, sold everywhere else.

**E7 · The Annual Anthology** — the boss curates the year's best Raconteur works → a print + ebook anthology sold in the bookshop. Writers earn a real *"selected by"* credit — a genuine publishing credential. Annual tradition = annual revenue = annual buzz cycle.

**E8 · Prized contests** — transparent judging (guest judges from the lit world), a listed prize pool, anthology slots for winners. Entry fees small or zero; Raconteur's cut transparent or none.

## F · WILD CARDS — genuinely new money

**F1 · The Commissions Market** — *"write me something."* Readers commission bespoke work: a wedding-vow story, a bedtime tale with her name in it, a grandmother's life as a fable. Writer sets a rate card, accepts briefs, escrowed payment on delivery. **Bespoke tales as heirlooms — the sleeper feature of Part 2.**

**F2 · Fund the Finale** — writer sets a pledge milestone: *"at $300, the final act ships — free for everyone."* Money buys the writer's time, never the reader's access. Serialized anticipation meets collective support.

**F3 · Gifting** — buy any bookshop item *for* someone, with a dedication line. "I read this on Raconteur and thought of you." Books are gifts; the site should let them be.

**F4 · Craft workshops (later)** — ticketed workshops taught by top pass-holders (revenue split with the writer). The masters of the site teaching its newcomers.

## G · HOW RACONTEUR ITSELF EARNS (the honest ledger)

| Stream | Site's cut | Notes |
|---|---|---|
| The Pro Pass | 100% | The Part 1 product — tools, one-time |
| Bookshop (D1/D4) | ~10% | Amazon takes 30–65% from self-pub; we undercut everyone |
| Print-on-demand (D5) | small fixed | Printer's cost passes through, untouched |
| Tips (D2) | ~5% | Volume feature, not a margin feature |
| Support tiers (D3) | ~5% | Exist to pay writers, not the site |
| Commissions (F1) | ~10% | Escrow protection is a service worth paying for |
| Anthology (E7) / Workshops (F4) | split | The writers' cut comes first |

**Never on the table:** ads, selling reader data, paid placement in curation, or charging readers to read.
**The brand line: "Raconteur makes money when writers make money. Never before, never instead."**

## H · BUILD REALITY (the honest sequencing)

Paying *writers* (D1–D5, F1–F3) needs **Stripe Connect-class plumbing**: KYC identity checks, tax forms, payouts, refund handling — heavier than the pass door, but one build unlocks every D/F feature at once.
Career features (**E2 Report, E3 Toolkit, E4 Formatter, E5 Desk**) need **zero money plumbing** — they're pure code on existing data. They ship early and make the pass legendary *before* the bookshop exists.

## I · THE REJECTED SHELF (publish as a public promise)

- ❌ Charging readers to unlock chapters — reading is free, forever, all skins.
- ❌ Charging writers for agent introductions — "pay to reach publishers" is the scam we exist to defeat.
- ❌ Ads. Anywhere. Ever.
- ❌ Selling or sharing reader data.
- ❌ Paid placement in curation — the desks stay incorruptible.
- ❌ Pro as a subscription — one price, one time, forever.

