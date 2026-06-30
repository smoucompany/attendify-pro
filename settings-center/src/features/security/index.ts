import { renderFeaturePanel } from '../../components/FeaturePanel';
import { SettingsStore } from '../../core/store';
import { securitySchema } from './schema';

export function render(store: SettingsStore): HTMLElement {
  return renderFeaturePanel(securitySchema, store);
}
