import { h } from './dom';
import { SettingsStore } from '../core/store';
import type { FeatureSchema, FieldDef } from '../core/types';

const FIELD_ICONS: Record<string, string> = {
  toggle: 'fas fa-toggle-on', select: 'fas fa-list-check', text: 'fas fa-font',
  number: 'fas fa-hashtag', textarea: 'fas fa-align-left', color: 'fas fa-droplet',
  email: 'fas fa-envelope', password: 'fas fa-lock', time: 'fas fa-clock',
};

function buildInput(field: FieldDef, value: unknown, onChange: (v: unknown) => void): HTMLElement {
  if (field.type === 'toggle') {
    const inp = document.createElement('input');
    inp.type = 'checkbox'; inp.checked = Boolean(value);
    inp.addEventListener('change', () => onChange(inp.checked));
    return h('label', { class: 'cc-toggle' }, [inp, h('span')]);
  }
  if (field.type === 'select') {
    const sel = document.createElement('select');
    sel.className = 'cc-input fp-select';
    (field.options ?? []).forEach((o) => {
      const opt = document.createElement('option');
      opt.value = o.value; opt.textContent = o.label;
      if (String(value) === o.value) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => onChange(sel.value));
    return sel;
  }
  if (field.type === 'textarea') {
    const ta = document.createElement('textarea');
    ta.className = 'cc-input fp-textarea'; ta.rows = 3;
    ta.value = String(value ?? '');
    ta.addEventListener('change', () => onChange(ta.value));
    return ta;
  }
  if (field.type === 'color') {
    const inp = document.createElement('input');
    inp.type = 'color'; inp.value = String(value ?? '#6366f1');
    inp.className = 'fp-color-inp';
    inp.addEventListener('change', () => onChange(inp.value));
    return inp;
  }
  const inp = document.createElement('input');
  inp.type = field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'time' ? 'time' : 'text';
  inp.className = 'cc-input';
  inp.value = String(value ?? '');
  inp.placeholder = field.label;
  if (field.type === 'password') {
    const wrap = h('div', { class: 'fp-pw-wrap' }, [inp]);
    const eye = h('button', {
      class: 'fp-pw-eye', type: 'button',
      onclick: () => { inp.type = inp.type === 'password' ? 'text' : 'password'; (eye.querySelector('i') as HTMLElement).className = inp.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash'; },
    }, [h('i', { class: 'fas fa-eye' })]);
    wrap.appendChild(eye);
    inp.addEventListener('change', () => onChange(inp.value));
    return wrap;
  }
  inp.addEventListener('change', () => onChange(inp.value));
  return inp;
}

function toggleRow(field: FieldDef, value: unknown, store: SettingsStore, schema: FeatureSchema): HTMLElement {
  const onChange = (v: unknown) => {
    const cur = store.getSectionValues(schema.key, schema.defaults);
    store.setSectionValues(schema.key, { ...cur, [field.key]: v });
  };
  const control = buildInput(field, value, onChange);
  return h('div', { class: 'fp-toggle-row' }, [
    h('div', { class: 'fp-toggle-meta' }, [
      h('div', { class: 'fp-toggle-label' }, [field.label]),
      field.hint ? h('div', { class: 'fp-toggle-hint' }, [field.hint]) : h('span'),
    ]),
    control,
  ]);
}

function configRow(field: FieldDef, value: unknown, store: SettingsStore, schema: FeatureSchema): HTMLElement {
  const onChange = (v: unknown) => {
    const cur = store.getSectionValues(schema.key, schema.defaults);
    store.setSectionValues(schema.key, { ...cur, [field.key]: v });
  };
  const control = buildInput(field, value, onChange);
  return h('div', { class: 'fp-config-row' }, [
    h('label', { class: 'fp-config-label' }, [
      h('i', { class: FIELD_ICONS[field.type] ?? 'fas fa-circle-dot' }),
      field.label,
    ]),
    h('div', { class: 'fp-config-control' }, [
      control,
      field.hint ? h('div', { class: 'fp-config-hint' }, [field.hint]) : h('span'),
    ]),
  ]);
}

export function renderFeaturePanel(schema: FeatureSchema, store: SettingsStore, extra?: HTMLElement[]): HTMLElement {
  const values = store.getSectionValues(schema.key, schema.defaults);
  const toggleFields = schema.fields.filter((f) => f.type === 'toggle');
  const configFields = schema.fields.filter((f) => f.type !== 'toggle');

  const cards: HTMLElement[] = [];

  if (configFields.length) {
    cards.push(h('div', { class: 'fp-card' }, [
      h('div', { class: 'fp-card-head' }, [
        h('i', { class: 'fas fa-sliders' }),
        h('span', {}, ['الضبط والتكوين']),
      ]),
      h('div', { class: 'fp-card-body fp-config-body' },
        configFields.map((f) => configRow(f, values[f.key], store, schema)),
      ),
    ]));
  }

  if (toggleFields.length) {
    cards.push(h('div', { class: 'fp-card' }, [
      h('div', { class: 'fp-card-head' }, [
        h('i', { class: 'fas fa-toggle-on' }),
        h('span', {}, ['التفعيل والتعطيل']),
      ]),
      h('div', { class: 'fp-card-body fp-toggle-body' },
        toggleFields.map((f) => toggleRow(f, values[f.key], store, schema)),
      ),
    ]));
  }

  return h('div', { class: 'cc-panel' }, [
    /* header */
    h('div', { class: 'fp-header', style: `--fp-color:${schema.color}` }, [
      h('div', { class: 'fp-header-icon', style: `background:${schema.color}` }, [
        h('i', { class: schema.icon }),
      ]),
      h('div', {}, [
        h('h2', { class: 'fp-header-title' }, [schema.title]),
        h('p',  { class: 'fp-header-sub'   }, [schema.description]),
      ]),
    ]),
    ...cards,
    ...(extra ?? []),
  ]);
}
