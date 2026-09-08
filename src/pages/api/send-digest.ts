// src/pages/api/send-digest.ts — The Sunday Paper delivery job
// Trigger: GET /api/send-digest?key=YOUR_DIGEST_SECRET
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

function row(site: string, s: any, extra = '') {
  return `<tr><td style="padding:6px 0;">
    <a href="${site}/story/${s.id}" style="color:#2e2a22;font-family:Georgia,serif;font-size:15px;font-weight:bold;text-decoration:none;">${esc(s.title)}</a>
    <span style="color:#8a7d65;font-family:Georgia,serif;font-size:13px;font-style:italic;"> — ${esc(s.author_name)}${extra}</span>
  </td></tr>`;
}

function section(head: string, rows: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;">
    <tr><td style="font-family:Georgia,serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#3d5a3c;border-bottom:1px solid #ddd2bb;padding-bottom:6px;">${head}</td></tr>
    ${rows}
  </table>`;
}

function renderEmail(o: { followed: any[]; poems: any[]; appreciated: any[]; site: string }) {
  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  return `<div style="background:#1e2420;padding:28px 12px;">
    <table width="600" cellpadding="0" cellspacing="0" style="margin:0 auto;background:#faf5ea;border:1px solid #ddd2bb;">
      <tr><td style="padding:34px 40px 26px;text-align:center;border-bottom:4px double #2e2a22;">
        <div style="font-family:Georgia,serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8a7d65;">Sunday Edition</div>
        <div style="font-family:Georgia,serif;font-size:26px;font-weight:bold;letter-spacing:2px;color:#2e2a22;">THE RACONTEUR WEEKLY</div>
        <div style="font-family:Georgia,serif;font-size:12px;font-style:italic;color:#8a7d65;">${date}</div>
      </td></tr>
      <tr><td style="padding:30px 40px;">
        ${o.followed.length ? section('From Writers You Follow', o.followed.map((s) => row(o.site, s)).join('')) : ''}
        ${o.poems.length ? section('Fresh Poetry', o.poems.map((s) => row(o.site, s, ' · Poem')).join('')) : ''}
        ${o.appreciated.length ? section('Most Appreciated This Week', o.appreciated.map((s) => row(o.site, s, ` · ♡ ${s.likes}`)).join('')) : ''}
      </td></tr>
      <tr><td style="padding:20px 40px 30px;text-align:center;border-top:4px double #2e2a22;">
        <div style="font-family:Georgia,serif;font-size:12px;font-style:italic;color:#8a7d65;">Every story here was written to be remembered.</div>
        <div style="font-family:Georgia,serif;font-size:11px;color:#8a7d65;margin-top:10px;">
          <a href="${o.site}/digest" style="color:#3d5a3c;">Manage subscription</a> · <a href="${o.site}/stories" style="color:#3d5a3c;">Browse the shelf</a>
        </div>
      </td></tr>
    </table>
  </div>`;
}

export const GET: APIRoute = async ({ url }) => {
  // Gate: only the secret holder can fire the job (constant-time compare)
  const provided = Buffer.from(url.searchParams.get('key') || '');
  const secret = Buffer.from(import.meta.env.DIGEST_SECRET || '');
  const keyOk = provided.length === secret.length && timingSafeEqual(provided, secret);
  if (!keyOk) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const admin = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const site = url.origin;

  // Who gets the paper?
  const { data: subs, error: subErr } = await admin
    .from('digest_subscribers').select('user_id, email').eq('subscribed', true);
  if (subErr) return new Response(JSON.stringify({ error: subErr.message }), { status: 500 });
  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, note: 'no subscribers yet' }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Shared sections: fresh poetry + most appreciated
  const { data: poems } = await admin
    .from('stories').select('id, title, author_name')
    .eq('status', 'published').or('kind.eq.poem,genre_tag.eq.Poetry')
    .gte('created_at', weekAgo).order('created_at', { ascending: false }).limit(10);

  let appreciated: any[] = [];
  const { data: recentLikes } = await admin.from('likes').select('story_id').gte('created_at', weekAgo);
  if (recentLikes && recentLikes.length) {
    const counts: Record<string, number> = {};
    recentLikes.forEach((l: any) => { counts[l.story_id] = (counts[l.story_id] || 0) + 1; });
    const topIds = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
    const { data: top } = await admin.from('stories').select('id, title, author_name')
      .in('id', topIds).eq('status', 'published');
    appreciated = (top || [])
      .sort((a: any, b: any) => (counts[b.id] || 0) - (counts[a.id] || 0))
      .map((s: any) => ({ ...s, likes: counts[s.id] }));
  }

  let sent = 0, skipped = 0;
  for (const sub of subs) {
    // Personal section: writers this reader follows
    const { data: follows } = await admin.from('follows').select('followed_id').eq('follower_id', sub.user_id);
    const ids = (follows || []).map((f: any) => f.followed_id);
    let followed: any[] = [];
    if (ids.length) {
      const { data: fs } = await admin.from('stories').select('id, title, author_name')
        .in('author_id', ids).eq('status', 'published').gte('created_at', weekAgo)
        .order('created_at', { ascending: false });
      followed = fs || [];
    }

    // Quiet week = no email
    if (!followed.length && !(poems || []).length && !appreciated.length) { skipped++; continue; }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Set DIGEST_FROM_EMAIL in .env after verifying your domain in Resend —
        // onboarding@resend.dev only delivers to your own account email.
        from: `The Raconteur Weekly <${import.meta.env.DIGEST_FROM_EMAIL || 'onboarding@resend.dev'}>`,
        to: [sub.email],
        subject: 'The Raconteur Weekly — Sunday Edition',
        html: renderEmail({ followed, poems: poems || [], appreciated, site }),
      }),
    });
    if (res.ok) sent++; else skipped++;
    await new Promise((r) => setTimeout(r, 300));
  }

  return new Response(JSON.stringify({ sent, skipped }), { headers: { 'Content-Type': 'application/json' } });
};