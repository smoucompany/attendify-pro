import type { FeatureSchema } from '../../core/types';

export const performanceSchema: FeatureSchema = {
  key: 'performance',
  title: 'الأداء',
  description: 'الذاكرة، الكاش، الضغط',
  icon: 'fas fa-gauge-high',
  color: 'linear-gradient(135deg,#84cc16,#4d7c0f)',
  defaults: { cache: true, compression: true, lazyLoading: true, imageOptimization: true },
  fields: [
    { key: 'cache', label: 'التخزين المؤقت (Cache)', type: 'toggle' },
    { key: 'compression', label: 'ضغط الاستجابات', type: 'toggle' },
    { key: 'lazyLoading', label: 'التحميل الكسول', type: 'toggle' },
    { key: 'imageOptimization', label: 'تحسين الصور', type: 'toggle' },
  ],
};
