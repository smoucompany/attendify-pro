import { renderFeaturePanel } from '../../components/FeaturePanel';
import { SettingsStore } from '../../core/store';
import { apiSchema } from './schema';

export function render(store: SettingsStore): HTMLElement {
  return renderFeaturePanel(apiSchema, store);
}
