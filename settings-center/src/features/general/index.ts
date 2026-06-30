import { renderFeaturePanel } from '../../components/FeaturePanel';
import { SettingsStore } from '../../core/store';
import { generalSchema } from './schema';

export function render(store: SettingsStore): HTMLElement {
  return renderFeaturePanel(generalSchema, store);
}
