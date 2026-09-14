// skin.ts — the Raconteur skin switchboard (THREE skins).
// Raconteur Classic lives at /* routes; Raconteur+ at /pro/*; Raconteur Pro at /max/*.
// All skins render the same data — only the presentation differs.
// (The fourth skin — the original Raconteur+ at /plus/* — lost the bake-off
// and was removed at the boss's order, 2026-09-14.)

/** Pro paths (the Raconteur+ edition): /pro/** (the Reader's Desk). */
export function isProPath(pathname: string): boolean {
    return pathname === '/pro' || pathname === '/pro/' || pathname.startsWith('/pro/');
}

/** Max paths (the Raconteur Pro edition): /max/** (the Editorial Split). */
export function isMaxPath(pathname: string): boolean {
    return pathname === '/max' || pathname === '/max/' || pathname.startsWith('/max/');
}

/** Map any classic path to its max counterpart: '/' → '/max', '/story/x' → '/max/story/x' */
export function toMaxPath(pathname: string): string {
    if (isMaxPath(pathname)) return pathname; // already max
    if (isProPath(pathname)) return pathname.replace(/^\/pro/, '/max');
    if (pathname === '/' || pathname === '') return '/max';
    return `/max${pathname}`;
}

/** Home pages of all skins — the ONLY pages where the skin switch lives
 *  (per boss, Session 16: the toggle must not appear on inner pages). */
export function isHomePath(pathname: string): boolean {
    return pathname === '/' || pathname === ''
        || pathname === '/pro' || pathname === '/pro/'
        || pathname === '/max' || pathname === '/max/';
}

/** Map any path to its pro counterpart — Raconteur+ now lives at /pro:
 *  '/' → '/pro', '/max/story/x' → '/pro/story/x' */
export function toProPath(pathname: string): string {
    if (isProPath(pathname)) return pathname; // already pro
    if (isMaxPath(pathname)) return pathname.replace(/^\/max/, '/pro');
    if (pathname === '/' || pathname === '') return '/pro';
    return `/pro${pathname}`;
}

/** Map any pro/max path to its classic counterpart: '/pro' → '/', '/max/story/x' → '/story/x' */
export function toClassicPath(pathname: string): string {
    if (!isProPath(pathname) && !isMaxPath(pathname)) return pathname; // already classic
    if (pathname === '/pro' || pathname === '/pro/' || pathname === '/max' || pathname === '/max/') return '/';
    if (isMaxPath(pathname)) return pathname.replace(/^\/max/, '');
    return pathname.replace(/^\/pro/, '');
}
