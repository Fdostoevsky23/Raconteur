// skin.ts — Raconteur / Raconteur+ dual-skin path mapping.
// The classic skin lives at /* routes; the plus skin lives at /plus/*.
// Both skins render the same data — only the presentation differs.

export function isPlusPath(pathname: string): boolean {
    return pathname === '/plus' || pathname.startsWith('/plus/');
}

/** Map any classic path to its plus counterpart: '/' → '/plus', '/story/x' → '/plus/story/x' */
export function toPlusPath(pathname: string): string {
    if (isPlusPath(pathname)) return pathname; // already plus
    if (pathname === '/' || pathname === '') return '/plus';
    return `/plus${pathname}`;
}

/** Map any plus path to its classic counterpart: '/plus' → '/', '/plus/story/x' → '/story/x' */
export function toClassicPath(pathname: string): string {
    if (!isPlusPath(pathname)) return pathname; // already classic
    if (pathname === '/plus' || pathname === '/plus/') return '/';
    return pathname.replace(/^\/plus/, '');
}
