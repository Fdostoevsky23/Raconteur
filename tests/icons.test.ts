// tests/icons.test.ts — CHARACTERISATION tests for the client icon kit (de-vibe DR1).
// Locks the documented icon contract: the full name set that exists today,
// the inline-SVG shape (stroke, currentColor, viewBox), and the sparkle
// fallback for unknown names.
import { describe, it, expect } from 'vitest';
import { iconSvg } from '../src/lib/icons';
import { iconPaths } from '../src/lib/iconPaths';

// The set that exists today (verified against src/lib/iconPaths.ts).
const REQUIRED = [
    'bell', 'user', 'heart', 'comment', 'reply', 'mail', 'edit', 'download',
    'trash', 'search', 'close', 'check', 'bookmark', 'share', 'link', 'book',
    'collection', 'feather', 'sparkle', 'settings', 'logout', 'type', 'sun',
    'moon', 'sent', 'plus', 'eye', 'clock', 'message', 'flag', 'camera',
    'refresh', 'home',
] as const;

describe('iconPaths — the icon contract', () => {
    it('ships every name the skins rely on', () => {
        for (const name of REQUIRED) {
            expect(iconPaths[name], `missing icon: ${name}`).toBeTruthy();
        }
    });
});

describe('iconSvg — the inline renderer', () => {
    it('renders a stroke-based inline SVG with size + stroke interpolated', () => {
        const svg = iconSvg('bell', 20, 2);
        expect(svg).toContain('<svg');
        expect(svg).toContain('width="20"');
        expect(svg).toContain('height="20"');
        expect(svg).toContain('viewBox="0 0 24 24"');
        expect(svg).toContain('stroke="currentColor"');
        expect(svg).toContain('stroke-width="2"');
        expect(svg).toContain('stroke-linecap="round"');
        expect(svg).toContain('aria-hidden="true"');
        expect(svg).toContain(iconPaths.bell);
    });

    it('defaults to size 16 / stroke 1.8', () => {
        const svg = iconSvg('heart');
        expect(svg).toContain('width="16"');
        expect(svg).toContain('stroke-width="1.8"');
    });

    it('falls back to the sparkle glyph for unknown names (no throw)', () => {
        const svg = iconSvg('definitely-not-a-real-icon');
        expect(svg).toContain(iconPaths.sparkle);
    });
});
