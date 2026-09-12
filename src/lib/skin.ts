// skin.ts — Raconteur / Raconteur+ / Raconteur Pro multi-skin path mapping.
// The classic skin lives at /* routes; plus at /plus/*, pro at /pro/*.
// All skins render the same data — only the presentation differs.

export function isPlusPath(pathname: string): boolean {
    return pathname === '/plus' || pathname.startsWith('/plus/');
}

/** Pro skin paths: /pro/** (the bento-glass "Reader's Desk" skin). */
export function isProPath(pathname: string): boolean {
    return pathname === '/pro' || pathname === '/pro/' || pathname.startsWith('/pro/');
}

/** Map any classic path to its pro counterpart: '/' → '/pro', '/story/x' → '/pro/story/x' */
export function toProPath(pathname: string): string {
    if (isProPath(pathname)) return pathname; // already pro
    if (isPlusPath(pathname)) return pathname.replace(/^\/plus/, '/pro');
    if (pathname === '/' || pathname === '') return '/pro';
    return `/pro${pathname}`;
}

/** Home pages of both skins — the ONLY pages where the skin switch lives
 *  (per boss, Session 16: the toggle must not appear on inner pages).
 *  '/' is the classic home, '/plus' is the plus home. */
export function isHomePath(pathname: string): boolean {
    return pathname === '/' || pathname === '' || pathname === '/plus' || pathname === '/plus/' || pathname === '/pro' || pathname === '/pro/';
}

/** Map any classic path to its plus counterpart: '/' → '/plus', '/pro/story/x' → '/plus/story/x' */
export function toPlusPath(pathname: string): string {
    if (isPlusPath(pathname)) return pathname; // already plus
    if (isProPath(pathname)) {
        const p = pathname.replace(/^\/pro/, '');
        return (p === '' || p === '/') ? '/plus' : '/plus' + p;
    }
    if (pathname === '/' || pathname === '') return '/plus';
    return `/plus${pathname}`;
}

/** Map any plus/pro path to its classic counterpart: '/plus' → '/', '/pro/story/x' → '/story/x' */
export function toClassicPath(pathname: string): string {
    if (!isPlusPath(pathname) && !isProPath(pathname)) return pathname; // already classic
    if (pathname === '/plus' || pathname === '/plus/' || pathname === '/pro' || pathname === '/pro/') return '/';
    if (isProPath(pathname)) return pathname.replace(/^\/pro/, '');
    return pathname.replace(/^\/plus/, '');
}
