import { h } from './dom';
import { SettingsStore } from '../core/store';
import { toast } from './toast';
import { persistState } from '../services/settingsService';
import { legacy } from '../adapter/legacyBridge';

export interface TopbarOptions {
  store: SettingsStore;
  onOpenPalette: () => void;
  onOpenHistory: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

function detectEnvironment(): 'Development' | 'Production' {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host.includes('-git-') || host.includes('preview')
    ? 'Development' : 'Production';
}

function exportJson(store: SettingsStore): void {
  const blob = new Blob([JSON.stringify(store.getState(), null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'settings-center-export.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

function importJson(store: SettingsStore, onDone: () => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        for (const [key, values] of Object.entries(parsed.values ?? {})) {
          store.setSectionValues(key, values as Record<string, unknown>, { pushHistory: false });
        }
        persistState(store.getState(), { immediate: true });
        toast('تم استيراد الإعدادات', 'success');
        onDone();
      } catch {
        toast('ملف غير صالح', 'warning');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

export function renderTopbar(opts: TopbarOptions): HTMLElement {
  const { store } = opts;
  const env = detectEnvironment();

  const lastUpdated = h('span', { class: 'cc-topbar-meta' });
  const renderMeta = () => {
    const history = store.getState().history;
    const last = history[history.length - 1];
    lastUpdated.textContent = last ? `آخر تحديث: ${new Date(last.at).toLocaleTimeString()}` : 'لا توجد تعديلات بعد';
  };
  renderMeta();
  store.subscribe(renderMeta);

  return h('header', { class: 'cc-topbar' }, [
    h('div', { class: 'cc-topbar-left' }, [
      h('div', { class: 'cc-topbar-title' }, [
        h('i', { class: 'fas fa-gear' }),
        h('span', {}, ['مركز الإعدادات']),
      ]),
      // Icon-only — the host app already shows a full search pill with the same
      // Ctrl+K hint in its own header; a second full-width pill right under it
      // reads as a duplicated/overlapping search bar, so this stays compact.
      h('button', { class: 'cc-topbar-btn', type: 'button', title: 'ابحث في كل الإعدادات (⌘K)', onclick: opts.onOpenPalette }, [h('i', { class: 'fas fa-magnifying-glass' })]),
    ]),
    h('div', { class: 'cc-topbar-right' }, [
      h('span', { class: `cc-env-badge cc-env-badge--${env.toLowerCase()}` }, [env]),
      h('span', { class: 'cc-save-pill' }, [h('i', { class: 'fas fa-circle-check' }), ' Auto Saved']),
      lastUpdated,
      h('span', { class: 'cc-topbar-divider' }),
      h('button', { class: 'cc-topbar-btn', type: 'button', title: 'تراجع', onclick: opts.onUndo }, [h('i', { class: 'fas fa-rotate-left' })]),
      h('button', { class: 'cc-topbar-btn', type: 'button', title: 'إعادة', onclick: opts.onRedo }, [h('i', { class: 'fas fa-rotate-right' })]),
      h('button', { class: 'cc-topbar-btn', type: 'button', title: 'سجل التغييرات', onclick: opts.onOpenHistory }, [h('i', { class: 'fas fa-clock-rotate-left' })]),
      h('span', { class: 'cc-topbar-divider' }),
      h('button', { class: 'cc-topbar-btn', type: 'button', title: 'تصدير', onclick: () => exportJson(store) }, [h('i', { class: 'fas fa-download' })]),
      h('button', { class: 'cc-topbar-btn', type: 'button', title: 'استيراد', onclick: () => importJson(store, () => location.reload()) }, [h('i', { class: 'fas fa-upload' })]),
      h('button', {
        class: 'cc-topbar-btn cc-topbar-btn--ai', type: 'button', title: 'مساعد الإعدادات الذكي',
        onclick: () => legacy.settingsModule().openAIAssistant(),
      }, [h('i', { class: 'fas fa-wand-magic-sparkles' })]),
    ]),
  ]);
}
