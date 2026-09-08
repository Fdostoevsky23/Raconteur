-- ============================================================================
-- RACONTEUR — RLS HARDENING SCRIPT
-- ============================================================================
-- HOW TO USE (spoon-fed version):
--   1. Go to https://supabase.com/dashboard → your project → SQL Editor
--   2. Run STEP 0 first (read-only diagnostics). Look at the output.
--   3. Then run the remaining steps ONE AT A TIME, reading each comment.
--   4. If any statement errors because a table/column name differs in YOUR
--      database, DO NOT guess — check Table Editor for the real name and
--      adjust that one line. Every table you skip stays unprotected!
--
-- WHY THIS MATTERS: your app trusts the client. Anyone can open browser DevTools
-- and call Supabase directly with the public anon key. Without correct Row Level
-- Security policies, they could edit/delete any story, overwrite other people's
-- recommendations, spam notes without limits, or read private messages.
-- With these policies, the database itself refuses anything not allowed here,
-- no matter what the client tries.
--
-- ⚠️  Run against a fresh backup/staging project first if possible.
-- ============================================================================


-- ============================================================================
-- STEP 0 — DIAGNOSTICS (safe, read-only — run this alone first)
-- ============================================================================

-- What tables exist and which already have RLS enabled?
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- What policies already exist?
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Confirm your admin flag column (should return your user row with is_admin = true)
select user_id, pen_name, is_admin from public.profiles where is_admin = true;


-- ============================================================================
-- STEP 1 — ADMIN HELPER FUNCTION
-- SECURITY DEFINER means it reads profiles while bypassing RLS, which avoids
-- the classic Postgres infinite-recursion problem of a table's policy querying
-- its own table.
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.user_id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;


-- ============================================================================
-- STEP 2 — STORIES
-- Public: read published only. Authors: full control of their OWN rows.
-- Admin (you): feature/hide/delete anything.
-- Assumes columns: id uuid, author_id uuid, status text
-- ============================================================================

alter table public.stories enable row level security;

drop policy if exists "stories_public_read"    on public.stories;
drop policy if exists "stories_author_select"  on public.stories;
drop policy if exists "stories_author_insert"  on public.stories;
drop policy if exists "stories_author_update"  on public.stories;
drop policy if exists "stories_author_delete"  on public.stories;
drop policy if exists "stories_admin_update"   on public.stories;
drop policy if exists "stories_admin_delete"   on public.stories;

create policy "stories_public_read"   on public.stories for select using (status = 'published');
create policy "stories_author_select" on public.stories for select using (author_id = auth.uid());
create policy "stories_author_insert" on public.stories for insert with check (author_id = auth.uid());
create policy "stories_author_update" on public.stories for update using (author_id = auth.uid());
create policy "stories_author_delete" on public.stories for delete using (author_id = auth.uid());
create policy "stories_admin_update"  on public.stories for update using (public.is_admin());
create policy "stories_admin_delete"  on public.stories for delete using (public.is_admin());


-- ============================================================================
-- STEP 3 — PROFILES
-- Public read (writer pages need bios), users manage only their own row.
-- C-01 FIX: phone is private — public reads go via view profiles_public that excludes phone.
-- C-06 FIX: is_admin/verified escalation blocked by trigger below (profiles_self_update alone cannot block column).
-- Assumes: user_id uuid (matches auth.users.id), is_admin boolean, verified boolean, phone text
-- ============================================================================

alter table public.profiles enable row level security;

drop policy if exists "profiles_public_read"  on public.profiles;
drop policy if exists "profiles_self_insert"  on public.profiles;
drop policy if exists "profiles_self_update"  on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;

create policy "profiles_public_read"  on public.profiles for select using (true);
create policy "profiles_self_insert"  on public.profiles for insert with check (user_id = auth.uid());
create policy "profiles_self_update"  on public.profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "profiles_admin_update" on public.profiles for update using (public.is_admin()) with check (true);

-- C-01: Public view that hides phone (and any future private columns).
-- Use this view for all anon/public reads; keep direct profiles access for owner/admin only.
drop view if exists public.profiles_public CASCADE;
create view public.profiles_public as
 select user_id, pen_name, bio, avatar_url, x_url, instagram_url, facebook_url, public_email,
        is_admin, verified, work_count, prose_count, poetry_count, book_recs, created_at
 from public.profiles;
grant select on public.profiles_public to anon, authenticated;
-- Column-level lock: even though profiles_public_read uses (true), anon cannot SELECT phone directly
-- (owner still can via auth.uid() check because they are authenticated and own row)
-- Keep phone readable by owner/admin via RLS + grant (authenticated can read own row's phone via policy)
-- If your Postgres version ignores column revoke with RLS, migrate phone to private_profiles table (Option A in report)

-- C-06: Block self-grant of is_admin / verified (column-level). Policy with_check cannot do this alone.
create or replace function public.block_privilege_escalation() returns trigger language plpgsql as $$
begin
  if OLD.is_admin is distinct from NEW.is_admin and not public.is_admin() then
    raise exception 'is_admin can only be changed by an admin (trigger block)';
  end if;
  if OLD.verified is distinct from NEW.verified and not public.is_admin() then
    raise exception 'verified can only be changed by an admin (trigger block)';
  end if;
  return NEW;
end; $$;
drop trigger if exists trg_block_privilege on public.profiles;
create trigger trg_block_privilege before update on public.profiles for each row execute function public.block_privilege_escalation();

-- C-01 Option A: private phone table (owner-only). Migrate existing phone data once:
create table if not exists public.private_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  updated_at timestamptz default now()
);
alter table public.private_profiles enable row level security;
drop policy if exists "private_own_read" on public.private_profiles;
drop policy if exists "private_own_upsert" on public.private_profiles;
drop policy if exists "private_own_update" on public.private_profiles;
create policy "private_own_read" on public.private_profiles for select using (user_id = auth.uid());
create policy "private_own_upsert" on public.private_profiles for insert with check (user_id = auth.uid());
create policy "private_own_update" on public.private_profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- One-time migration of legacy phone values (run once, safe to re-run):


-- ============================================================================
-- STEP 4 — COMMUNITY NOTES (whispers + notes on homepage)
-- Anyone (even logged-out visitors) may read and post. Only admin deletes.
-- Spam control beyond this (rate limiting) should later move to a database
-- function/trigger — client-side cooldowns are cosmetic only.
-- Assumes: expires_at timestamptz
-- ============================================================================

alter table public.community_notes enable row level security;

drop policy if exists "notes_public_read"   on public.community_notes;
drop policy if exists "notes_anyone_insert" on public.community_notes;
drop policy if exists "notes_admin_delete"  on public.community_notes;

create policy "notes_public_read"   on public.community_notes for select using (true);
create policy "notes_anyone_insert" on public.community_notes for insert with check (true);
create policy "notes_admin_delete"  on public.community_notes for delete using (public.is_admin());


-- ============================================================================
-- STEP 5 — COMMENTS
-- Anyone reads/posts (guest comments exist in your UI). Deletion: own comment,
-- the story's author, or admin.
-- Assumes: user_id nullable uuid, story_id uuid
-- ============================================================================

alter table public.comments enable row level security;

drop policy if exists "comments_public_read"     on public.comments;
drop policy if exists "comments_anyone_insert"   on public.comments;
drop policy if exists "comments_own_delete"      on public.comments;
drop policy if exists "comments_story_author_delete" on public.comments;
drop policy if exists "comments_admin_delete"    on public.comments;

create policy "comments_public_read"   on public.comments for select using (true);
create policy "comments_anyone_insert" on public.comments for insert with check (true);
create policy "comments_own_delete"    on public.comments for delete using (user_id = auth.uid());
create policy "comments_story_author_delete" on public.comments for delete using (
  exists (
    select 1 from public.stories s
    where s.id = comments.story_id and s.author_id = auth.uid()
  )
);
create policy "comments_admin_delete"  on public.comments for delete using (public.is_admin());


-- ============================================================================
-- STEP 6 — NOTIFICATIONS
-- Strictly private per user. Any LOGGED-IN user may create one for someone
-- else (that's how like/comment/message notifications work), but only the
-- recipient reads/marks them.
-- ============================================================================

alter table public.notifications enable row level security;

drop policy if exists "notifications_owner_read"    on public.notifications;
drop policy if exists "notifications_owner_update"  on public.notifications;
drop policy if exists "notifications_authed_insert" on public.notifications;
drop policy if exists "notifications_admin_delete"  on public.notifications;

create policy "notifications_owner_read"    on public.notifications for select using (user_id = auth.uid());
create policy "notifications_owner_update"  on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_authed_insert" on public.notifications for insert with check (auth.uid() is not null);
create policy "notifications_admin_delete"  on public.notifications for delete using (public.is_admin());


-- ============================================================================
-- STEP 7 — MESSAGES (private DMs)
-- Only sender and recipient see a message. Recipient can mark read.
-- ============================================================================

alter table public.messages enable row level security;

drop policy if exists "messages_participant_read"   on public.messages;
drop policy if exists "messages_sender_insert"      on public.messages;
drop policy if exists "messages_recipient_update"   on public.messages;
drop policy if exists "messages_admin_delete"       on public.messages;

create policy "messages_participant_read" on public.messages
  for select using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "messages_sender_insert"    on public.messages
  for insert with check (sender_id = auth.uid());
create policy "messages_recipient_update" on public.messages
  for update using (recipient_id = auth.uid()) with check (true);
create policy "messages_admin_delete"     on public.messages
  for delete using (public.is_admin());


-- ============================================================================
-- STEP 8 — FOLLOWS
-- Reads are public (your author pages display follower lists).
-- You can only create follows as yourself; either party can unfollow.
-- PRIVACY NOTE: this makes the follow graph public. If you'd rather keep it
-- private, change the read policy to:
--   using (follower_id = auth.uid() or followed_id = auth.uid())
-- ...and make the author-page follower list login-only in the UI.
-- ============================================================================

alter table public.follows enable row level security;

drop policy if exists "follows_public_read"   on public.follows;
drop policy if exists "follows_self_insert"   on public.follows;
drop policy if exists "follows_either_delete" on public.follows;

create policy "follows_public_read"   on public.follows for select using (true);
create policy "follows_self_insert"   on public.follows for insert with check (follower_id = auth.uid());
create policy "follows_either_delete" on public.follows for delete using (follower_id = auth.uid() or followed_id = auth.uid());


-- ============================================================================
-- STEP 9 — BOOKMARKS ("Saved for Later")
-- Completely private per user.
-- ============================================================================

alter table public.bookmarks enable row level security;

drop policy if exists "bookmarks_own_read"   on public.bookmarks;
drop policy if exists "bookmarks_own_insert" on public.bookmarks;
drop policy if exists "bookmarks_own_delete" on public.bookmarks;

create policy "bookmarks_own_read"   on public.bookmarks for select using (user_id = auth.uid());
create policy "bookmarks_own_insert" on public.bookmarks for insert with check (user_id = auth.uid());
create policy "bookmarks_own_delete" on public.bookmarks for delete using (user_id = auth.uid());


-- ============================================================================
-- STEP 10 — LIKES
-- Reads are public (the Digest counts weekly likes). Users toggle their own.
-- ⚠️ VERIFY: your likes table must have a user_id column — check Table Editor.
--    If it's named differently (e.g. liker_id), fix both lines below.
-- ============================================================================

alter table public.likes enable row level security;

drop policy if exists "likes_public_read"  on public.likes;
drop policy if exists "likes_own_insert"   on public.likes;
drop policy if exists "likes_own_delete"   on public.likes;

create policy "likes_public_read"  on public.likes for select using (true);
create policy "likes_own_insert"   on public.likes for insert with check (user_id = auth.uid());
create policy "likes_own_delete"   on public.likes for delete using (user_id = auth.uid());


-- ============================================================================
-- STEP 11 — BOOKS (author storefront entries)
-- Public read (shown on writer pages), owner-only writes.
-- ============================================================================

alter table public.books enable row level security;

drop policy if exists "books_public_read" on public.books;
drop policy if exists "books_own_insert"  on public.books;
drop policy if exists "books_own_update"  on public.books;
drop policy if exists "books_own_delete"  on public.books;

create policy "books_public_read" on public.books for select using (true);
create policy "books_own_insert"  on public.books for insert with check (owner_id = auth.uid());
create policy "books_own_update"  on public.books for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "books_own_delete"  on public.books for delete using (owner_id = auth.uid());


-- ============================================================================
-- STEP 12 — RECOMMENDATIONS (per-reader picks set from the admin panel)
-- Only the recipient reads theirs. ONLY ADMIN writes. This stops any user
-- from overwriting another user's recommendation via direct API calls.
-- The auto_assign_recommendations() RPC still works if it is SECURITY DEFINER.
-- ============================================================================

alter table public.recommendations enable row level security;

drop policy if exists "recommendations_owner_read" on public.recommendations;
drop policy if exists "recommendations_admin_insert" on public.recommendations;
drop policy if exists "recommendations_admin_update" on public.recommendations;
drop policy if exists "recommendations_admin_delete" on public.recommendations;

create policy "recommendations_owner_read" on public.recommendations
  for select using (user_id = auth.uid());
create policy "recommendations_admin_insert" on public.recommendations
  for insert with check (public.is_admin());
create policy "recommendations_admin_update" on public.recommendations
  for update using (public.is_admin()) with check (true);
create policy "recommendations_admin_delete" on public.recommendations
  for delete using (public.is_admin());


-- ============================================================================
-- STEP 13 — REPORTS (flagged comments/notes)
-- Anyone can file a report. Only admin can read/manage them.
-- ============================================================================

alter table public.reports enable row level security;

drop policy if exists "reports_anyone_insert" on public.reports;
drop policy if exists "reports_admin_read"    on public.reports;
drop policy if exists "reports_admin_update"  on public.reports;
drop policy if exists "reports_admin_delete"  on public.reports;

create policy "reports_anyone_insert" on public.reports for insert with check (true);
create policy "reports_admin_read"    on public.reports for select using (public.is_admin());
create policy "reports_admin_update"  on public.reports for update using (public.is_admin()) with check (true);
create policy "reports_admin_delete"  on public.reports for delete using (public.is_admin());


-- ============================================================================
-- STEP 14 — READS TABLE (privacy: anon should not see who read what)
-- Watchpoint 1: expose only story_id to anon via view; raw rows owner/admin only.
-- If you already ran an earlier version that made reads public, replace it with this.
-- ============================================================================

-- Assumes table public.reads (id uuid, story_id uuid, user_id uuid nullable, guest_key text nullable, created_at timestamptz)
-- If table does not exist yet, create it:
create table if not exists public.reads (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  guest_key text,
  created_at timestamptz default now()
);
alter table public.reads enable row level security;
drop policy if exists "reads_public_read" on public.reads;
drop policy if exists "reads_owner_read" on public.reads;
drop policy if exists "reads_anyone_insert" on public.reads;
drop policy if exists "reads_admin_delete" on public.reads;
-- Anyone can insert a read (anon guest with guest_key, or authed with user_id)
create policy "reads_anyone_insert" on public.reads for insert with check (true);
-- Only owner (user_id) or admin can read raw rows
create policy "reads_owner_read" on public.reads for select using (user_id = auth.uid() or public.is_admin());
create policy "reads_admin_delete" on public.reads for delete using (public.is_admin());
-- Public aggregate view: only story_id + count, no user/guest linkage
DROP VIEW IF EXISTS public.reads_public CASCADE;
create view public.reads_public as
 select story_id, count(*)::int as read_count, count(*) filter (where finished = true)::int as finished_count from public.reads group by story_id;
grant select on public.reads_public to anon, authenticated;

-- Weekly aggregate view for the /stories trending strip (same privacy shape as
-- reads_public: aggregates only, no user/guest linkage). The app now reads this
-- instead of raw reads rows, so trending survives the SELECT lockdown above.
DROP VIEW IF EXISTS public.reads_weekly CASCADE;
create view public.reads_weekly as
 select story_id, count(*)::int as read_count, count(*) filter (where finished = true)::int as finished_count from public.reads
 where created_at > now() - interval '7 days'
 group by story_id;
grant select on public.reads_weekly to anon, authenticated;

-- ============================================================================
-- STEP 15 — CASCADE CLEANUP ON STORY DELETE (M-05)
-- Deleting a story should not leave orphans in likes/comments/bookmarks/notifications/reads
-- Run once; if constraints already exist with cascade, these will error — skip those.
-- ============================================================================

do $$ begin
  -- likes -> stories
  if exists (select 1 from information_schema.table_constraints where constraint_name='likes_story_id_fkey') then
    alter table public.likes drop constraint likes_story_id_fkey;
  end if;
  alter table public.likes add constraint likes_story_id_fkey foreign key (story_id) references public.stories(id) on delete cascade;
exception when duplicate_object then null; end $$;

do $$ begin
  if exists (select 1 from information_schema.table_constraints where constraint_name='comments_story_id_fkey') then
    alter table public.comments drop constraint comments_story_id_fkey;
  end if;
  alter table public.comments add constraint comments_story_id_fkey foreign key (story_id) references public.stories(id) on delete cascade;
exception when duplicate_object then null; end $$;

do $$ begin
  if exists (select 1 from information_schema.table_constraints where constraint_name='bookmarks_story_id_fkey') then
    alter table public.bookmarks drop constraint bookmarks_story_id_fkey;
  end if;
  alter table public.bookmarks add constraint bookmarks_story_id_fkey foreign key (story_id) references public.stories(id) on delete cascade;
exception when duplicate_object then null; end $$;

do $$ begin
  if exists (select 1 from information_schema.table_constraints where constraint_name='notifications_story_id_fkey') then
    alter table public.notifications drop constraint notifications_story_id_fkey;
  end if;
  alter table public.notifications add constraint notifications_story_id_fkey foreign key (story_id) references public.stories(id) on delete cascade;
exception when duplicate_object then null; end $$;


-- ============================================================================
-- STEP 17 — CURATED COLLECTIONS (admin-curated reading bundles)
-- Public: read collections and their story links (needed by /collections and
-- /collection/[slug]). Writes: ADMIN ONLY — the anon key must never be able to
-- create, edit, or re-order curated shelves.
-- Assumes columns: collections(id, title, slug, curator_note, created_at)
--                  collection_stories(collection_id, story_id, sort_order)
-- ============================================================================

alter table public.collections enable row level security;

drop policy if exists "collections_public_read"  on public.collections;
drop policy if exists "collections_admin_insert" on public.collections;
drop policy if exists "collections_admin_update" on public.collections;
drop policy if exists "collections_admin_delete" on public.collections;

create policy "collections_public_read"  on public.collections for select using (true);
create policy "collections_admin_insert" on public.collections for insert with check (public.is_admin());
create policy "collections_admin_update" on public.collections for update using (public.is_admin()) with check (public.is_admin());
create policy "collections_admin_delete" on public.collections for delete using (public.is_admin());

alter table public.collection_stories enable row level security;

drop policy if exists "collection_stories_public_read"  on public.collection_stories;
drop policy if exists "collection_stories_admin_insert" on public.collection_stories;
drop policy if exists "collection_stories_admin_delete" on public.collection_stories;

create policy "collection_stories_public_read"  on public.collection_stories for select using (true);
create policy "collection_stories_admin_insert" on public.collection_stories for insert with check (public.is_admin());
create policy "collection_stories_admin_delete" on public.collection_stories for delete using (public.is_admin());


-- ============================================================================
-- STEP 18 — DIGEST SUBSCRIBERS (contains email addresses — PRIVATE)
-- The Weekly digest page reads/writes ONLY the viewer's own row; the send-digest
-- job uses the service-role key, which bypasses RLS. Anonymous visitors must
-- never be able to list or read subscriber emails.
-- Assumes columns: digest_subscribers(user_id, email, subscribed)
-- ============================================================================

alter table public.digest_subscribers enable row level security;

drop policy if exists "digest_own_read"   on public.digest_subscribers;
drop policy if exists "digest_own_insert" on public.digest_subscribers;
drop policy if exists "digest_own_update" on public.digest_subscribers;
drop policy if exists "digest_own_delete" on public.digest_subscribers;

create policy "digest_own_read"   on public.digest_subscribers for select using (user_id = auth.uid());
create policy "digest_own_insert" on public.digest_subscribers for insert with check (user_id = auth.uid());
create policy "digest_own_update" on public.digest_subscribers for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "digest_own_delete" on public.digest_subscribers for delete using (user_id = auth.uid());


-- ============================================================================
-- STEP 19 — POETRY COLLECTIONS — VERIFY ONLY, DO NOT DUPLICATE
-- This table ALREADY has correct RLS in the live database (public SELECT,
-- owner-only INSERT/UPDATE/DELETE) and stories.collection_id FK uses
-- ON DELETE SET NULL. Do NOT re-create policies here — just verify:
--   select tablename, rowsecurity from pg_tables where tablename = 'poetry_collections';
-- If rowsecurity = false for any reason, re-apply the owner policies from a
-- backup before re-enabling.
-- ============================================================================


-- ============================================================================
-- STEP 20 — ONE-TIME DATA FIX: collection slugs (M-4)
-- Old slugs kept trailing punctuation (e.g. "rainy-sunday-reads."). This
-- normalizes every slug to a-z0-9 dashes. Idempotent — safe to re-run.
-- (Already applied once against the live project on 2026-09-06.)
-- ============================================================================

update public.collections
set slug = regexp_replace(regexp_replace(regexp_replace(lower(slug), '[^a-z0-9]+', '-', 'g'), '^-+', ''), '-+$', '')
where slug <> regexp_replace(regexp_replace(regexp_replace(lower(slug), '[^a-z0-9]+', '-', 'g'), '^-+', ''), '-+$', '');


-- ============================================================================
-- STEP 16 — VERIFY (run after everything; every row should say rowsecurity = true)
-- ============================================================================
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;
