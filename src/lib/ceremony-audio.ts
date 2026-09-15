// src/lib/ceremony-audio.ts — the voice of the skin ceremonies (boss order, 2026-09-14).
// Pure Web Audio synthesis: no audio files, no network weight, no licensing.
// Departure (the toggle click — a gesture, always allowed) plays a page
// flick + a two-note pluck in the DESTINATION's key. Arrival (the splash on
// the landing page) plays a per-skin theme synced to the letter-by-letter
// wordmark — the same first/stagger times that drive the CSS delays:
//   classic — a paper sweep, one soft tick per letter, a brass desk bell
//             when the vermilion "Classic" tail lands, a warm chord at lift;
//   pro     — cognac pentatonic plucks, an amber swell under the "+",
//             a D-minor resolve at lift;
//   max     — an editorial piano arpeggio, a red-pen stab under "Pro",
//             a C-major resolve at lift.
// Manners: localStorage mute (default ON), prefers-reduced-motion = silent,
// a suspended AudioContext = silent pass, a late arrival = nothing scheduled.
// The pure halves (mute parsing, schedule building) are locked by
// tests/ceremony-audio.test.ts. Zero console output (de-vibe).

export const AUDIO_KEY = 'raconteur.ceremony-audio';

/* === Mute persistence (pure — testable) ================================ */

export function parseAudioEnabled(raw: string | null): boolean {
    // Default ON: anything but the explicit 'off' means the ceremonies sing.
    return raw !== 'off';
}

export function readAudioEnabled(): boolean {
    try {
        return parseAudioEnabled(localStorage.getItem(AUDIO_KEY));
    } catch {
        return true; // no storage (private mode, SSR) → fail open to default
    }
}

export function writeAudioEnabled(on: boolean): void {
    try {
        localStorage.setItem(AUDIO_KEY, on ? 'on' : 'off');
    } catch {
        /* storage unavailable — the in-memory default carries the session */
    }
}

/* === Arrival schedule (pure — testable) ================================ */

export type CeremonyVariant = 'classic' | 'pro' | 'max';

export interface ArrivalSpec {
    variant: CeremonyVariant;
    first: number;     // s — when the first letter lands (CSS delay base)
    stagger: number;   // s — between letters (CSS stagger)
    word: string;      // the glyphs being spelled (spaces breathe, not tick)
    accent: number;    // glyph index where the edition tail begins
    liftMs: number;    // ms from time origin until the curtain lifts
    elapsedMs: number; // ms from the same origin until now
}

export interface CeremonyEvent {
    t: number;  // seconds from now
    kind: 'sweep' | 'tick' | 'note' | 'accent' | 'chord';
    freqs?: number[];
    noise?: { freq: number; dur: number; peak: number; q?: number; type?: string };
    dur?: number;
    peak?: number;
    type?: string;
    attack?: number;
    detune?: number;
    stagger?: number;
}

// The scales — warm families, one voice per skin.
const PRO_PLUCKS = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33]; // D minor pentatonic
const MAX_KEYS = [261.63, 329.63, 392.0, 493.88, 587.33, 659.25];  // C major run

export function buildArrivalSchedule(spec: ArrivalSpec): CeremonyEvent[] {
    const elapsed = spec.elapsedMs / 1000;
    const rel = (absS: number) => absS - elapsed;
    const keep = (absS: number) => absS - elapsed >= 0.02;
    const letterAt = (i: number) => spec.first + i * spec.stagger;
    const liftAt = spec.liftMs / 1000;
    const events: CeremonyEvent[] = [];

    // The whole ceremony already passed (late arrival) → nothing to sing.
    if (!keep(liftAt)) return events;

    // A paper sweep just before the first letter (classic only).
    if (spec.variant === 'classic') {
        const sweepAt = Math.max(0.05, spec.first - 0.35);
        if (keep(sweepAt)) {
            events.push({ t: rel(sweepAt), kind: 'sweep', noise: { freq: 520, dur: 0.3, peak: 0.035, type: 'lowpass' } });
        }
    }

    // One voice per letter (spaces breathe — no sound under the gap).
    for (let i = 0; i < spec.word.length; i++) {
        if (spec.word[i] === ' ') continue;
        if (!keep(letterAt(i))) continue;
        const t = rel(letterAt(i));
        if (spec.variant === 'classic') {
            events.push({ t, kind: 'tick', noise: { freq: 1900, dur: 0.028, peak: i >= spec.accent ? 0.032 : 0.026, q: 1.2, type: 'bandpass' } });
        } else if (spec.variant === 'pro') {
            events.push({ t, kind: 'note', freqs: [PRO_PLUCKS[i % PRO_PLUCKS.length]], dur: 0.8, peak: i % 2 ? 0.045 : 0.062, type: 'triangle', detune: 4 });
        } else {
            events.push({ t, kind: 'note', freqs: [MAX_KEYS[i % MAX_KEYS.length]], dur: 1.05, peak: i % 2 ? 0.048 : 0.06, type: 'sine' });
        }
    }

    // The edition tail lands — each skin marks it its own way.
    const accentAt = letterAt(spec.accent);
    if (keep(accentAt)) {
        const t = rel(accentAt);
        if (spec.variant === 'classic') {
            events.push({ t, kind: 'accent', freqs: [1046.5, 2093.01], dur: 2.4, peak: 0.055, type: 'sine', detune: 3 });   // brass desk bell
        } else if (spec.variant === 'pro') {
            events.push({ t, kind: 'accent', freqs: [146.83], dur: 1.8, peak: 0.05, type: 'sine', attack: 0.5 });          // amber swell under the +
        } else {
            events.push({ t, kind: 'accent', freqs: [440, 587.33], dur: 0.4, peak: 0.065, type: 'triangle', detune: 8 });  // red-pen stab
        }
    }

    // The curtain lifts — a warm resolve in the skin's key.
    events.push({
        t: rel(liftAt), kind: 'chord', stagger: 0.07, dur: 1.6, peak: 0.05, type: 'sine',
        freqs: spec.variant === 'classic' ? [196, 293.66, 493.88]
             : spec.variant === 'pro' ? [293.66, 349.23, 440, 587.33]
             : [261.63, 329.63, 392, 523.25],
    });

    return events.sort((a, b) => a.t - b.t);
}

/* === The synth (browser only) ========================================== */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

interface AudioRig { ac: AudioContext; master: GainNode }

function rig(): AudioRig | null {
    if (typeof window === 'undefined') return null;
    try {
        if (!ctx) {
            const AC = window.AudioContext || (window as any).webkitAudioContext;
            if (!AC) return null;
            ctx = new AC();
            master = ctx.createGain();
            master.gain.value = 0.6;
            master.connect(ctx.destination);
        }
        if (ctx.state === 'suspended') void ctx.resume();
        if (ctx.state !== 'running') return null; // autoplay-blocked → silent pass
        return { ac: ctx, master: master as GainNode };
    } catch {
        return null;
    }
}

function motionQuiet(): boolean {
    try {
        return typeof window !== 'undefined' && !!window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
        return false;
    }
}

function tone(A: AudioRig, freq: number, t: number, dur: number, peak: number, type: OscillatorType, attack: number, detune: number) {
    const o = A.ac.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const g = A.ac.createGain();
    const atk = Math.min(Math.max(attack, 0.004), dur * 0.4);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(A.master);
    o.start(t);
    o.stop(t + dur + 0.1);
}

function noiseBurst(A: AudioRig, t: number, dur: number, peak: number, freq: number, q: number, type: BiquadFilterType) {
    const len = Math.max(1, Math.floor(A.ac.sampleRate * dur));
    const buf = A.ac.createBuffer(1, len, A.ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = A.ac.createBufferSource();
    src.buffer = buf;
    const f = A.ac.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = A.ac.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(A.master);
    src.start(t);
}

/** The arrival theme — schedule + play, all guards inside. */
export function playArrival(spec: ArrivalSpec): void {
    if (!readAudioEnabled() || motionQuiet()) return;
    const A = rig();
    if (!A) return;
    const t0 = A.ac.currentTime + 0.02;
    for (const ev of buildArrivalSchedule(spec)) {
        if (ev.noise) {
            noiseBurst(A, t0 + ev.t, ev.noise.dur, ev.noise.peak, ev.noise.freq, ev.noise.q ?? 1, (ev.noise.type as BiquadFilterType) ?? 'bandpass');
        } else if (ev.freqs) {
            const stag = ev.stagger ?? 0;
            for (let j = 0; j < ev.freqs.length; j++) {
                // lead voice full, harmonic pairs taper, chords breathe at 0.8
                const peak = (ev.peak ?? 0.05) * (j === 0 ? 1 : ev.freqs.length > 2 ? 0.8 : 0.4);
                tone(A, ev.freqs[j], t0 + ev.t + j * stag, ev.dur ?? 0.8, peak, (ev.type as OscillatorType) ?? 'sine', ev.attack ?? 0.012, ev.detune ?? 0);
            }
        }
    }
}

// Departure keys — a two-note pre-echo of the destination's voice.
const DEPARTURE_KEYS: Record<string, [number, number]> = {
    classic: [392.0, 587.33], // G → D — the paper room
    pro: [293.66, 440.0],     // D → A — the cognac desk
    max: [261.63, 392.0],     // C → G — the editorial hall
};

/** The departure chime — plays inside the click gesture. */
export function playDeparture(dest: string | null | undefined): void {
    if (!readAudioEnabled() || motionQuiet()) return;
    const A = rig();
    if (!A) return;
    const keys = DEPARTURE_KEYS[dest ?? 'classic'] ?? DEPARTURE_KEYS.classic;
    const t0 = A.ac.currentTime + 0.02;
    noiseBurst(A, t0, 0.16, 0.02, 1400, 0.7, 'highpass'); // the page flick
    tone(A, keys[0], t0 + 0.02, 0.45, 0.048, 'sine', 0.008, 0);
    tone(A, keys[1], t0 + 0.13, 0.55, 0.04, 'sine', 0.008, 0);
}