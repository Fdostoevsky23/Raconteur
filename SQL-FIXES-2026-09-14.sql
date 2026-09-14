-- ============================================================================
-- SQL-FIXES-2026-09-14.sql — Raconteur
-- Run this in the Supabase Dashboard → SQL Editor (one shot, safe to re-run).
--
-- WHY (from the session-close handoff, rows 63-64):
--   1. Defensive: make the comments DELETE policy explicitly owner-or-admin.
--      NOTE: a live probe on 2026-09-14 (anon-key insert of a guest comment,
--      then anon-key DELETE attempt) showed the row SURVIVES — the live DB
--      already blocks anonymous deletes. This section just makes the intent
--      explicit and future-proof (idempotent).
--   2. Feature unlock: comments.story_id is uuid, so STATIC-slug stories
--      (poets-from-tomorrow etc.) cannot hold comments. Convert story_id to
--      text so the slug can be stored. DB-story comments keep working
--      (uuid values become their text form; existing queries compare fine).
--   3. OPTIONAL: same conversion for likes.story_id / bookmarks.story_id if
--      you want likes & bookmarks on static-slug stories too. Otherwise skip
--      PART C.
-- ============================================================================

-- ============================================================================
-- PART A — Comments policies: public read/insert, delete = owner or admin only.
-- Drops EVERY existing policy on comments first (dynamic, name-agnostic), so
-- the end state is guaranteed no matter what names the live DB currently uses.
-- (Live probe 2026-09-14: anon deletes are ALREADY blocked — this part makes
-- the intent explicit and idempotent.)
-- ============================================================================
alter table public.comments enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'comments'
  loop
    execute format('drop policy if exists %I on public.comments', r.policyname);
  end loop;
end $$;

create policy "comments_public_read"    on public.comments for select using (true);
create policy "comments_anyone_insert"  on public.comments for insert with check (true);
create policy "comments_delete_owner"   on public.comments for delete using (
  auth.uid() = user_id
  or exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.is_admin
  )
);

-- ============================================================================
-- PART B — comments.story_id: uuid -> text  (REQUIRED for static-slug stories)
-- Safely drops any FK on story_id first, then converts.
-- ============================================================================
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.comments'::regclass
      and contype = 'f'
      and pg_get_constraintdef(oid) like '%story_id%'
  loop
    execute format('alter table public.comments drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.comments alter column story_id type text using story_id::text;

-- story lookups are the hottest comments query — keep an index on each path.
create index if not exists comments_story_id_idx  on public.comments (story_id);
create index if not exists comments_parent_id_idx on public.comments (parent_id);

-- ============================================================================
-- PART C — OPTIONAL: likes.story_id + bookmarks.story_id uuid -> text
-- (only run if you want likes/bookmarks on static-slug stories as well)
-- ============================================================================
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.likes'::regclass
      and contype = 'f'
      and pg_get_constraintdef(oid) like '%story_id%'
  loop
    execute format('alter table public.likes drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.likes alter column story_id type text using story_id::text;

create index if not exists likes_story_id_idx on public.likes (story_id);

do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.bookmarks'::regclass
      and contype = 'f'
      and pg_get_constraintdef(oid) like '%story_id%'
  loop
    execute format('alter table public.bookmarks drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.bookmarks alter column story_id type text using story_id::text;

create index if not exists bookmarks_story_id_idx on public.bookmarks (story_id);

-- ============================================================================
-- AFTER RUNNING:
-- Tell the agent ("SQL done") — the readers' isDbStory gates on static-slug
-- stories get opened, and the admin Story Comments list gets a slug->title
-- fallback so static-story comments render with the right title/link.
-- ============================================================================
