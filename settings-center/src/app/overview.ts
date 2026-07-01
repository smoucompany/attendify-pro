import { h } from '../components/dom';
import { CATEGORIES } from './categories';
import { SettingsStore } from '../core/store';
import type { CategoryMeta } from '../core/types';

const GROUPS = [
  { key: 'system', label: 'إعدادات النظام',    icon: 'fas fa-gear'          },
  { key: 'hr',     label: 'الموارد البشرية',    icon: 'fas fa-users'         },
  { key: 'comms',  label: 'التواصل والإشعارات', icon: 'fas fa-comments'      },
  { key: 'tech',   label: 'التقنية والأمان',     icon: 'fas fa-shield-halved' },
  { key: 'data',   label: 'البيانات والتقارير',  icon: 'fas fa-chart-bar'     },
];

const isConfigured = (store: SettingsStore, key: string) =>
  store.getState().history.some((h) => h.sectionKey === key);

const lastEdit = (store: SettingsStore, key: string): string => {
  const entries = store.getState().history.filter((h) => h.sectionKey === key);
  const last = entries[entries.length - 1];
  if (!last) return '';
  return new Date(last.at).toLocaleDateString('ar-SA');
};

function buildCard(cat: CategoryMeta, store: SettingsStore, onOpen: (k: string) => void): HTMLElement {
  const ok   = isConfigured(store, cat.key);
  const edit = lastEdit(store, cat.key);

  return h('div', { class: `ov-card ${ok ? 'ov-card--ok' : ''}`, onclick: () => onOpen(cat.key) }, [
    h('div', { class: 'ov-card-accent', style: `background:${cat.color}` }),
    h('div', { class: 'ov-card-body' }, [
      h('div', { class: 'ov-card-top' }, [
        h('div', { class: 'ov-card-icon', style: `background:${cat.color}` }, [
          h('i', { class: cat.icon }),
        ]),
        h('span', { class: `ov-status ${ok ? 'ov-status--ok' : 'ov-status--warn'}` }, [
          ok ? 'مُضبوط' : 'يحتاج انتباه',
        ]),
      ]),
      h('div', { class: 'ov-card-info' }, [
        h('h3', { class: 'ov-card-title' }, [cat.title]),
        h('p',  { class: 'ov-card-desc'  }, [cat.description]),
      ]),
      h('div', { class: 'ov-card-footer' }, [
        h('span', { class: 'ov-card-date' }, [
          h('i', { class: 'far fa-clock' }),
          edit ? ` ${edit}` : ' لم يُعدَّل',
        ]),
        h('span', { class: 'ov-card-open' }, [
          'فتح ', h('i', { class: 'fas fa-arrow-left' }),
        ]),
      ]),
    ]),
  ]);
}

function buildStatsBar(store: SettingsStore, onSearch: () => void): HTMLElement {
  const total      = CATEGORIES.length;
  const configured = CATEGORIES.filter((c) => isConfigured(store, c.key)).length;
  const pending    = total - configured;
  const pct        = Math.round((configured / total) * 100);

  return h('div', { class: 'ov-statsbar' }, [
    h('div', { class: 'ov-statsbar-title' }, [
      h('i', { class: 'fas fa-sliders' }),
      h('span', {}, ['مركز الإعدادات']),
    ]),
    h('div', { class: 'ov-statsbar-kpis' }, [
      h('div', { class: 'ov-kpi' }, [
        h('span', { class: 'ov-kpi-n' }, [`${total}`]),
        h('span', { class: 'ov-kpi-l' }, ['قسم']),
      ]),
      h('div', { class: 'ov-kpi ov-kpi--ok' }, [
        h('i', { class: 'fas fa-circle-check' }),
        h('span', { class: 'ov-kpi-n' }, [`${configured}`]),
        h('span', { class: 'ov-kpi-l' }, ['مُضبوط']),
      ]),
      h('div', { class: `ov-kpi ${pending ? 'ov-kpi--warn' : 'ov-kpi--ok'}` }, [
        h('i', { class: 'fas fa-circle-exclamation' }),
        h('span', { class: 'ov-kpi-n' }, [`${pending}`]),
        h('span', { class: 'ov-kpi-l' }, ['يحتاج انتباه']),
      ]),
      h('div', { class: 'ov-progress-wrap' }, [
        h('div', { class: 'ov-progress-track' }, [
          h('div', { class: 'ov-progress-fill', style: `width:${pct}%` }),
        ]),
        h('span', { class: 'ov-progress-pct' }, [`${pct}%`]),
      ]),
    ]),
    h('button', { class: 'ov-search-btn', type: 'button', onclick: (e: Event) => { e.stopPropagation(); onSearch(); } }, [
      h('i', { class: 'fas fa-magnifying-glass' }),
      h('span', {}, ['بحث في الإعدادات...']),
      h('kbd', {}, ['Ctrl K']),
    ]),
  ]);
}

export function renderOverview(store: SettingsStore, onOpen: (key: string) => void, onSearch?: () => void): HTMLElement {
  const sections = GROUPS.map((g) => {
    const cats = CATEGORIES.filter((c) => c.group === g.key);
    if (!cats.length) return null;
    const okCount = cats.filter((c) => isConfigured(store, c.key)).length;

    return h('section', { class: 'ov-section' }, [
      h('div', { class: 'ov-section-head' }, [
        h('div', { class: 'ov-section-left' }, [
          h('div', { class: 'ov-section-icon' }, [h('i', { class: g.icon })]),
          h('span', { class: 'ov-section-label' }, [g.label]),
        ]),
        h('span', { class: `ov-section-badge ${okCount === cats.length ? 'ov-section-badge--ok' : ''}` },
          [`${okCount}/${cats.length}`]),
      ]),
      h('div', { class: 'ov-grid' }, cats.map((cat) => buildCard(cat, store, onOpen))),
    ]);
  }).filter(Boolean) as HTMLElement[];

  return h('div', { class: 'ov-root' }, [
    buildStatsBar(store, onSearch ?? (() => {})),
    h('div', { class: 'ov-sections' }, sections),
  ]);
}
