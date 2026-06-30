import { h } from './dom';
import { panelHeader, card } from './Card';
import { renderField } from './Field';
import { SettingsStore } from '../core/store';
import type { FeatureSchema } from '../core/types';

export function renderFeaturePanel(schema: FeatureSchema, store: SettingsStore, extra?: HTMLElement[]): HTMLElement {
  const values = store.getSectionValues(schema.key, schema.defaults);

  const fieldsCard = card([
    h('div', { class: 'cc-card-title' }, ['التكوين']),
    h('div', { class: 'cc-fields-grid' }, schema.fields.map((field) =>
      renderField(field, values[field.key], (value) => {
        const current = store.getSectionValues(schema.key, schema.defaults);
        store.setSectionValues(schema.key, { ...current, [field.key]: value });
      }),
    )),
  ]);

  return h('div', { class: 'cc-panel' }, [
    panelHeader({ icon: schema.icon, title: schema.title, description: schema.description, color: schema.color }),
    fieldsCard,
    ...(extra ?? []),
  ]);
}
