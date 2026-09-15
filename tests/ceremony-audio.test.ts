// tests/ceremony-audio.test.ts — CHARACTERISATION tests for the ceremony voice.
// The skin-switch ceremonies gained sound (boss order, 2026-09-14): a departure
// chime played in the click gesture, and per-skin arrival themes synced to the
// letter-by-letter wordmark. The browser half (Web Audio) is environment-bound;
// these tests lock the PURE half: mute persistence parsing and the arrival
// schedule math (what plays, when, in which key — and what stays silent).
import { describe, it, expect } from 'vitest';
import {
    AUDIO_KEY, parseAudioEnabled, buildArrivalSchedule, buildPassSchedule,
    type ArrivalSpec,
} from '../src/lib/ceremony-audio';

const base = {
    first: 0.5,
    stagger: 0.25,
    accent: 10,
    liftMs: 7050,
    elapsedMs: 0,
} as const;

const classic: ArrivalSpec = { ...base, variant: 'classic', word: 'Raconteur Classic' };
const pro: ArrivalSpec = { ...base, variant: 'pro', word: 'Raconteur+', accent: 9, liftMs: 5300 };
const max: ArrivalSpec = { ...base, variant: 'max', word: 'Raconteur Pro', liftMs: 6300 };

describe('mute persistence — default ON, only the explicit off silences', () => {
    it('parses the three meaningful states', () => {
        expect(parseAudioEnabled(null)).toBe(true);   // first visit → ceremonies sing
        expect(parseAudioEnabled('on')).toBe(true);
        expect(parseAudioEnabled('off')).toBe(false);
    });

    it('fails open on garbage values (never mute by accident)', () => {
        expect(parseAudioEnabled('yes')).toBe(true);
        expect(parseAudioEnabled('OFF')).toBe(true);  // case-sensitive contract
        expect(parseAudioEnabled('')).toBe(true);
    });

    it('the storage key is stable (a rename would orphan every mute)', () => {
        expect(AUDIO_KEY).toBe('raconteur.ceremony-audio');
    });
});

describe('buildArrivalSchedule — classic (paper ticks + the desk bell)', () => {
    const ev = buildArrivalSchedule(classic);

    it('one sweep + a tick per non-space letter + bell + chord', () => {
        // 17 glyphs, 1 space breathes → 16 ticks.
        const ticks = ev.filter(e => e.kind === 'tick');
        expect(ticks.length).toBe(16);
        expect(ev.filter(e => e.kind === 'sweep').length).toBe(1);
        expect(ev.filter(e => e.kind === 'accent').length).toBe(1);
        expect(ev.filter(e => e.kind === 'chord').length).toBe(1);
        expect(ev.length).toBe(19);
    });

    it('times match the letter ceremony (sweep leads, bell on the tail, chord at lift)', () => {
        expect(ev.find(e => e.kind === 'sweep')!.t).toBeCloseTo(0.15, 5);
        expect(ev.find(e => e.kind === 'tick')!.t).toBeCloseTo(0.5, 5);
        expect(ev.find(e => e.kind === 'accent')!.t).toBeCloseTo(3.0, 5);   // 0.5 + 10×0.25
        expect(ev.find(e => e.kind === 'chord')!.t).toBeCloseTo(7.05, 5);   // liftMs/1000
        expect(ev[0].t).toBeCloseTo(0.15, 5);                               // sorted
    });

    it('the bell is brass (two harmonics) and the chord resolves on G', () => {
        expect(ev.find(e => e.kind === 'accent')!.freqs).toEqual([1046.5, 2093.01]);
        expect(ev.find(e => e.kind === 'chord')!.freqs).toEqual([196, 293.66, 493.88]);
    });
});

describe('buildArrivalSchedule — pro (the cognac pentatonic)', () => {
    const ev = buildArrivalSchedule(pro);

    it('ten plucks for ten glyphs, no ticks or sweep', () => {
        expect(ev.filter(e => e.kind === 'note').length).toBe(10);
        expect(ev.filter(e => e.kind === 'tick').length).toBe(0);
        expect(ev.filter(e => e.kind === 'sweep').length).toBe(0);
    });

    it('walks the D-minor pentatonic and wraps at six', () => {
        const notes = ev.filter(e => e.kind === 'note');
        expect(notes[0].freqs).toEqual([293.66]);
        expect(notes[5].freqs).toEqual([587.33]);
        expect(notes[6].freqs).toEqual([293.66]); // the wrap
        expect(notes[9].freqs).toEqual([440]);   // 9 mod 6 = 3 → the A
    });

    it('the amber swell under the + is a slow-attack low sine', () => {
        const swell = ev.find(e => e.kind === 'accent')!;
        expect(swell.freqs).toEqual([146.83]);
        expect(swell.attack).toBe(0.5);
    });

    it('the lift resolves on D minor', () => {
        expect(ev.find(e => e.kind === 'chord')!.freqs).toEqual([293.66, 349.23, 440, 587.33]);
    });
});

describe('buildArrivalSchedule — max (the editorial arpeggio)', () => {
    const ev = buildArrivalSchedule(max);

    it('twelve keys for twelve non-space glyphs, breathing at the gap', () => {
        expect(ev.filter(e => e.kind === 'note').length).toBe(12); // 13 − space
    });

    it('the red-pen stab under Pro and a C-major resolve at lift', () => {
        expect(ev.find(e => e.kind === 'accent')!.freqs).toEqual([440, 587.33]);
        expect(ev.find(e => e.kind === 'chord')!.freqs).toEqual([261.63, 329.63, 392, 523.25]);
    });
});

describe('buildArrivalSchedule — time manners', () => {
    it('events already past are skipped, the future keeps its rhythm', () => {
        const ev = buildArrivalSchedule({ ...classic, elapsedMs: 1000 });
        const ticks = ev.filter(e => e.kind === 'tick');
        expect(ticks.length).toBe(13); // abs .5/.75/1.0 fell in the past
        expect(ticks[0].t).toBeCloseTo(0.25, 5); // abs 1.25 − 1.0s
        expect(ev.find(e => e.kind === 'accent')!.t).toBeCloseTo(2.0, 5);
    });

    it('a late arrival (lift already passed) schedules nothing at all', () => {
        expect(buildArrivalSchedule({ ...classic, elapsedMs: 8000 })).toEqual([]);
    });

    it('every event is sorted and never scheduled in the past', () => {
        for (const spec of [classic, pro, max]) {
            const ev = buildArrivalSchedule(spec);
            for (let i = 1; i < ev.length; i++) expect(ev[i].t).toBeGreaterThanOrEqual(ev[i - 1].t);
            for (const e of ev) expect(e.t).toBeGreaterThanOrEqual(0.02);
        }
    });
});

/* === The pass-unlock motif (Chunk 1) ==================================== */

const passBase = { first: 0.6, stagger: 0.16, sealAt: 2.1, liftMs: 3700, elapsedMs: 0 } as const;
const passSpec = { ...passBase, word: 'Pro Pass' };

describe('buildPassSchedule — the pass-unlock theme', () => {
    const ev = buildPassSchedule(passSpec);

    it('a flick + one pluck per non-space letter + the bell + the resolve', () => {
        expect(ev.filter(e => e.kind === 'sweep').length).toBe(1);
        expect(ev.filter(e => e.kind === 'note').length).toBe(7);   // 8 glyphs, the space breathes
        expect(ev.filter(e => e.kind === 'accent').length).toBe(1);  // the brass bell on the seal
        expect(ev.filter(e => e.kind === 'chord').length).toBe(1);
        expect(ev.length).toBe(10);
    });

    it('the flick leads, the bell lands on the seal, the chord lands at lift', () => {
        expect(ev.find(e => e.kind === 'sweep')!.t).toBeCloseTo(0.3, 5);
        expect(ev.find(e => e.kind === 'note')!.t).toBeCloseTo(0.6, 5);
        expect(ev.find(e => e.kind === 'accent')!.t).toBeCloseTo(2.1, 5);
        expect(ev.find(e => e.kind === 'chord')!.t).toBeCloseTo(3.7, 5);
    });

    it('the plucks walk the desk pentatonic; the bell is the house brass; the resolve is D MAJOR', () => {
        const notes = ev.filter(e => e.kind === 'note');
        expect(notes[0].freqs).toEqual([293.66]);                    // D — the desk's root
        expect(notes[5].freqs).toEqual([587.33]);                    // the top of the pentatonic
        expect(notes[6].freqs).toEqual([293.66]);                    // voice 6 wraps to the root
        expect(ev.find(e => e.kind === 'accent')!.freqs).toEqual([1046.5, 2093.01]);
        expect(ev.find(e => e.kind === 'chord')!.freqs).toEqual([293.66, 369.99, 440, 587.33]);
    });

    it('an empty word still sings the seal and the resolve', () => {
        const bare = buildPassSchedule({ ...passBase, word: '' });
        expect(bare.filter(e => e.kind === 'note').length).toBe(0);
        expect(bare.filter(e => e.kind === 'accent').length).toBe(1);
        expect(bare.filter(e => e.kind === 'chord').length).toBe(1);
    });

    it('a late unlock (the lift already passed) schedules nothing', () => {
        expect(buildPassSchedule({ ...passSpec, elapsedMs: 5000 })).toEqual([]);
    });

    it('every event is sorted and never scheduled in the past', () => {
        for (let i = 1; i < ev.length; i++) expect(ev[i].t).toBeGreaterThanOrEqual(ev[i - 1].t);
        for (const e of ev) expect(e.t).toBeGreaterThanOrEqual(0.02);
    });
});