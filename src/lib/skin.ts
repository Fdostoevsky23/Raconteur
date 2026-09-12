// skin.ts — Raconteur / Raconteur+ / Raconteur Pro / Raconteur Max multi-skin path mapping.
// The classic skin lives at /* routes; plus at /plus/*, pro at /pro/*, max at /max/*.
// All skins render the same data — only the presentation differs.
// Boss vision (Session 19): each skin tries a different design/layout/UI
// while features stay classic-parity; features port to all skins later.

export function isPlusPath(pathname: string): boolean {
    return pathname === '/plus' || pathname.startsWith('/plus/');
}

/** Pro skin paths: /pro/** (the bento-glass "Reader's Desk" skin). */
export function isProPath(pathname: string): boolean {
    return pathname === '/pro' || pathname === '/pro/' || pathname.startsWith('/pro/');
}

/** Max skin paths: /max/** (the editorial-split home + bright-glass inner skin). */
export function isMaxPath(pathname: string): boolean {
    return pathname === '/max' || pathname === '/max/' || pathname.startsWith('/max/');
}

/** Map any classic path to its max counterpart: '/' → '/max', '/story/x' → '/max/story/x' */
export function toMaxPath(pathname: string): string {
    if (isMaxPath(pathname)) return pathname; // already max
    if (isPlusPath(pathname)) return pathname.replace(/^\/plus/, '/max');
    if (isProPath(pathname)) return pathname.replace(/^\/pro/, '/max');
    if (pathname === '/' || pathname === '') return '/max';
    return `/max${pathname}`;
}

/** Home pages of all skins — the ONLY pages where the skin switch lives
 *  (per boss, Session 16: the toggle must not appear on inner pages). */
export function isHomePath(pathname: string): boolean {
    return pathname === '/' || pathname === ''
        || pathname === '/plus' || pathname === '/plus/'
        || pathname === '/pro' || pathname === '/pro/'
        || pathname === '/max' || pathname === '/max/';
}

/** Map any classic path to its plus counterpart: '/' → '/plus', '/max/story/x' → '/plus/story/x' */
export function toPlusPath(pathname: string): string {
    if (isPlusPath(pathname)) return pathname; // already plus
    if (isProPath(pathname)) {
        const p = pathname.replace(/^\/pro/, '');
        return (p === '' || p === '/') ? '/plus' : '/plus' + p;
    }
    if (isMaxPath(pathname)) {
        const p = pathname.replace(/^\/max/, '');
        return (p === '' || p === '/') ? '/plus' : '/plus' + p;
    }
    if (pathname === '/' || pathname === '') return '/plus';
    return `/plus${pathname}`;
}

/** Map any classic path to its pro counterpart: '/' → '/pro', '/max/story/x' → '/pro/story/x' */
export function toProPath(pathname: string): string {
    if (isProPath(pathname)) return pathname; // already pro
    if (isPlusPath(pathname)) return pathname.replace(/^\/plus/, '/pro');
    if (isMaxPath(pathname)) return pathname.replace(/^\/max/, '/pro');
    if (pathname === '/' || pathname === '') return '/pro';
    return `/pro${pathname}`;
}

/** Map any plus/pro/max path to its classic counterpart: '/plus' → '/', '/max/story/x' → '/story/x' */
export function toClassicPath(pathname: string): string {
    if (!isPlusPath(pathname) && !isProPath(pathname) && !isMaxPath(pathname)) return pathname; // already classic
    if (pathname === '/plus' || pathname === '/plus/' || pathname === '/pro' || pathname === '/pro/' || pathname === '/max' || pathname === '/max/') return '/';
    if (isMaxPath(pathname)) return pathname.replace(/^\/max/, '');
    if (isProPath(pathname)) return pathname.replace(/^\/pro/, '');
    return pathname.replace(/^\/plus/, '');
}
