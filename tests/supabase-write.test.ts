// tests/supabase-write.test.ts — CHARACTERISATION tests for the raw REST write path.
// Locks the request shape and result mapping of src/lib/supabase-write.ts — the
// helper every reading room + story reader posts through (the de-wedged write
// path from row 64). The 25s guard itself lives at the call sites (Promise.race
// in each skin page) and is intentionally NOT part of this lib.
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

const SUPA_URL = 'https://unit-test.supabase.co';
let restInsert: typeof import('../src/lib/supabase-write').restInsert;
const fetchMock = vi.fn();

beforeAll(async () => {
    // Module reads import.meta.env at init — stub BEFORE the dynamic import.
    vi.stubEnv('PUBLIC_SUPABASE_URL', SUPA_URL);
    vi.stubEnv('PUBLIC_SUPABASE_ANON_KEY', 'anon-unit-key');
    ({ restInsert } = await import('../src/lib/supabase-write'));
});

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});

const okRes = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

describe('restInsert — request shape', () => {
    it('POSTs to <url>/rest/v1/<table> as JSON with the anon key + representation prefer', async () => {
        fetchMock.mockResolvedValue(okRes([{ id: 'n1' }]));
        await restInsert('community_notes', { body: 'hi' });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(`${SUPA_URL}/rest/v1/community_notes`);
        expect(init.method).toBe('POST');
        expect(init.headers.apikey).toBe('anon-unit-key');
        // No auth session in the test runtime → the helper falls back to the anon key.
        expect(init.headers.Authorization).toBe('Bearer anon-unit-key');
        expect(init.headers['Content-Type']).toBe('application/json');
        expect(init.headers.Prefer).toBe('return=representation');
        expect(init.body).toBe(JSON.stringify({ body: 'hi' }));
    });

    it('opts.single asks PostgREST for the single-object accept type', async () => {
        fetchMock.mockResolvedValue(okRes({ id: 'one' }));
        await restInsert('comments', { body: 'x' }, { single: true });
        const [, init] = fetchMock.mock.calls[0];
        expect(init.headers.Accept).toBe('application/vnd.pgrst.object+json');
    });

    it('without single, no Accept header is sent', async () => {
        fetchMock.mockResolvedValue(okRes([]));
        await restInsert('comments', { body: 'x' });
        const [, init] = fetchMock.mock.calls[0];
        expect(init.headers.Accept).toBeUndefined();
    });
});

describe('restInsert — result mapping', () => {
    it('success → { data, error: null }', async () => {
        fetchMock.mockResolvedValue(okRes([{ id: 'n1' }]));
        const { data, error } = await restInsert('community_notes', { body: 'hi' });
        expect(error).toBeNull();
        expect(data).toEqual([{ id: 'n1' }]);
    });

    it('non-ok with a JSON body → error.message from the body', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 403, json: async () => ({ message: 'row-level security violation' }) });
        const { data, error } = await restInsert('comments', {});
        expect(data).toBeNull();
        expect(error?.message).toBe('row-level security violation');
    });

    it('non-ok with a non-JSON body → generic "Request failed (<status>)"', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => { throw new Error('not json'); } });
        const { error } = await restInsert('comments', {});
        expect(error?.message).toBe('Request failed (500)');
    });

    it('a thrown network error surfaces its message', async () => {
        fetchMock.mockRejectedValue(new Error('boom'));
        const { data, error } = await restInsert('comments', {});
        expect(data).toBeNull();
        expect(error?.message).toBe('boom');
    });

    it('a non-Error throw becomes "Network error"', async () => {
        fetchMock.mockRejectedValue('weird');
        const { error } = await restInsert('comments', {});
        expect(error?.message).toBe('Network error');
    });
});
