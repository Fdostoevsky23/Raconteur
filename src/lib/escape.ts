// src/lib/escape.ts — shared HTML escaping helpers
// Use these EVERY time user-controlled text (titles, names, comments, notes,
// messages, URLs from the database) is interpolated into an innerHTML string.
// Escaping here is what prevents stored XSS.

/** Escape a value for safe interpolation into HTML text OR double-quoted attributes. */
export function esc(value: unknown): string {
	return String(value ?? '').replace(/[&<>"']/g, (c) => (
		{ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
	));
}
