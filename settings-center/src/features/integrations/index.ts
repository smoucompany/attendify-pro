import { renderFeaturePanel } from '../../components/FeaturePanel';
import { SettingsStore } from '../../core/store';
import { integrationsSchema } from './schema';

export function render(store: SettingsStore): HTMLElement {
  return renderFeaturePanel(integrationsSchema, store);
}
