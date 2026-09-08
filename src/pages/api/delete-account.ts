// src/pages/api/delete-account.ts — permanent account deletion (owner-initiated)
// The client sends the caller's Supabase access token; we validate it, clean up
// every row the user owns, then delete the auth user via the service-role key.
// (The old client-side flow only deleted a few rows and never touched auth.users,
// so "deleted" users could log straight back in.)
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  // Validate the caller's JWT against the project before touching anything
  const publicClient = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  const { data: userData, error: userErr } = await publicClient.auth.getUser(token);
  const uid = userData?.user?.id;
  if (userErr || !uid) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const admin = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // Own-content rows. poetry_collections cascades its stories.collection_id to
  // NULL via FK; deleting the auth user last cascades anything left with
  // ON DELETE CASCADE (e.g. private_profiles, reads.user_id).
  const ownedTables: Array<[string, string]> = [
    ['stories', 'author_id'],
    ['bookmarks', 'user_id'],
    ['likes', 'user_id'],
    ['comments', 'user_id'],
    ['notifications', 'user_id'],
    ['recommendations', 'user_id'],
    ['books', 'owner_id'],
    ['poetry_collections', 'owner_id'],
    ['private_profiles', 'user_id'],
    ['digest_subscribers', 'user_id'],
    ['reads', 'user_id'],
    ['profiles', 'user_id'],
  ];
  const failures: string[] = [];
  for (const [table, column] of ownedTables) {
    const { error } = await admin.from(table).delete().eq(column, uid);
    if (error) failures.push(`${table}: ${error.message}`);
  }
  // Two-sided rows: the user appears in either column
  const twoSided: Array<[string, string, string]> = [
    ['messages', 'sender_id', 'recipient_id'],
    ['follows', 'follower_id', 'followed_id'],
  ];
  for (const [table, colA, colB] of twoSided) {
    const { error } = await admin.from(table).delete().or(`${colA}.eq.${uid},${colB}.eq.${uid}`);
    if (error) failures.push(`${table}: ${error.message}`);
  }
  // Notifications the user triggered for OTHER users
  const { error: actorErr } = await admin.from('notifications').delete().eq('actor_id', uid);
  if (actorErr) failures.push(`notifications(actor): ${actorErr.message}`);

  const { error: delErr } = await admin.auth.admin.deleteUser(uid);
  if (delErr) {
    return new Response(
      JSON.stringify({ error: delErr.message, failures }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (failures.length) {
    console.error('delete-account: auth user deleted but some rows remain:', failures);
  }
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};
