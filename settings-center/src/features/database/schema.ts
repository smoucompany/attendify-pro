import type { FeatureSchema } from '../../core/types';

export const databaseSchema: FeatureSchema = {
  key: 'database',
  title: 'قاعدة البيانات',
  description: 'الجداول، الفهارس، التخزين',
  icon: 'fas fa-database',
  color: 'linear-gradient(135deg,#64748b,#1e293b)',
  defaults: { autoOptimize: true, cleanupOldLogs: true, retentionDays: 90 },
  fields: [
    { key: 'autoOptimize', label: 'تحسين تلقائي للجداول', type: 'toggle' },
    { key: 'cleanupOldLogs', label: 'تنظيف السجلات القديمة تلقائياً', type: 'toggle' },
    { key: 'retentionDays', label: 'مدة الاحتفاظ بالسجلات (يوم)', type: 'number' },
  ],
};
