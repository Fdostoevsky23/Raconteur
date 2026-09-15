// src/lib/pro-pass.ts — the Pro Pass plumbing (Chunk 1, build-log row 74).
// One source of truth for "does this writer hold the Pro Pass": the UI hides
// what a pass unlocks, the server verifies every gated write path through
// /api/pro-pass (the service-role door — same trust model as delete-account).
// The pass columns and ledger are provisioned by SQL-PRO-PASS-2026-09-15.sql;
// until that has run, every read fails soft into a "not provisioned" state and
// the site behaves exactly as before. Nothing here logs to the console (de-vibe).
//
// The pure halves (state parsing, ceremony bookkeeping) are locked by
// tests/pro-pass.test.ts — so this module must stay import-safe without a
// Supabase env: the client is imported lazily, inside the one function that
// needs it (same first-write lesson as supabase-write.ts).

export const PASS_CEREMONY_KEY = 'raconteur.pass-ceremony';
export const PASS_SQL_FILE = 'SQL-PRO-PASS-2026-09-15.sql';
/** The one quiet line a locked-but-visible tool shows. A door with light behind it, never a wall. */
export const PASS_LOCKED_LINE = 'A Pro Pass unlocks this.';

export interface PassState {
    /** false while the pass columns or ledger are not provisioned yet */
    live: boolean;
    /** true when this writer holds the pass */
    pass: boolean;
    /** ISO date of the grant, when the row carries one */
    since: string | null;
}

/** Not a holder: the plumbing exists, this writer simply has no pass. */
export const NO_PASS: PassState = { live: true, pass: false, since: null };
/** The ledger is not provisioned yet (SQL not run, or the read failed). */
export const UNPROVISIONED: PassState = { live: false, pass: false, since: null };

/**
 * A profiles row read with explicit pass columns, plus its error if any.
 *  - an error (e.g. the column is not there yet) → not provisioned;
 *  - no row (a writer without a profile row) → not a holder;
 *  - a row → holder exactly when pro_pass is true.
 */
export function parsePassRow(row: any, error: any): PassState {
    if (error) return UNPROVISIONED;
    if (!row) return NO_PASS;
    return {
        live: true,
        pass: row.pro_pass === true,
        since: typeof row.pro_pass_since === 'string' ? row.pro_pass_since : null,
    };
}

/**
 * Pages that already fetched the profile with select('*') (the dashboards)
 * read the pass straight off that object — no second query. A missing column
 * just means undefined → not a holder; nothing breaks before the SQL runs.
 */
export function passFromProfile(profile: any): PassState {
    if (!profile) return NO_PASS;
    return {
        live: true,
        pass: profile.pro_pass === true,
        since: typeof profile.pro_pass_since === 'string' ? profile.pro_pass_since : null,
    };
}

/** One-shot read with explicit columns (the pitch page, the admin desks). */
export async function fetchProPass(userId: string): Promise<PassState> {
    const { supabase } = await import('./supabase');
    const { data, error } = await supabase
        .from('profiles')
        .select('pro_pass, pro_pass_since')
        .eq('user_id', userId)
        .maybeSingle();
    return parsePassRow(data, error);
}

/* === The unlock ceremony bookkeeping =================================== */

/** The localStorage key marking that this writer has seen their pass ceremony. */
export function passCeremonyKey(userId: string): string {
    return `${PASS_CEREMONY_KEY}.${userId}`;
}

export function readCeremonyShown(userId: string): boolean {
    try {
        return localStorage.getItem(passCeremonyKey(userId)) === '1';
    } catch {
        return false; // no storage → the ceremony can still play
    }
}

export function markCeremonyShown(userId: string): void {
    try {
        localStorage.setItem(passCeremonyKey(userId), '1');
    } catch {
        /* storage unavailable — the session simply forgets */
    }
}