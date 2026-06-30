import { mountLegacyHtml, type MountedPanel } from '../../components/LegacyFrame';
import { legacy } from '../../adapter/legacyBridge';
import { findCategory } from '../../app/categories';

export function render(): MountedPanel {
  return mountLegacyHtml(findCategory('hr'), () => legacy.settingsModule()._leavesSettings());
}
