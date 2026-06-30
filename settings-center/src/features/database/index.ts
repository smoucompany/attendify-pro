import { renderFeaturePanel } from '../../components/FeaturePanel';
import { SettingsStore } from '../../core/store';
import { databaseSchema } from './schema';

export function render(store: SettingsStore): HTMLElement {
  return renderFeaturePanel(databaseSchema, store);
}
