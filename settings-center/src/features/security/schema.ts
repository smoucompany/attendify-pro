import type { FeatureSchema } from '../../core/types';

export const securitySchema: FeatureSchema = {
  key: 'security',
  title: 'الأمان',
  description: '2FA، كلمات المرور، سجل التدقيق',
  icon: 'fas fa-shield-halved',
  color: 'linear-gradient(135deg,#ef4444,#b91c1c)',
  defaults: {
    passwordPolicy: true, sessionTimeout: 60, ipWhitelist: false, twoFactor: true,
    encryption: true, auditLogs: true, failedLoginLock: true, captcha: false,
  },
  fields: [
    { key: 'passwordPolicy', label: 'سياسة كلمات المرور القوية', type: 'toggle' },
    { key: 'sessionTimeout', label: 'مهلة الجلسة (دقائق)', type: 'number' },
    { key: 'ipWhitelist', label: 'القائمة البيضاء لعناوين IP', type: 'toggle' },
    { key: 'twoFactor', label: 'المصادقة الثنائية', type: 'toggle' },
    { key: 'encryption', label: 'تشفير البيانات الحساسة', type: 'toggle' },
    { key: 'auditLogs', label: 'سجل التدقيق', type: 'toggle' },
    { key: 'failedLoginLock', label: 'قفل الحساب بعد محاولات فاشلة', type: 'toggle' },
    { key: 'captcha', label: 'CAPTCHA عند تسجيل الدخول', type: 'toggle' },
  ],
};
