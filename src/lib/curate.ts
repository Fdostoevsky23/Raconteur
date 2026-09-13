// src/lib/curate.ts — the house curation engine (shared by every skin's homepage).
// Rule of the house, per the boss: each featured browser serves `count` works =
// 1 reserved slot (the editor's latest work in that lane) + (count - 1) works from
// DIFFERENT random accounts, shuffled on a daily seed — same lineup all day, a
// fresh one tomorrow. When the house is quiet (fewer writers than slots), top up
// from the newest of the whole pool.

export const BOSS_NAME = 'Nzan Kikon';

/** Deterministic rank for a story id under a daily seed. */
export function dailyRank(seed: number, id: string): number {
    let h = seed;
    for (let c = 0; c < id.length; c++) h = ((h ^ id.charCodeAt(c)) * 16777619) >>> 0;
    return h;
}

/** Days since Jan 1 — the daily rotation seed. */
export function dayOfYearNow(): number {
    return Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
}

/**
 * Pick `count` works from `pool` (expected newest-first):
 * reserved editor pick first, then one work per distinct other writer,
 * daily-shuffled, then newest-of-pool top-up.
 */
export function curate(pool: any[], count: number, daySeed: number, bossName: string = BOSS_NAME): any[] {
    const picks: any[] = [];

    // 1. the reserved slot: the boss's latest work in this lane
    const bossLatest = pool.find((x: any) => x.author === bossName);
    if (bossLatest) picks.push(bossLatest);

    // 2. one work per distinct other writer, daily-shuffled
    const latestByAuthor: Record<string, any> = {};
    pool.forEach((x: any) => {
        if (x.author === bossName) return;
        if (!latestByAuthor[x.author]) latestByAuthor[x.author] = x; // pool is newest-first
    });
    const others = Object.values(latestByAuthor)
        .sort((a: any, b: any) => dailyRank(daySeed, String(a.slug ?? a.id)) - dailyRank(daySeed, String(b.slug ?? b.id)));
    for (const w of others) {
        if (picks.length >= count) break;
        if (!picks.some((px) => px.author === w.author)) picks.push(w);
    }

    // 3. top up from the newest of the whole pool
    for (const x of pool) {
        if (picks.length >= count) break;
        if (!picks.some((px) => px.slug === x.slug && px.id === x.id)) picks.push(x);
    }

    return picks.slice(0, count);
}
