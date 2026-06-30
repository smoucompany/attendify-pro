import type { FeatureSchema } from '../../core/types';

export const apiSchema: FeatureSchema = {
  key: 'api',
  title: 'واجهة البرمجة',
  description: 'API Keys، Webhooks، OAuth',
  icon: 'fas fa-code',
  color: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
  defaults: { webhooksEnabled: false, oauth: false, rateLimitPerMin: 60 },
  fields: [
    { key: 'webhooksEnabled', label: 'تفعيل Webhooks', type: 'toggle' },
    { key: 'oauth', label: 'OAuth', type: 'toggle' },
    { key: 'rateLimitPerMin', label: 'الحد الأقصى للطلبات/دقيقة', type: 'number' },
  ],
};
