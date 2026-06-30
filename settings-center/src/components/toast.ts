import { legacy } from '../adapter/legacyBridge';

export function toast(message: string, type: 'success' | 'warning' | 'danger' | 'info' = 'success', duration = 2200): void {
  const app = legacy.app();
  if (app.toast) app.toast(message, type, duration);
}
