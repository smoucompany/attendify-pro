import { mountLegacyModule, type MountedPanel } from '../../components/LegacyFrame';
import { legacy } from '../../adapter/legacyBridge';
import { findCategory } from '../../app/categories';

export function render(): MountedPanel {
  return mountLegacyModule(findCategory('users'), legacy.rolesModule());
}
