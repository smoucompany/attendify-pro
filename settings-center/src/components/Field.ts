import { h } from './dom';
import type { FieldDef } from '../core/types';

export function renderField(field: FieldDef, value: unknown, onChange: (value: unknown) => void): HTMLElement {
  const row = h('div', { class: 'cc-field-row' }, [h('label', {}, [field.label])]);

  let control: HTMLElement;

  if (field.type === 'toggle') {
    const checked = Boolean(value);
    const input = h('input', { type: 'checkbox', checked }) as HTMLInputElement;
    input.checked = checked;
    input.addEventListener('change', () => onChange(input.checked));
    control = h('label', { class: 'cc-toggle' }, [input, h('span', {})]);
  } else if (field.type === 'select') {
    const select = document.createElement('select');
    select.className = 'cc-input';
    for (const opt of field.options ?? []) {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      if (String(value) === opt.value) o.selected = true;
      select.appendChild(o);
    }
    select.addEventListener('change', () => onChange(select.value));
    control = select;
  } else if (field.type === 'textarea') {
    const textarea = document.createElement('textarea');
    textarea.className = 'cc-input';
    textarea.rows = 3;
    textarea.value = String(value ?? '');
    textarea.addEventListener('input', () => onChange(textarea.value));
    control = textarea;
  } else {
    const input = document.createElement('input');
    input.className = 'cc-input';
    input.type = field.type;
    input.value = String(value ?? '');
    input.addEventListener('input', () => {
      onChange(field.type === 'number' ? Number(input.value) : input.value);
    });
    control = input;
  }

  row.append(control);
  if (field.hint) row.append(h('div', { class: 'cc-field-hint' }, [field.hint]));
  return row;
}
