import { renderFeaturePanel } from '../../components/FeaturePanel';
import { SettingsStore } from '../../core/store';
import { logsSchema } from './schema';

export function render(store: SettingsStore): HTMLElement {
  return renderFeaturePanel(logsSchema, store);
}
