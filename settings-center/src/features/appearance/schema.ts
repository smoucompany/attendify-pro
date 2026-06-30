import type { FeatureSchema } from '../../core/types';

export const appearanceSchema: FeatureSchema = {
  key: 'appearance',
  title: 'المظهر',
  description: 'الثيم، الألوان، الخطوط، التخطيط',
  icon: 'fas fa-palette',
  color: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
  defaults: {
    theme: 'dark', primaryColor: '#6366f1', accentColor: '#10b981', radius: 18,
    sidebarStyle: 'glass', headerStyle: 'minimal', cardStyle: 'modern',
    glassEffect: true, animations: true, compactMode: false,
  },
  fields: [
    { key: 'theme', label: 'السمة', type: 'select', options: [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'auto', label: 'Auto' }] },
    { key: 'primaryColor', label: 'اللون الأساسي', type: 'color' },
    { key: 'accentColor', label: 'لون التمييز', type: 'color' },
    { key: 'radius', label: 'استدارة الحواف (px)', type: 'number' },
    { key: 'sidebarStyle', label: 'نمط الشريط الجانبي', type: 'select', options: [{ value: 'glass', label: 'Glass' }, { value: 'solid', label: 'Solid' }] },
    { key: 'headerStyle', label: 'نمط الترويسة', type: 'select', options: [{ value: 'minimal', label: 'Minimal' }, { value: 'bold', label: 'Bold' }] },
    { key: 'cardStyle', label: 'نمط البطاقات', type: 'select', options: [{ value: 'modern', label: 'Modern' }, { value: 'flat', label: 'Flat' }] },
    { key: 'glassEffect', label: 'تأثير الزجاج', type: 'toggle' },
    { key: 'animations', label: 'الحركات والانتقالات', type: 'toggle' },
    { key: 'compactMode', label: 'الوضع المضغوط', type: 'toggle', hint: 'تقليل المسافات لعرض أكبر للبيانات' },
  ],
};
