import { renderFeaturePanel } from '../../components/FeaturePanel';
import { SettingsStore } from '../../core/store';
import { reportsSchema } from './schema';

export function render(store: SettingsStore): HTMLElement {
  return renderFeaturePanel(reportsSchema, store);
}
