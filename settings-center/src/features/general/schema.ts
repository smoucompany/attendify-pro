import type { FeatureSchema } from '../../core/types';

export const generalSchema: FeatureSchema = {
  key: 'general',
  title: 'الإعدادات العامة',
  description: 'اسم النظام، اللغة، العملة، الحالة العامة',
  icon: 'fas fa-sliders',
  color: 'linear-gradient(135deg,#0ea5e9,#2563eb)',
  defaults: {
    systemName: 'Attendance & Leave',
    companyName: '',
    language: 'ar',
    timezone: 'Asia/Riyadh',
    currency: 'SAR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    rowsPerPage: 25,
    maintenanceMode: false,
  },
  fields: [
    { key: 'systemName', label: 'اسم النظام', type: 'text' },
    { key: 'companyName', label: 'اسم الشركة', type: 'text' },
    { key: 'language', label: 'اللغة', type: 'select', options: [{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }] },
    { key: 'timezone', label: 'المنطقة الزمنية', type: 'select', options: [{ value: 'Asia/Riyadh', label: 'Asia/Riyadh' }, { value: 'Asia/Dubai', label: 'Asia/Dubai' }, { value: 'UTC', label: 'UTC' }] },
    { key: 'currency', label: 'العملة', type: 'select', options: [{ value: 'SAR', label: 'SAR' }, { value: 'AED', label: 'AED' }, { value: 'USD', label: 'USD' }] },
    { key: 'dateFormat', label: 'صيغة التاريخ', type: 'select', options: [{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }] },
    { key: 'timeFormat', label: 'صيغة الوقت', type: 'select', options: [{ value: '24h', label: '24 ساعة' }, { value: '12h', label: '12 ساعة' }] },
    { key: 'rowsPerPage', label: 'عدد الصفوف لكل صفحة', type: 'number' },
    { key: 'maintenanceMode', label: 'وضع الصيانة', type: 'toggle', hint: 'إخفاء النظام عن الموظفين مؤقتاً' },
  ],
};
