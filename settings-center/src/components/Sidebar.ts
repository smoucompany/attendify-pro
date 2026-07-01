import { h } from './dom';
import type { CategoryMeta } from '../core/types';
import { CATEGORIES } from '../app/categories';
import { SettingsStore } from '../core/store';
import { persistState } from '../services/settingsService';
import { toast } from './toast';

export interface SidebarOptions {
  store: SettingsStore;
  activeKey: string;
  onSelect: (key: string) => void;
  onOpenPalette: () => void;
  onOpenHistory: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onRebuild: () => void;
}

function exportJson(store: SettingsStore): void {
  const blob = new Blob([JSON.stringify(store.getState(), null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'settings-export.json';
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

function navItem(cat: CategoryMeta, active: boolean, store: SettingsStore, onSelect: (k: string) => void): HTMLElement {
  const isFav = store.isFavorite(cat.key);
  const star = h('button', {
    class: `cc-fav-btn ${isFav ? 'cc-fav-btn--on' : ''}`, type: 'button', title: 'مفضلة',
    onclick: (e: Event) => { e.stopPropagation(); store.toggleFavorite(cat.key); },
  }, [h('i', { class: isFav ? 'fas fa-star' : 'far fa-star' })]);

  const isConfigured = store.getState().history.some((h) => h.sectionKey === cat.key);
  const dot = h('span', { class: `cc-nav-dot ${isConfigured ? 'cc-nav-dot--ok' : ''}` });

  return h('div', {
    class: `cc-nav-item ${active ? 'cc-nav-item--active' : ''}`,
    onclick: () => onSelect(cat.key),
  }, [
    h('div', { class: 'cc-nav-icon', style: `background:${cat.color}` }, [h('i', { class: cat.icon })]),
    h('div', { class: 'cc-nav-label' }, [cat.title]),
    dot,
    star,
  ]);
}

export function renderSidebar(opts: SidebarOptions): HTMLElement {
  const { store, activeKey, onSelect } = opts;

  /* ── save-status pill (reactive) ── */
  const savePill = h('div', { class: 'cc-sb-save' }, [
    h('i', { class: 'fas fa-circle-check' }),
    h('span', {}, [' محفوظ']),
  ]);
  const updateSave = () => {
    const history = store.getState().history;
    const last = history[history.length - 1];
    const timeStr = last ? new Date(last.at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '';
    savePill.title = timeStr ? `آخر حفظ: ${timeStr}` : 'لا توجد تعديلات';
  };
  updateSave();
  store.subscribe(updateSave);

  /* ── progress bar (reactive) ── */
  const progressFill = h('div', { class: 'cc-sidebar-progress-fill', style: 'width:0%' });
  const progressPct  = h('span', { class: 'cc-sidebar-progress-pct' }, ['0%']);
  const updateProgress = () => {
    const total      = CATEGORIES.length;
    const configured = CATEGORIES.filter((c) => store.getState().history.some((h) => h.sectionKey === c.key)).length;
    const pct        = Math.round((configured / total) * 100);
    progressFill.style.width = `${pct}%`;
    progressPct.textContent  = `${pct}%`;
  };
  updateProgress();
  store.subscribe(updateProgress);

  /* ── nav list (reactive) ── */
  let searchTerm = '';
  const list = h('div', { class: 'cc-nav-list' });

  const renderList = () => {
    const term     = searchTerm.trim().toLowerCase();
    const filtered = CATEGORIES.filter((c) => !term || c.title.toLowerCase().includes(term) || c.description.toLowerCase().includes(term));
    const groups: HTMLElement[] = [];
    if (term) groups.push(h('div', { class: 'cc-nav-group-label' }, ['نتائج البحث']));
    groups.push(...filtered.map((c) => navItem(c, c.key === activeKey, store, onSelect)));
    list.replaceChildren(...groups);
  };
  renderList();
  store.subscribe(renderList);

  const searchInput = h('input', { class: 'cc-sidebar-search', placeholder: 'تصفية القائمة...' }) as HTMLInputElement;
  searchInput.addEventListener('input', () => { searchTerm = searchInput.value; renderList(); });

  /* ── env badge ── */
  const host = window.location.hostname;
  const isProd = !(host === 'localhost' || host === '127.0.0.1' || host.includes('preview'));
  const envBadge = h('span', {
    class: `cc-env-badge cc-env-badge--${isProd ? 'production' : 'development'}`,
  }, [isProd ? 'Production' : 'Dev']);

  return h('aside', { class: 'cc-sidebar' }, [
    /* brand */
    h('div', { class: 'cc-sidebar-brand' }, [
      h('div', { class: 'cc-brand-icon' }, [h('i', { class: 'fas fa-gear' })]),
      h('div', { class: 'cc-brand-text' }, [
        h('div', { class: 'cc-brand-name' }, ['Settings Center']),
        h('div', { class: 'cc-brand-sub' }, ['إدارة شاملة للنظام']),
      ]),
      envBadge,
    ]),

    /* action strip */
    h('div', { class: 'cc-sb-actions' }, [
      h('div', { class: 'cc-sb-actions-row' }, [
        h('button', { class: 'cc-sb-btn', type: 'button', title: 'تراجع (Ctrl+Z)', onclick: opts.onUndo },    [h('i', { class: 'fas fa-rotate-left'         })]),
        h('button', { class: 'cc-sb-btn', type: 'button', title: 'إعادة (Ctrl+Y)',  onclick: opts.onRedo },    [h('i', { class: 'fas fa-rotate-right'        })]),
        h('button', { class: 'cc-sb-btn', type: 'button', title: 'سجل التغييرات',  onclick: opts.onOpenHistory }, [h('i', { class: 'fas fa-clock-rotate-left'  })]),
        h('span',   { class: 'cc-sb-divider' }),
        h('button', { class: 'cc-sb-btn', type: 'button', title: 'بحث في الإعدادات (Ctrl+K)', onclick: opts.onOpenPalette }, [h('i', { class: 'fas fa-magnifying-glass' })]),
        h('span',   { class: 'cc-sb-divider' }),
        h('button', { class: 'cc-sb-btn', type: 'button', title: 'تصدير',    onclick: () => exportJson(store) },                         [h('i', { class: 'fas fa-download'             })]),
        h('button', { class: 'cc-sb-btn', type: 'button', title: 'استيراد',  onclick: () => importJson(store, opts.onRebuild) },          [h('i', { class: 'fas fa-upload'               })]),
        h('button', { class: 'cc-sb-btn cc-sb-btn--ai', type: 'button', title: 'المساعد الذكي',
          onclick: () => (window as any).SettingsModule?.openAIAssistant?.() },
          [h('i', { class: 'fas fa-wand-magic-sparkles' })]),
      ]),
      savePill,
    ]),

    /* progress */
    h('div', { class: 'cc-sidebar-progress' }, [
      h('div', { class: 'cc-sidebar-progress-label' }, [
        h('span', {}, ['إعداد النظام']),
        progressPct,
      ]),
      h('div', { class: 'cc-sidebar-progress-track' }, [progressFill]),
    ]),

    /* search */
    searchInput,

    /* nav */
    h('nav', { class: 'cc-nav' }, [list]),
  ]);
}
