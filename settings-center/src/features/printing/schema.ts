import type { FeatureSchema } from '../../core/types';

export const printingSchema: FeatureSchema = {
  key: 'printing',
  title: 'الطباعة',
  description: 'A4، A5، الهوامش، القوالب',
  icon: 'fas fa-print',
  color: 'linear-gradient(135deg,#475569,#0f172a)',
  defaults: { paper: 'A4', margins: 'normal', header: true, footer: true, logo: true, stamp: true, watermark: false, qr: true },
  fields: [
    { key: 'paper', label: 'حجم الورق', type: 'select', options: [{ value: 'A4', label: 'A4' }, { value: 'A5', label: 'A5' }, { value: 'Thermal', label: 'Thermal' }, { value: 'Letter', label: 'Letter' }] },
    { key: 'margins', label: 'الهوامش', type: 'select', options: [{ value: 'normal', label: 'عادية' }, { value: 'narrow', label: 'ضيقة' }, { value: 'wide', label: 'واسعة' }] },
    { key: 'header', label: 'إظهار الترويسة', type: 'toggle' },
    { key: 'footer', label: 'إظهار التذييل', type: 'toggle' },
    { key: 'logo', label: 'الشعار في الطباعة', type: 'toggle' },
    { key: 'stamp', label: 'الختم في الطباعة', type: 'toggle' },
    { key: 'watermark', label: 'علامة مائية', type: 'toggle' },
    { key: 'qr', label: 'رمز QR في المستندات', type: 'toggle' },
  ],
};
