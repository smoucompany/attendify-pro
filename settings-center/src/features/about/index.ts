import { renderFeaturePanel } from '../../components/FeaturePanel';
import { SettingsStore } from '../../core/store';
import { aboutSchema } from './schema';

export function render(store: SettingsStore): HTMLElement {
  return renderFeaturePanel(aboutSchema, store);
}
