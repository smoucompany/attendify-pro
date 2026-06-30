import { h } from '../components/dom';
import { CATEGORIES } from './categories';
import { SettingsStore } from '../core/store';

function statusOf(store: SettingsStore, key: string): { label: string; cls: string } {
  const history = store.getState().history.filter((h) => h.sectionKey === key);
  if (!history.length) return { label: 'Needs Attention', cls: 'cc-status--warn' };
  return { label: 'Configured', cls: 'cc-status--ok' };
}

function lastEditOf(store: SettingsStore, key: string): string {
  const history = store.getState().history.filter((h) => h.sectionKey === key);
  const last = history[history.length - 1];
  return last ? new Date(last.at).toLocaleString() : '—';
}

export function renderOverview(store: SettingsStore, onOpen: (key: string) => void): HTMLElement {
  const cards = CATEGORIES.map((cat) => {
    const status = statusOf(store, cat.key);
    return h('div', { class: 'cc-overview-card', onclick: () => onOpen(cat.key) }, [
      h('div', { class: 'cc-overview-card-head' }, [
        h('div', { class: 'cc-nav-icon cc-nav-icon--lg', style: `background:${cat.color}` }, [h('i', { class: cat.icon })]),
        h('span', { class: `cc-status ${status.cls}` }, [status.label]),
      ]),
      h('h3', {}, [cat.title]),
      h('p', {}, [cat.description]),
      h('div', { class: 'cc-overview-card-footer' }, [
        h('span', {}, [`آخر تعديل: ${lastEditOf(store, cat.key)}`]),
        h('button', { class: 'btn btn-outline-primary cc-btn-sm', type: 'button' }, ['فتح']),
      ]),
    ]);
  });

  return h('div', { class: 'cc-overview' }, [
    h('div', { class: 'cc-overview-hero' }, [
      h('h1', {}, ['مركز الإعدادات']),
      h('p', {}, ['كل إعدادات النظام في مكان واحد — بحث ذكي، حفظ تلقائي، وسجل تغييرات كامل.']),
    ]),
    h('div', { class: 'cc-overview-grid' }, cards),
  ]);
}
