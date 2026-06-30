import type { FeatureSchema } from '../../core/types';

export const reportsSchema: FeatureSchema = {
  key: 'reports',
  title: 'التقارير',
  description: 'التصدير، الجدولة، الرسوم البيانية',
  icon: 'fas fa-chart-column',
  color: 'linear-gradient(135deg,#14b8a6,#0284c7)',
  defaults: { charts: true, exportExcel: true, exportPdf: true, exportWord: false, exportCsv: true, exportPpt: false, scheduledReports: true },
  fields: [
    { key: 'charts', label: 'الرسوم البيانية في لوحة التقارير', type: 'toggle' },
    { key: 'exportExcel', label: 'تصدير Excel', type: 'toggle' },
    { key: 'exportPdf', label: 'تصدير PDF', type: 'toggle' },
    { key: 'exportWord', label: 'تصدير Word', type: 'toggle' },
    { key: 'exportCsv', label: 'تصدير CSV', type: 'toggle' },
    { key: 'exportPpt', label: 'تصدير PowerPoint', type: 'toggle' },
    { key: 'scheduledReports', label: 'تقارير مجدولة', type: 'toggle' },
  ],
};
