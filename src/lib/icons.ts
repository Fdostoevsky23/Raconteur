// src/lib/icons.ts — client-side icon strings (de-vibe DR1).
// For JS-injected UI: notification glyphs, dynamic buttons, avatars.
import { iconPaths } from './iconPaths';

export function iconSvg(name: string, size = 16, stroke = 1.8): string {
    const d = iconPaths[name] || iconPaths.sparkle;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}
