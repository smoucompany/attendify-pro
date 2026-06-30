import { h } from './dom';
import { SettingsStore } from '../core/store';
import { findCategory } from '../app/categories';
import { toast } from './toast';

export function openHistoryPanel(store: SettingsStore, onRestored: () => void): void {
  const overlay = h('div', { class: 'cc-palette-overlay' });
  const history = store.getState().history.slice().reverse();

  const list = history.length
    ? history.map((entry) => {
      const meta = findCategory(entry.sectionKey);
      return h('div', { class: 'cc-history-item' }, [
        h('div', { class: 'cc-nav-icon', style: `background:${meta.color}` }, [h('i', { class: meta.icon })]),
        h('div', { class: 'cc-history-info' }, [
          h('div', { class: 'cc-palette-title' }, [meta.title]),
          h('div', { class: 'cc-palette-desc' }, [new Date(entry.at).toLocaleString()]),
        ]),
        h('button', {
          class: 'btn btn-outline-primary cc-btn-sm', type: 'button',
          onclick: () => {
            store.restoreFromHistory(entry);
            toast('تم استرجاع النسخة', 'success');
            overlay.remove();
            onRestored();
          },
        }, ['استرجاع']),
      ]);
    })
    : [h('div', { class: 'cc-empty' }, [h('i', { class: 'fas fa-clock-rotate-left' }), h('p', {}, ['لا يوجد سجل تغييرات بعد'])])];

  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.append(h('div', { class: 'cc-palette-modal cc-history-modal' }, [
    h('div', { class: 'cc-palette-bar' }, [h('i', { class: 'fas fa-clock-rotate-left' }), h('span', { class: 'cc-history-title' }, ['سجل التغييرات']), h('kbd', {}, ['Esc'])]),
    h('div', { class: 'cc-history-list' }, list),
  ]));
  document.body.append(overlay);

  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
}
