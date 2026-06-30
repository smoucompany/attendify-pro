import type { FeatureSchema } from '../../core/types';

export const notificationsSchema: FeatureSchema = {
  key: 'notifications',
  title: 'الإشعارات',
  description: 'البريد، SMS، واتساب، تيليغرام',
  icon: 'fas fa-bell',
  color: 'linear-gradient(135deg,#f97316,#ea580c)',
  defaults: { email: true, sms: true, whatsapp: true, telegram: false, push: true, desktop: true, rules: true },
  fields: [
    { key: 'email', label: 'البريد الإلكتروني', type: 'toggle' },
    { key: 'sms', label: 'SMS', type: 'toggle' },
    { key: 'whatsapp', label: 'WhatsApp', type: 'toggle' },
    { key: 'telegram', label: 'Telegram', type: 'toggle' },
    { key: 'push', label: 'Push Notifications', type: 'toggle' },
    { key: 'desktop', label: 'إشعارات سطح المكتب', type: 'toggle' },
    { key: 'rules', label: 'تفعيل قواعد الإشعارات الذكية', type: 'toggle' },
  ],
};
