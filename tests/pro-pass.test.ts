// tests/pro-pass.test.ts — the pure halves of the Pro Pass plumbing (Chunk 1).
// Locks: the fail-soft states (provisioned vs not), the holder decision, the
// ceremony bookkeeping key, and the copy constants the skins share.
import { describe, it, expect } from 'vitest';
import {
    PASS_CEREMONY_KEY,
    PASS_LOCKED_LINE,
    PASS_SQL_FILE,
    NO_PASS,
    UNPROVISIONED,
    parsePassRow,
    passFromProfile,
    passCeremonyKey,
} from '../src/lib/pro-pass';

describe('parsePassRow — the explicit-columns read', () => {
    it('an error means the ledger is not provisioned yet (fail soft)', () => {
        expect(parsePassRow(null, { message: 'column profiles.pro_pass does not exist' })).toEqual(UNPROVISIONED);
        expect(parsePassRow(null, new Error('any')).live).toBe(false);
        expect(parsePassRow(null, 'schema error').pass).toBe(false);
    });

    it('no row means: plumbing live, this writer holds no pass', () => {
        expect(parsePassRow(null, null)).toEqual(NO_PASS);
        expect(parsePassRow(undefined, null)).toEqual(NO_PASS);
    });

    it('a row is a holder exactly when pro_pass is true (not truthy)', () => {
        expect(parsePassRow({ pro_pass: true, pro_pass_since: '2026-09-15T10:00:00Z' }, null))
            .toEqual({ live: true, pass: true, since: '2026-09-15T10:00:00Z' });
        expect(parsePassRow({ pro_pass: false, pro_pass_since: null }, null).pass).toBe(false);
        expect(parsePassRow({ pro_pass: 'yes' }, null).pass).toBe(false);   // strings are not a pass
        expect(parsePassRow({ pro_pass: 1 }, null).pass).toBe(false);       // nor numbers
        expect(parsePassRow({}, null).pass).toBe(false);
    });

    it('a non-string since is dropped, a string is kept verbatim', () => {
        expect(parsePassRow({ pro_pass: true, pro_pass_since: 12345 }, null).since).toBeNull();
        expect(parsePassRow({ pro_pass: true }, null).since).toBeNull();
    });
});

describe('passFromProfile — the select(*) shortcut', () => {
    it('no profile object at all reads as not a holder (plumbing live)', () => {
        expect(passFromProfile(null)).toEqual(NO_PASS);
        expect(passFromProfile(undefined).live).toBe(true);
    });

    it('reads the pass straight off the dashboard profile object', () => {
        expect(passFromProfile({ pen_name: 'Nzan', pro_pass: true, pro_pass_since: '2026-09-15' }))
            .toEqual({ live: true, pass: true, since: '2026-09-15' });
        // Before the SQL runs the column is simply absent — undefined, not an error.
        expect(passFromProfile({ pen_name: 'Nzan' })).toEqual({ live: true, pass: false, since: null });
    });

    it('still refuses a truthy non-boolean', () => {
        expect(passFromProfile({ pro_pass: 'true' }).pass).toBe(false);
    });
});

describe('ceremony bookkeeping + shared copy', () => {
    it('the ceremony key is namespaced per writer', () => {
        expect(passCeremonyKey('abc')).toBe(`${PASS_CEREMONY_KEY}.abc`);
        expect(passCeremonyKey('abc')).not.toBe(passCeremonyKey('abd'));
    });

    it('the constants keep their contract', () => {
        expect(PASS_SQL_FILE).toBe('SQL-PRO-PASS-2026-09-15.sql');   // must match the repo file
        expect(PASS_LOCKED_LINE.endsWith('.')).toBe(true);            // de-vibe: no exclamations
        expect(PASS_LOCKED_LINE.includes('Pro Pass')).toBe(true);
        expect(PASS_CEREMONY_KEY.startsWith('raconteur.')).toBe(true);
    });
});