import { h } from './dom';
import type { CategoryMeta } from '../core/types';
import { CATEGORIES } from '../app/categories';
import { SettingsStore } from '../core/store';

export interface SidebarOptions {
  store: SettingsStore;
  activeKey: string;
  onSelect: (key: string) => void;
}

function navItem(cat: CategoryMeta, active: boolean, store: SettingsStore, onSelect: (k: string) => void): HTMLElement {
  const isFav = store.isFavorite(cat.key);
  const star = h('button', {
    class: `cc-fav-btn ${isFav ? 'cc-fav-btn--on' : ''}`, type: 'button', title: 'مفضلة',
    onclick: (e: Event) => { e.stopPropagation(); store.toggleFavorite(cat.key); },
  }, [h('i', { class: isFav ? 'fas fa-star' : 'far fa-star' })]);

  return h('div', {
    class: `cc-nav-item ${active ? 'cc-nav-item--active' : ''}`,
    onclick: () => onSelect(cat.key),
  }, [
    h('div', { class: 'cc-nav-icon', style: `background:${cat.color}` }, [h('i', { class: cat.icon })]),
    h('div', { class: 'cc-nav-label' }, [cat.title]),
    star,
  ]);
}

export function renderSidebar(opts: SidebarOptions): HTMLElement {
  const { store, activeKey, onSelect } = opts;
  const state = store.getState();

  let searchTerm = '';
  const list = h('div', { class: 'cc-nav-list' });

  const renderList = () => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = CATEGORIES.filter((c) => !term || c.title.toLowerCase().includes(term) || c.description.toLowerCase().includes(term));
    const groups: HTMLElement[] = [];

    if (!term && state.favorites.length) {
      groups.push(h('div', { class: 'cc-nav-group-label' }, ['المفضلة']));
      groups.push(...state.favorites
        .map((k) => CATEGORIES.find((c) => c.key === k))
        .filter((c): c is CategoryMeta => !!c)
        .map((c) => navItem(c, c.key === activeKey, store, onSelect)));
    }
    if (!term && state.recent.length) {
      groups.push(h('div', { class: 'cc-nav-group-label' }, ['الأخيرة']));
      groups.push(...state.recent
        .map((k) => CATEGORIES.find((c) => c.key === k))
        .filter((c): c is CategoryMeta => !!c)
        .map((c) => navItem(c, c.key === activeKey, store, onSelect)));
    }
    groups.push(h('div', { class: 'cc-nav-group-label' }, ['الكل']));
    groups.push(...filtered.map((c) => navItem(c, c.key === activeKey, store, onSelect)));

    list.replaceChildren(...groups);
  };
  renderList();

  const searchInput = h('input', { class: 'cc-sidebar-search', placeholder: 'تصفية القائمة...' }) as HTMLInputElement;
  searchInput.addEventListener('input', () => { searchTerm = searchInput.value; renderList(); });
  store.subscribe(renderList);

  return h('aside', { class: 'cc-sidebar' }, [
    h('div', { class: 'cc-sidebar-brand' }, [
      h('div', { class: 'cc-brand-icon' }, [h('i', { class: 'fas fa-gear' })]),
      h('div', {}, [
        h('div', { class: 'cc-brand-name' }, ['Settings Center']),
        h('div', { class: 'cc-brand-sub' }, ['إدارة شاملة للنظام']),
      ]),
    ]),
    searchInput,
    h('nav', { class: 'cc-nav' }, [list]),
  ]);
}
