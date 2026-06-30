import type { FeatureSchema } from '../../core/types';

export const logsSchema: FeatureSchema = {
  key: 'logs',
  title: 'السجلات',
  description: 'الأنشطة، الأخطاء، سجلات الذكاء الاصطناعي',
  icon: 'fas fa-file-lines',
  color: 'linear-gradient(135deg,#a855f7,#7e22ce)',
  defaults: { activity: true, audit: true, errors: true, ai: true },
  fields: [
    { key: 'activity', label: 'سجل النشاط', type: 'toggle' },
    { key: 'audit', label: 'سجل التدقيق', type: 'toggle' },
    { key: 'errors', label: 'سجل الأخطاء', type: 'toggle' },
    { key: 'ai', label: 'سجل استخدام الذكاء الاصطناعي', type: 'toggle' },
  ],
};
