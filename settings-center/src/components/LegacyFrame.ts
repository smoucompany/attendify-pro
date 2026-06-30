import { h } from './dom';
import { panelHeader } from './Card';
import { onLegacyRerender } from '../adapter/legacyBridge';
import type { CategoryMeta } from '../core/types';

export interface MountedPanel {
  element: HTMLElement;
  dispose: () => void;
}

/**
 * Wraps a legacy HTML-returning function (e.g. SettingsModule._company()) in the
 * new card chrome, and keeps it live across legacy-internal re-renders
 * (the legacy code calls `_renderSection()` after every save, which now
 * dispatches `sc:legacy-rerender` instead of touching the old shell).
 */
export function mountLegacyHtml(meta: CategoryMeta, getHtml: () => string): MountedPanel {
  const body = h('div', { class: 'cc-legacy-body' });
  body.innerHTML = getHtml();

  const refresh = () => {
    body.innerHTML = getHtml();
  };
  const off = onLegacyRerender(refresh);

  const element = h('div', { class: 'cc-panel' }, [
    panelHeader({ icon: meta.icon, title: meta.title, description: meta.description, color: meta.color }),
    h('div', { class: 'cc-card cc-legacy-frame' }, [body]),
  ]);

  return { element, dispose: off };
}

/** Wraps a legacy module that owns its own .render(container) (RolesModule, BackupModule). */
export function mountLegacyModule(meta: CategoryMeta, mod: { render: (container: HTMLElement) => void } | undefined): MountedPanel {
  const body = h('div', { class: 'cc-legacy-body' });
  if (mod) mod.render(body);
  else body.innerHTML = '<div class="cc-empty"><p>هذه الوحدة غير متاحة حالياً.</p></div>';

  const element = h('div', { class: 'cc-panel' }, [
    panelHeader({ icon: meta.icon, title: meta.title, description: meta.description, color: meta.color }),
    h('div', { class: 'cc-card cc-legacy-frame' }, [body]),
  ]);

  return { element, dispose: () => {} };
}
