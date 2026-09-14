// tests/devibe-greps.test.ts — the EXECUTABLE canonical test (§1c/§1d).
// The boss's de-vibe doc says the most reliable vibe-coding tell is the
// absence of tests — so the doc-pass the skins have been passing manually at
// every seal (log rows 53, 62) now runs as code. These greps are CALIBRATED
// against the current tree (all currently green); if a new build trips one,
// either the code is wrong or the allowlist needs a conscious, documented edit.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');

function walk(dir: string, exts: string[]): string[] {
    const out: string[] = [];
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        const st = statSync(p);
        if (st.isDirectory()) out.push(...walk(p, exts));
        else if (exts.includes(extname(p))) out.push(p);
    }
    return out;
}

const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

// New-skin chrome (the seal scope): the three layouts + the three skin stylesheets.
const CHROME = [
    'src/layouts/MaxLayout.astro',
    'src/layouts/PlusLayout.astro',
    'src/layouts/ProLayout.astro',
    'src/styles/max.css',
    'src/styles/plus.css',
    'src/styles/pro.css',
];

// Strip // line comments (but keep https:// and protocol-relative //) so that
// prose in comments never trips the call-site greps.
const stripLineComments = (s: string) => s.replace(/(^|[^:"'`])\/\/(?!\/).*$/gm, '$1');

// Common emoji/pictograph blocks. Deliberate typographic glyphs in use today
// (← U+2190, → U+2192, ✦ U+2726 in content) live OUTSIDE these ranges.
const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;

describe('§1c executable doc-pass — the tells the seals check by hand', () => {
    it('new-skin chrome carries zero emoji/pictograph glyphs', () => {
        const hits: string[] = [];
        for (const f of CHROME) {
            const lines = read(f).split('\n');
            lines.forEach((line, i) => {
                const m = line.match(EMOJI_RE);
                if (m) hits.push(`${f}:${i + 1} ${m[0]} (U+${m[0].codePointAt(0)!.toString(16).toUpperCase()})`);
            });
        }
        expect(hits, hits.join('\n')).toEqual([]);
    });

    it('new-skin chrome names no Inter (the DR3 de-tell)', () => {
        const hits = CHROME.filter(f => /\bInter\b/.test(read(f)));
        expect(hits, hits.join(', ')).toEqual([]);
    });

    it('all of src is free of TODO / FIXME / lorem', () => {
        const files = walk(SRC, ['.astro', '.ts', '.css']);
        const hits: string[] = [];
        for (const f of files) {
            const lines = readFileSync(f, 'utf8').split('\n');
            lines.forEach((line, i) => {
                if (/\bTODO\b|\bFIXME\b|\blorem\b/i.test(line)) hits.push(`${f}:${i + 1}`);
            });
        }
        expect(hits, hits.join('\n')).toEqual([]);
    });

    it('src/lib logs nothing to the console', () => {
        const files = walk(join(SRC, 'lib'), ['.ts']);
        const hits: string[] = [];
        for (const f of files) {
            const lines = readFileSync(f, 'utf8').split('\n');
            lines.forEach((line, i) => {
                if (/console\./.test(line)) hits.push(`${f}:${i + 1}`);
            });
        }
        expect(hits, hits.join('\n')).toEqual([]);
    });

    it('new skins + lib call no native alert/confirm/prompt (dialog.ts is the only door)', () => {
        const files = [
            ...CHROME.slice(0, 3),
            ...walk(join(SRC, 'pages', 'max'), ['.astro']),
            ...walk(join(SRC, 'pages', 'plus'), ['.astro']),
            ...walk(join(SRC, 'pages', 'pro'), ['.astro']),
            ...walk(join(SRC, 'lib'), ['.ts']),
        ];
        const CALL_RE = /(?<![.\w$])(alert|confirm|prompt)\s*\(/;
        const hits: string[] = [];
        for (const f of files) {
            const lines = stripLineComments(readFileSync(f, 'utf8')).split('\n');
            lines.forEach((line, i) => {
                const m = line.match(CALL_RE);
                if (m) hits.push(`${f}:${i + 1} → ${m[1]}()`);
            });
        }
        expect(hits, hits.join('\n')).toEqual([]);
    });

    it('.env is git-ignored (the secrets guard from the doc §10.1)', () => {
        const gitignore = read('.gitignore');
        expect(gitignore).toMatch(/^\.env$/m);
    });
});
