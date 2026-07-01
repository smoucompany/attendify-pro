type AV = Record<string, unknown>;

function hex(h: string, offset: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  const r = clamp(parseInt(h.slice(1, 3), 16) + offset);
  const g = clamp(parseInt(h.slice(3, 5), 16) + offset);
  const b = clamp(parseInt(h.slice(5, 7), 16) + offset);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function rgba(h: string, a: number): string {
  if (!h.startsWith('#') || h.length < 7) return h;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function applyAppearance(v: AV): void {
  const root = document.documentElement;

  /* ── Theme ── */
  const theme = String(v.theme ?? 'dark');
  if (theme === 'auto') {
    const dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }

  /* ── Primary color ── */
  const primary = /^#[0-9a-fA-F]{6}$/.test(String(v.primaryColor ?? '')) ? String(v.primaryColor) : '#6366f1';
  root.style.setProperty('--primary',       primary);
  root.style.setProperty('--primary-dark',  hex(primary, -40));
  root.style.setProperty('--primary-light', hex(primary, +50));
  root.style.setProperty('--primary-bg',    rgba(primary, 0.1));
  root.style.setProperty('--shadow-primary', `0 8px 24px ${rgba(primary, 0.3)}`);

  /* ── Accent / Success color ── */
  const accent = /^#[0-9a-fA-F]{6}$/.test(String(v.accentColor ?? '')) ? String(v.accentColor) : '#10b981';
  root.style.setProperty('--accent',      accent);
  root.style.setProperty('--success',     accent);
  root.style.setProperty('--accent-bg',   rgba(accent, 0.1));
  root.style.setProperty('--success-bg',  rgba(accent, 0.12));

  /* ── Border radius ── */
  const r = Math.max(0, Math.min(32, Number(v.radius ?? 12)));
  root.style.setProperty('--radius-sm', `${Math.round(r * 0.55)}px`);
  root.style.setProperty('--radius',    `${r}px`);
  root.style.setProperty('--radius-lg', `${Math.round(r * 1.4)}px`);
  root.style.setProperty('--radius-xl', `${Math.round(r * 2)}px`);
  root.style.setProperty('--cc-radius',    `${r}px`);
  root.style.setProperty('--cc-radius-sm', `${Math.round(r * 0.55)}px`);

  /* ── Animations ── */
  const anim = Boolean(v.animations ?? true);
  if (!anim) {
    root.style.setProperty('--transition',        'none');
    root.style.setProperty('--transition-slow',   'none');
    root.style.setProperty('--transition-bounce', 'none');
    root.setAttribute('data-no-animations', '');
  } else {
    root.style.removeProperty('--transition');
    root.style.removeProperty('--transition-slow');
    root.style.removeProperty('--transition-bounce');
    root.removeAttribute('data-no-animations');
  }

  /* ── Compact mode ── */
  Boolean(v.compactMode)
    ? root.setAttribute('data-compact', '')
    : root.removeAttribute('data-compact');

  /* ── Glass effect ── */
  Boolean(v.glassEffect ?? true)
    ? root.removeAttribute('data-no-glass')
    : root.setAttribute('data-no-glass', '');
}

/** Called from app.js on startup to apply saved appearance before the SPA mounts */
export function applyFromDB(): void {
  try {
    const values = (window as any).DB?.company?.settingsCenter?.values?.appearance as AV | undefined ?? {};
    applyAppearance(values);
  } catch {/* not yet initialized */}
}
