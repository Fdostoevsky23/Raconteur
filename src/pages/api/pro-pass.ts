// src/pages/api/pro-pass.ts — grant and revoke the Pro Pass (Chunk 1, row 74).
// The only write door for the pass: the caller's Supabase JWT is validated,
// the caller's admin status is re-verified server-side against the service
// role (never trusted from the UI), and every grant lands in the passes
// ledger. Same trust model as /api/delete-account. The profile flip itself is
// guarded twice more in SQL-PRO-PASS-2026-09-15.sql (escalation trigger +
// column-level revoke), so a browser can never mint a pass directly.
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const PASS_SQL_FILE = 'SQL-PRO-PASS-2026-09-15.sql';
const SOURCES = ['desk', 'code', 'founding'];

function fail(status: number, error: string) {
    return new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } });
}

function ok(payload: Record<string, unknown>) {
    return new Response(JSON.stringify({ ok: true, ...payload }), { headers: { 'Content-Type': 'application/json' } });
}

export const POST: APIRoute = async ({ request }) => {
    const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return fail(401, 'unauthorized');

    // Validate the caller's JWT against the project before touching anything.
    const publicClient = createClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
    );
    const { data: userData, error: userErr } = await publicClient.auth.getUser(token);
    const caller = userData?.user?.id;
    if (userErr || !caller) return fail(401, 'unauthorized');

    const admin = createClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
    );

    // The caller must be an admin — read with the service role, not the UI.
    const { data: callerProfile } = await admin
        .from('profiles').select('is_admin').eq('user_id', caller).maybeSingle();
    if (!callerProfile?.is_admin) return fail(403, 'forbidden');

    const body = await request.json().catch(() => null);
    const action: string = body?.action ?? '';
    const userId: string = typeof body?.userId === 'string' ? body.userId : '';
    if (action !== 'grant' && action !== 'revoke') return fail(400, 'unknown action');
    if (!userId) return fail(400, 'missing writer');

    if (action === 'grant') {
        const { data: target } = await admin
            .from('profiles').select('pro_pass').eq('user_id', userId).maybeSingle();
        if (!target) return fail(404, 'writer not found');
        if (target.pro_pass === true) return ok({ pass: true, already: true });

        const since = new Date().toISOString();
        const { error: upErr } = await admin
            .from('profiles').update({ pro_pass: true, pro_pass_since: since }).eq('user_id', userId);
        if (upErr) {
            return fail(500, `The pass ledger is not provisioned yet. Run ${PASS_SQL_FILE} in the Supabase SQL editor.`);
        }

        const source = SOURCES.includes(body?.source) ? body.source : 'desk';
        await admin.from('passes').insert({
            user_id: userId,
            source,
            code: typeof body?.code === 'string' && body.code ? body.code.slice(0, 64) : null,
            granted_by: caller,
        });
        return ok({ pass: true, since });
    }

    // revoke — flip the flag and close the writer's open ledger rows.
    const { error: upErr } = await admin
        .from('profiles').update({ pro_pass: false, pro_pass_since: null }).eq('user_id', userId);
    if (upErr) {
        return fail(500, `The pass ledger is not provisioned yet. Run ${PASS_SQL_FILE} in the Supabase SQL editor.`);
    }
    const { data: openRows } = await admin
        .from('passes').select('id').eq('user_id', userId).is('revoked_at', null);
    if (openRows && openRows.length > 0) {
        await admin.from('passes')
            .update({ revoked_at: new Date().toISOString() })
            .in('id', openRows.map((r: { id: string }) => r.id));
    }
    return ok({ pass: false });
};