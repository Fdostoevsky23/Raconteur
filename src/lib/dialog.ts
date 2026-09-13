// src/lib/dialog.ts — skin-aware confirm dialogs + toasts (de-vibe DR2).
// Replaces every native alert()/confirm() in the new skins. Zero dependencies.
// Styling adapts to the active skin via body class (max-skin / plus-skin / pro-skin).

let styled = false;

function ensureStyles() {
    if (styled || typeof document === 'undefined') return;
    styled = true;
    const css = `
.dv-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:2rem;
  background:rgba(28,25,23,.42);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
  animation:dv-in .22s cubic-bezier(.22,1,.36,1)}
.dv-overlay[hidden]{display:none}
.dv-card{position:relative;max-width:420px;width:100%;padding:1.8rem 1.9rem 1.5rem;border-radius:8px;
  background:#faf5ea;color:#2e2a22;border:1px solid #ddd2bb;box-shadow:0 20px 60px rgba(0,0,0,.45);
  font-family:var(--mx-font-body,'Segoe UI',system-ui,sans-serif);
  animation:dv-pop .28s cubic-bezier(.22,1,.36,1)}
/* classic default buttons (warm cream + sage) */
.dv-btn-danger{background:#a85a32;color:#f4ede0}
.dv-btn-primary{background:#3d5a3c;color:#f4ede0}
.dv-title{font-family:var(--mx-font-display,Georgia,serif);font-weight:900;font-size:1.2rem;margin:0 0 .5rem}
.dv-body{font-size:.9rem;line-height:1.6;margin:0 0 1.4rem;opacity:.85}
.dv-actions{display:flex;gap:.6rem;justify-content:flex-end}
.dv-btn{padding:.55rem 1.15rem;border-radius:999px;border:1px solid transparent;font:inherit;font-size:.85rem;
  font-weight:600;cursor:pointer;transition:transform .2s,opacity .2s}
.dv-btn:hover{transform:translateY(-1px)}
.dv-btn-ghost{background:transparent;border-color:currentColor;opacity:.7}
.dv-btn-ghost:hover{opacity:1}
.dv-btn-danger{background:#b3261e;color:#fff}
body.max-skin .dv-btn-danger,body.plus-skin .dv-btn-danger,body.pro-skin .dv-btn-danger{background:#b3261e;color:#fff}
body.plus-skin .dv-btn-primary{background:#c9a24b;color:#141317}
body.pro-skin .dv-btn-primary{background:#ff6a00;color:#0b0d10}
body.max-skin .dv-btn-primary{background:#1c1917;color:#faf6ef}
/* skin surfaces */
body.max-skin .dv-card{background:rgba(255,253,249,.92);color:#1c1917;border:1px solid rgba(255,255,255,.65);
  box-shadow:0 24px 70px rgba(84,62,40,.25);backdrop-filter:blur(18px) saturate(1.25);-webkit-backdrop-filter:blur(18px) saturate(1.25)}
body.plus-skin .dv-card{background:rgba(22,22,27,.94);color:#f2eee3;border:1px solid rgba(201,162,75,.35);
  box-shadow:0 24px 70px rgba(0,0,0,.55);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
body.pro-skin .dv-card{background:rgba(13,16,20,.94);color:#e9eef2;border:1px solid rgba(255,255,255,.14);
  box-shadow:0 24px 70px rgba(0,0,0,.6);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
/* toast */
.dv-toast{position:fixed;left:50%;bottom:1.6rem;transform:translateX(-50%);z-index:2147483600;
  padding:.7rem 1.3rem;border-radius:999px;font-family:var(--mx-font-body,'Segoe UI',system-ui,sans-serif);
  font-size:.85rem;font-weight:500;display:flex;align-items:center;gap:.55rem;
  background:#2e2a22;color:#f4ede0;box-shadow:0 12px 34px rgba(0,0,0,.4);
  animation:dv-toast-in .3s cubic-bezier(.22,1,.36,1)}
.dv-toast.out{animation:dv-toast-out .3s forwards}
body.max-skin .dv-toast{background:#1c1917;color:#faf6ef;box-shadow:0 12px 34px rgba(28,25,23,.35)}
body.plus-skin .dv-toast,body.pro-skin .dv-toast{background:#f2eee3;color:#141317;box-shadow:0 12px 34px rgba(0,0,0,.5)}
.dv-toast.err{background:#b3261e !important;color:#fff !important}
@keyframes dv-in{from{opacity:0}}
@keyframes dv-pop{from{opacity:0;transform:translateY(14px) scale(.97)}}
@keyframes dv-toast-in{from{opacity:0;transform:translate(-50%,10px)}}
@keyframes dv-toast-out{to{opacity:0;transform:translate(-50%,10px)}}
@media (prefers-reduced-motion:reduce){.dv-overlay,.dv-card,.dv-toast{animation:none}}
`;
    const el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
}

export function dvConfirm(opts: {
    title: string;
    body?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
}): Promise<boolean> {
    if (typeof document === 'undefined') return Promise.resolve(false);
    ensureStyles();
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'dv-overlay';
        overlay.innerHTML = `
            <div class="dv-card" role="dialog" aria-modal="true" aria-label="${opts.title}">
                <h3 class="dv-title">${opts.title}</h3>
                ${opts.body ? `<p class="dv-body">${opts.body}</p>` : ''}
                <div class="dv-actions">
                    <button type="button" class="dv-btn dv-btn-ghost" data-dv="cancel">${opts.cancelLabel || 'Cancel'}</button>
                    <button type="button" class="dv-btn ${opts.danger ? 'dv-btn-danger' : 'dv-btn-primary'}" data-dv="ok">${opts.confirmLabel || 'Confirm'}</button>
                </div>
            </div>`;
        const done = (v: boolean) => {
            overlay.remove();
            document.removeEventListener('keydown', onKey);
            resolve(v);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') done(false); };
        overlay.addEventListener('click', (e) => {
            const t = (e.target as HTMLElement).closest('[data-dv]');
            if (t) done((t as HTMLElement).dataset.dv === 'ok');
            else if (e.target === overlay) done(false);
        });
        document.addEventListener('keydown', onKey);
        document.body.appendChild(overlay);
        (overlay.querySelector('[data-dv="ok"]') as HTMLElement)?.focus();
    });
}

export function dvToast(message: string, kind: 'info' | 'err' = 'info', ms = 3400): void {
    if (typeof document === 'undefined') return;
    ensureStyles();
    const t = document.createElement('div');
    t.className = `dv-toast ${kind === 'err' ? 'err' : ''}`;
    t.setAttribute('role', 'status');
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => {
        t.classList.add('out');
        setTimeout(() => t.remove(), 320);
    }, ms);
}
