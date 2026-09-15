-- ============================================================================
-- SQL-PRO-PASS-2026-09-15.sql — Raconteur · CHUNK 1: THE PASS ITSELF
-- Run this in the Supabase Dashboard → SQL Editor (one shot, safe to re-run).
--
-- WHY (build-log row 73 handoff, the Pro Pass plumbing):
--   The Pro Pass is a one-time unlock for writers. Chunk 1 ships the plumbing
--   only: a boolean on the profile, an audit ledger of every grant, and the
--   guard that stops a pass from ever being self-granted from the browser.
--   No payment door here (boss ruling: the money wall is built last).
--
-- THREE PARTS:
--   A · profiles.pro_pass + pro_pass_since, and the escalation guard that
--       blocks self-grants (the existing trigger only guarded is_admin/verified).
--   B · public.passes — the audit ledger (who, when, from where). Read-only to
--       its owner (+ admins); writes only ever reach it through the
--       service-role endpoint /api/pro-pass (the /api/delete-account door
--       pattern). No insert/update/delete policy exists, by design.
--   C · Verification queries (harmless, just prints counts).
--
-- AFTER RUNNING: /pro/pass flips from "the ledger is not provisioned yet" to a
-- live standing card, the dashboard shows the brass seal, and the Editor's Desk
-- gains the Pro Passes section with working grant/revoke.
-- ============================================================================

-- ============================================================================
-- PART A — the pass columns on profiles
-- ============================================================================
alter table public.profiles add column if not exists pro_pass       boolean not null default false;
alter table public.profiles add column if not exists pro_pass_since timestamptz;

-- A1 · ESCALATION GUARD (the important half).
-- profiles_self_update lets a signed-in user update their own row, so without
-- this guard a pass-holder could be minted from the browser console. The
-- trigger below is re-created with the pass columns added. Rule:
--   a change is allowed only for an admin, or for a request with NO end-user
--   JWT (auth.uid() is null = the service-role endpoint, which is the only
--   path the desk's grant button uses). Anonymous browser requests carry a
--   null uid too, but RLS blocks them from updating any profile row, so they
--   cannot reach this trigger at all.
create or replace function public.block_privilege_escalation() returns trigger language plpgsql as $$
begin
  if OLD.is_admin is distinct from NEW.is_admin and not public.is_admin() then
    raise exception 'is_admin can only be changed by an admin (trigger block)';
  end if;
  if OLD.verified is distinct from NEW.verified and not public.is_admin() then
    raise exception 'verified can only be changed by an admin (trigger block)';
  end if;
  if OLD.pro_pass is distinct from NEW.pro_pass
     and not public.is_admin() and auth.uid() is not null then
    raise exception 'pro_pass is granted from the editor''s desk, never from the browser (trigger block)';
  end if;
  if OLD.pro_pass_since is distinct from NEW.pro_pass_since
     and not public.is_admin() and auth.uid() is not null then
    raise exception 'pro_pass_since is set by the pass endpoint, never from the browser (trigger block)';
  end if;
  return NEW;
end; $$;

drop trigger if exists trg_block_privilege on public.profiles;
create trigger trg_block_privilege before update on public.profiles
  for each row execute function public.block_privilege_escalation();

-- A2 · Column-level belt and braces (same idiom as the phone column lock).
-- The trigger above is authoritative; this narrows the UPDATE grant so a
-- self-update cannot even name the pass columns.
revoke update (pro_pass, pro_pass_since) on public.profiles from anon, authenticated;

-- ============================================================================
-- PART B — public.passes, the audit ledger
-- ============================================================================
create table if not exists public.passes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  source      text not null default 'desk',   -- desk | code | founding
  code        text,                            -- unlock code, when one is used
  granted_by  uuid,                            -- the admin who granted it
  granted_at  timestamptz not null default now(),
  revoked_at  timestamptz
);

create index if not exists passes_user_idx on public.passes (user_id, granted_at desc);

alter table public.passes enable row level security;

-- Read: your own pass history, or everything if you are the editor.
drop policy if exists "passes_read_own_or_admin" on public.passes;
create policy "passes_read_own_or_admin" on public.passes
  for select using (auth.uid() = user_id or public.is_admin());

-- No insert / update / delete policies: the ledger is written only by the
-- service-role endpoint. (Service role bypasses RLS; the browser cannot.)
grant select on public.passes to anon, authenticated;

-- ============================================================================
-- PART C — verification (safe, read-only)
-- ============================================================================
select 'pro_pass column' as check_name, count(*)::text as result
  from information_schema.columns
 where table_schema = 'public' and table_name = 'profiles' and column_name = 'pro_pass'
union all
select 'passes table', count(*)::text
  from information_schema.tables
 where table_schema = 'public' and table_name = 'passes'
union all
select 'passes policies', count(*)::text
  from pg_policies
 where schemaname = 'public' and tablename = 'passes'
union all
select 'pass holders', count(*)::text
  from public.profiles where pro_pass;