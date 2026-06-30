import { renderFeaturePanel } from '../../components/FeaturePanel';
import { SettingsStore } from '../../core/store';
import { appearanceSchema } from './schema';

export function render(store: SettingsStore): HTMLElement {
  return renderFeaturePanel(appearanceSchema, store);
}
