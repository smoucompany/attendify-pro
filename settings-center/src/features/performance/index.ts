import { renderFeaturePanel } from '../../components/FeaturePanel';
import { SettingsStore } from '../../core/store';
import { performanceSchema } from './schema';

export function render(store: SettingsStore): HTMLElement {
  return renderFeaturePanel(performanceSchema, store);
}
