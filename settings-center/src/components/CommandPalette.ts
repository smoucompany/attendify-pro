import { h } from './dom';
import { CATEGORIES } from '../app/categories';

export function openCommandPalette(onSelect: (key: string) => void): void {
  const overlay = h('div', { class: 'cc-palette-overlay' });
  const input = h('input', { class: 'cc-palette-input', placeholder: 'ابحث عن إعداد أو قسم...' }) as HTMLInputElement;
  const list = h('div', { class: 'cc-palette-list' });

  let activeIndex = 0;
  let items = CATEGORIES;

  function close(): void {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  }

  function renderList(): void {
    list.replaceChildren(...items.map((cat, i) =>
      h('div', { class: `cc-palette-item ${i === activeIndex ? 'cc-palette-item--active' : ''}`, onclick: () => { onSelect(cat.key); close(); } }, [
        h('div', { class: 'cc-nav-icon', style: `background:${cat.color}` }, [h('i', { class: cat.icon })]),
        h('div', {}, [
          h('div', { class: 'cc-palette-title' }, [cat.title]),
          h('div', { class: 'cc-palette-desc' }, [cat.description]),
        ]),
      ]),
    ));
  }

  function filter(): void {
    const term = input.value.trim().toLowerCase();
    items = CATEGORIES.filter((c) => !term || c.title.toLowerCase().includes(term) || c.description.toLowerCase().includes(term));
    activeIndex = 0;
    renderList();
  }

  function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, items.length - 1); renderList(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); renderList(); }
    if (e.key === 'Enter') {
      const target = items[activeIndex];
      if (target) { onSelect(target.key); close(); }
    }
  }

  input.addEventListener('input', filter);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', onKey);

  overlay.append(h('div', { class: 'cc-palette-modal' }, [
    h('div', { class: 'cc-palette-bar' }, [h('i', { class: 'fas fa-magnifying-glass' }), input, h('kbd', {}, ['Esc'])]),
    list,
  ]));
  document.body.append(overlay);
  filter();
  input.focus();
}
