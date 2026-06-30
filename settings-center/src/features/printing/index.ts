import { renderFeaturePanel } from '../../components/FeaturePanel';
import { SettingsStore } from '../../core/store';
import { printingSchema } from './schema';

export function render(store: SettingsStore): HTMLElement {
  return renderFeaturePanel(printingSchema, store);
}
