import type { FeatureSchema } from '../../core/types';

export const aboutSchema: FeatureSchema = {
  key: 'about',
  title: 'عن النظام',
  description: 'النسخة، الترخيص، التحديثات',
  icon: 'fas fa-circle-info',
  color: 'linear-gradient(135deg,#64748b,#475569)',
  defaults: { version: '2026.1.0', license: 'Enterprise', autoUpdates: true },
  fields: [
    { key: 'version', label: 'النسخة', type: 'text' },
    { key: 'license', label: 'الترخيص', type: 'text' },
    { key: 'autoUpdates', label: 'التحديثات التلقائية', type: 'toggle' },
  ],
};
