// tests/skin.test.ts — CHARACTERISATION tests for the four-skin path mapping.
// skin.ts is the switchboard of the whole bake-off: classic ↔ plus ↔ pro ↔ max.
// These lock the exact current mappings — including the '/profession'-style
// boundary cases that a sloppy startsWith('/pro') check would get wrong.
import { describe, it, expect } from 'vitest';
import {
    isPlusPath, isProPath, isMaxPath, isHomePath,
    toMaxPath, toPlusPath, toProPath, toClassicPath,
} from '../src/lib/skin';

describe('skin detectors', () => {
    it('classic paths belong to no skin', () => {
        expect(isPlusPath('/')).toBe(false);
        expect(isProPath('/story/x')).toBe(false);
        expect(isMaxPath('/author/jane')).toBe(false);
    });

    it('root + nested paths light up their own skin', () => {
        expect(isPlusPath('/plus')).toBe(true);
        expect(isPlusPath('/plus/')).toBe(true);
        expect(isPlusPath('/plus/stories')).toBe(true);
        expect(isProPath('/pro')).toBe(true);
        expect(isProPath('/pro/')).toBe(true);
        expect(isProPath('/pro/story/x')).toBe(true);
        expect(isMaxPath('/max')).toBe(true);
        expect(isMaxPath('/max/')).toBe(true);
        expect(isMaxPath('/max/story/x')).toBe(true);
    });

    it('prefix lookalikes do NOT leak into a skin', () => {
        expect(isProPath('/profession')).toBe(false);
        expect(isProPath('/professional')).toBe(false);
        expect(isMaxPath('/maximize')).toBe(false);
        expect(isPlusPath('/plusOne')).toBe(false);
    });
});

describe('isHomePath — the only pages where the skin switch lives', () => {
    it('all four skin homes count as home', () => {
        for (const p of ['/', '', '/plus', '/plus/', '/pro', '/pro/', '/max', '/max/']) {
            expect(isHomePath(p), p).toBe(true);
        }
    });

    it('inner pages do not', () => {
        for (const p of ['/pro/stories', '/max/story/x', '/plus/stories', '/story/x', '/author/jane']) {
            expect(isHomePath(p), p).toBe(false);
        }
    });
});

describe('toMaxPath — any path → its max counterpart', () => {
    it('maps classic root and inner pages', () => {
        expect(toMaxPath('/')).toBe('/max');
        expect(toMaxPath('')).toBe('/max');
        expect(toMaxPath('/story/x')).toBe('/max/story/x');
    });

    it('leaves max paths alone', () => {
        expect(toMaxPath('/max')).toBe('/max');
        expect(toMaxPath('/max/story/x')).toBe('/max/story/x');
    });

    it('re-points plus and pro paths at max', () => {
        expect(toMaxPath('/plus/x')).toBe('/max/x');
        expect(toMaxPath('/pro/story/x')).toBe('/max/story/x');
    });
});

describe('toPlusPath — any path → its plus counterpart', () => {
    it('maps classic root and inner pages', () => {
        expect(toPlusPath('/')).toBe('/plus');
        expect(toPlusPath('/story/x')).toBe('/plus/story/x');
    });

    it('leaves plus paths alone', () => {
        expect(toPlusPath('/plus')).toBe('/plus');
        expect(toPlusPath('/plus/x')).toBe('/plus/x');
    });

    it('re-points pro and max paths at plus (root collapses to /plus)', () => {
        expect(toPlusPath('/pro')).toBe('/plus');
        expect(toPlusPath('/pro/')).toBe('/plus');
        expect(toPlusPath('/pro/story/x')).toBe('/plus/story/x');
        expect(toPlusPath('/max/story/x')).toBe('/plus/story/x');
    });
});

describe('toProPath — any path → its pro counterpart', () => {
    it('maps classic root and inner pages', () => {
        expect(toProPath('/')).toBe('/pro');
        expect(toProPath('/story/x')).toBe('/pro/story/x');
    });

    it('leaves pro paths alone', () => {
        expect(toProPath('/pro')).toBe('/pro');
        expect(toProPath('/pro/story/x')).toBe('/pro/story/x');
    });

    it('re-points plus and max paths at pro', () => {
        expect(toProPath('/plus/x')).toBe('/pro/x');
        expect(toProPath('/max/story/x')).toBe('/pro/story/x');
    });
});

describe('toClassicPath — any skin path → its classic counterpart', () => {
    it('skin roots collapse to /', () => {
        expect(toClassicPath('/plus')).toBe('/');
        expect(toClassicPath('/plus/')).toBe('/');
        expect(toClassicPath('/pro')).toBe('/');
        expect(toClassicPath('/pro/')).toBe('/');
        expect(toClassicPath('/max')).toBe('/');
        expect(toClassicPath('/max/')).toBe('/');
    });

    it('skin inner pages drop the prefix', () => {
        expect(toClassicPath('/max/story/x')).toBe('/story/x');
        expect(toClassicPath('/pro/story/x')).toBe('/story/x');
        expect(toClassicPath('/plus/x')).toBe('/x');
    });

    it('classic paths pass through untouched', () => {
        expect(toClassicPath('/story/x')).toBe('/story/x');
        expect(toClassicPath('/author/jane')).toBe('/author/jane');
    });
});
