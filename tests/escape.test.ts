// tests/escape.test.ts — CHARACTERISATION tests for the shared HTML escaper.
// esc() is the XSS line of defence for every user-controlled string that lands
// in an innerHTML template. Lock its exact current output — including the
// (known) non-recursing behaviour on already-escaped text.
import { describe, it, expect } from 'vitest';
import { esc } from '../src/lib/escape';

describe('esc — shared HTML escaping', () => {
    it('empty-ish values become an empty string', () => {
        expect(esc('')).toBe('');
        expect(esc(null)).toBe('');
        expect(esc(undefined)).toBe('');
    });

    it('stringifies non-strings', () => {
        expect(esc(5)).toBe('5');
        expect(esc(false)).toBe('false');
        expect(esc(0)).toBe('0');
    });

    it('escapes all five dangerous characters', () => {
        expect(esc('&')).toBe('&amp;');
        expect(esc('<')).toBe('&lt;');
        expect(esc('>')).toBe('&gt;');
        expect(esc('"')).toBe('&quot;');
        expect(esc("'")).toBe('&#39;');
    });

    it('escapes a hostile attribute+text payload exactly', () => {
        expect(esc(`<img src=x onerror="alert('&')">`)).toBe(
            '&lt;img src=x onerror=&quot;alert(&#39;&amp;&#39;)&quot;&gt;'
        );
    });

    it('leaves safe text untouched', () => {
        expect(esc('Hello world 123 — café ✦')).toBe('Hello world 123 — café ✦');
    });

    it('does NOT recurse on already-escaped text (locks current behaviour)', () => {
        expect(esc('&amp;')).toBe('&amp;amp;');
    });
});
