import { renderFeaturePanel } from '../../components/FeaturePanel';
import { SettingsStore } from '../../core/store';
import { notificationsSchema } from './schema';

export function render(store: SettingsStore): HTMLElement {
  return renderFeaturePanel(notificationsSchema, store);
}
