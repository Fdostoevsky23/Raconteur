// tests/curate.test.ts — CHARACTERISATION tests for the house curation engine.
// These lock the CURRENT behaviour of src/lib/curate.ts (the boss's house rule:
// reserved editor slot + one work per distinct writer, daily-shuffled, topped up
// from the newest of the pool). If one of these fails after an edit, the change
// was intentional — update the test consciously, never silently.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { curate, dailyRank, dayOfYearNow, BOSS_NAME } from '../src/lib/curate';

afterEach(() => {
    vi.useRealTimers();
});

describe('dailyRank — the deterministic hash', () => {
    it('returns the seed unchanged for an empty id', () => {
        expect(dailyRank(0, '')).toBe(0);
        expect(dailyRank(12345, '')).toBe(12345);
    });

    it('single characters are (seed ^ code) * 16777619 >>> 0', () => {
        expect(dailyRank(0, 'a')).toBe(1627429043); // 97  * 16777619
        expect(dailyRank(0, 'b')).toBe(1644206662); // 98  * 16777619
        expect(dailyRank(1, 'a')).toBe(1610651424); // 96  * 16777619
    });

    it('is deterministic for the same seed + id', () => {
        expect(dailyRank(7, 'story-12')).toBe(dailyRank(7, 'story-12'));
        expect(dailyRank(2026, 'uuid-ish-id')).toBe(dailyRank(2026, 'uuid-ish-id'));
    });

    it('always stays inside unsigned 32-bit space', () => {
        const ids = ['', 'a', 'ab', 'slug-with-dashes', '9f8c1d2e-88ab-4c11-b219-e6f19c11e431', '✦'];
        for (const seed of [0, 1, 60, 0x7fffffff, 0xffffffff]) {
            for (const id of ids) {
                const r = dailyRank(seed, id);
                expect(r).toBeGreaterThanOrEqual(0);
                expect(r).toBeLessThanOrEqual(0xffffffff);
            }
        }
    });
});

describe('dayOfYearNow — the daily rotation seed', () => {
    it('gives the day of year at local noon (Jun 15 2026 → 166)', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0));
        expect(dayOfYearNow()).toBe(166);
    });

    it('gives 1 on Jan 1 at noon', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2027, 0, 1, 12, 0, 0));
        expect(dayOfYearNow()).toBe(1);
    });

    it('returns an integer', () => {
        expect(Number.isInteger(dayOfYearNow())).toBe(true);
    });
});

describe('curate — the house rule', () => {
    const w = (id: string, author: string, slug = id) => ({ id, slug, author, title: `T ${id}` });

    it('empty pool → empty picks', () => {
        expect(curate([], 3, 1)).toEqual([]);
    });

    it('reserved slot: the boss latest (first boss item in the newest-first pool) leads', () => {
        const pool = [w('a', 'Alice'), w('b1', BOSS_NAME), w('b0', BOSS_NAME), w('c', 'Cara')];
        const picks = curate(pool, 4, 42);
        expect(picks[0].id).toBe('b1');
        expect(picks).toHaveLength(4);
    });

    it('the shuffle lane takes one work per distinct other writer (their newest)', () => {
        const pool = [w('x2', 'Xu'), w('x1', 'Xu'), w('y1', 'Yuri'), w('y0', 'Yuri')];
        const picks = curate(pool, 2, 7); // slots == distinct writers → shuffle lane only
        expect(picks.map((p: any) => p.id).sort()).toEqual(['x2', 'y1']);
    });

    it('a quiet house: the top-up refills from pool order and MAY repeat an author', () => {
        const pool = [w('x2', 'Xu'), w('x1', 'Xu'), w('y1', 'Yuri')];
        const picks = curate(pool, 4, 7);
        expect(picks).toHaveLength(3); // pool exhausted
        expect(picks.map((p: any) => p.id).sort()).toEqual(['x1', 'x2', 'y1']);
    });

    it('the boss never enters the shuffled-others lane — but the top-up may add a second boss work', () => {
        const pool = [w('b1', BOSS_NAME), w('a', 'Alice'), w('b0', BOSS_NAME)];
        const picks = curate(pool, 3, 9);
        expect(picks[0].id).toBe('b1'); // reserved slot leads
        expect(picks).toHaveLength(3);
        expect(picks.map((p: any) => p.id)).toContain('a'); // the shuffled other
        expect(picks.map((p: any) => p.id)).toContain('b0'); // quiet-house top-up
    });

    it('same seed → same lineup (stable all day)', () => {
        const pool = [w('1', 'A'), w('2', 'B'), w('3', 'C'), w('4', 'D'), w('5', 'E')];
        expect(curate(pool, 4, 99)).toEqual(curate(pool, 4, 99));
    });

    it('top-up: with fewer writers than slots, the whole pool fills (no gaps, no dupes)', () => {
        const pool = [w('1', 'A'), w('2', 'B'), w('3', 'C'), w('4', 'D'), w('5', 'E')];
        const picks = curate(pool, 5, 3);
        expect(picks).toHaveLength(5);
        expect(new Set(picks.map((p: any) => p.id)).size).toBe(5);
    });

    it('caps the picks at count', () => {
        const pool = [w('1', 'A'), w('2', 'B'), w('3', 'C'), w('4', 'D'), w('5', 'E'), w('6', 'F')];
        const picks = curate(pool, 3, 11);
        expect(picks).toHaveLength(3);
    });

    it('items without a slug still shuffle (id is the fallback key)', () => {
        const pool = [{ id: 'i1', author: 'A' }, { id: 'i2', author: 'B' }, { id: 'i3', author: 'C' }];
        const picks = curate(pool as any, 2, 5);
        expect(picks).toHaveLength(2);
    });

    it('never duplicates a work (slug+id identity) even when the pool repeats', () => {
        const pool = [w('s', 'A'), w('s', 'A'), w('t', 'B')];
        const picks = curate(pool, 3, 21);
        const identities = picks.map((p: any) => `${p.slug}:${p.id}`);
        expect(new Set(identities).size).toBe(identities.length);
    });

    it('bossName parameter overrides the default BOSS_NAME', () => {
        const pool = [w('e1', 'Editor-in-Residence'), w('a', 'Alice')];
        const picks = curate(pool, 2, 2, 'Editor-in-Residence');
        expect(picks[0].id).toBe('e1');
    });
});
