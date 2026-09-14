// tests/skin.test.ts — CHARACTERISATION tests for the three-skin path mapping.
// skin.ts is the skin switchboard: classic ↔ pro (Raconteur+) ↔ max (Raconteur Pro).
// (The original plus skin lost the bake-off and was removed at the boss's
// order — these tests lock the three-skin reality that replaced it.)
import { describe, it, expect } from 'vitest';
import {
    isProPath, isMaxPath, isHomePath,
    toMaxPath, toProPath, toClassicPath,
} from '../src/lib/skin';

describe('skin detectors', () => {
    it('classic paths belong to no skin', () => {
        expect(isProPath('/')).toBe(false);
        expect(isProPath('/story/x')).toBe(false);
        expect(isMaxPath('/author/jane')).toBe(false);
    });

    it('root + nested paths light up their own skin', () => {
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
    });
});

describe('isHomePath — the only pages where the skin switch lives', () => {
    it('all four skin homes count as home', () => {
        for (const p of ['/', '', '/pro', '/pro/', '/max', '/max/']) {
            expect(isHomePath(p), p).toBe(true);
        }
    });

    it('inner pages do not', () => {
        for (const p of ['/pro/stories', '/max/story/x', '/story/x', '/author/jane']) {
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

    it('re-points pro paths at max', () => {
        expect(toMaxPath('/pro/story/x')).toBe('/max/story/x');
    });
});

describe('toProPath — any path → its pro counterpart (Raconteur+ lives at /pro)', () => {
    it('maps classic root and inner pages', () => {
        expect(toProPath('/')).toBe('/pro');
        expect(toProPath('/story/x')).toBe('/pro/story/x');
    });

    it('leaves pro paths alone', () => {
        expect(toProPath('/pro')).toBe('/pro');
        expect(toProPath('/pro/story/x')).toBe('/pro/story/x');
    });

    it('re-points max paths at pro', () => {
        expect(toProPath('/max/story/x')).toBe('/pro/story/x');
    });
});

describe('toClassicPath — any skin path → its classic counterpart', () => {
    it('skin roots collapse to /', () => {
        expect(toClassicPath('/pro')).toBe('/');
        expect(toClassicPath('/pro/')).toBe('/');
        expect(toClassicPath('/max')).toBe('/');
        expect(toClassicPath('/max/')).toBe('/');
    });

    it('skin inner pages drop the prefix', () => {
        expect(toClassicPath('/max/story/x')).toBe('/story/x');
        expect(toClassicPath('/pro/story/x')).toBe('/story/x');
    });

    it('classic paths pass through untouched', () => {
        expect(toClassicPath('/story/x')).toBe('/story/x');
        expect(toClassicPath('/author/jane')).toBe('/author/jane');
    });
});
