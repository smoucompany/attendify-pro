import type { CategoryMeta } from '../core/types';

export const CATEGORIES: CategoryMeta[] = [
  { key: 'general',       title: 'الإعدادات العامة',        description: 'اسم النظام، اللغة، العملة، أيام العمل',         icon: 'fas fa-sliders',            color: 'linear-gradient(135deg,#0ea5e9,#2563eb)', kind: 'rebuilt' },
  { key: 'company',       title: 'الشركة',                  description: 'الشعار، الختم، البيانات الأساسية',              icon: 'fas fa-building',           color: 'linear-gradient(135deg,#f59e0b,#ef4444)', kind: 'legacy'  },
  { key: 'users',         title: 'المستخدمون والصلاحيات',   description: 'الأدوار، الأقسام، 2FA، الجلسات',                icon: 'fas fa-users-gear',         color: 'linear-gradient(135deg,#10b981,#059669)', kind: 'legacy'  },
  { key: 'attendance',    title: 'الحضور',                  description: 'مواعيد العمل، GPS، العطلات',                    icon: 'fas fa-fingerprint',        color: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', kind: 'legacy'  },
  { key: 'hr',             title: 'الموارد البشرية',         description: 'أنواع الإجازات والرصيد السنوي',                 icon: 'fas fa-user-tie',           color: 'linear-gradient(135deg,#8b5cf6,#ec4899)', kind: 'legacy'  },
  { key: 'payroll',       title: 'الرواتب',                 description: 'الراتب الأساسي، البدلات، الاستقطاعات',          icon: 'fas fa-money-bill-wave',    color: 'linear-gradient(135deg,#14b8a6,#0f766e)', kind: 'legacy'  },
  { key: 'correspondence', title: 'المراسلات',               description: 'التوقيع، الختم، سلسلة الاعتماد',                icon: 'fas fa-envelope-open-text', color: 'linear-gradient(135deg,#64748b,#334155)', kind: 'legacy'  },
  { key: 'notifications', title: 'الإشعارات',               description: 'البريد، SMS، واتساب، تيليغرام',                 icon: 'fas fa-bell',               color: 'linear-gradient(135deg,#f97316,#ea580c)', kind: 'rebuilt' },
  { key: 'ai-center',     title: 'مركز الذكاء الاصطناعي',   description: 'المزود، النموذج، المساعد الحقيقي',              icon: 'fas fa-robot',              color: 'linear-gradient(135deg,#8b5cf6,#6366f1)', kind: 'rebuilt' },
  { key: 'automation',    title: 'الأتمتة',                 description: 'قواعد التشغيل التلقائي',                        icon: 'fas fa-gears',              color: 'linear-gradient(135deg,#22c55e,#16a34a)', kind: 'rebuilt' },
  { key: 'integrations',  title: 'التكاملات',               description: 'Google، Microsoft، Slack، Supabase',            icon: 'fas fa-plug',               color: 'linear-gradient(135deg,#6366f1,#4f46e5)', kind: 'rebuilt' },
  { key: 'security',      title: 'الأمان',                   description: '2FA، كلمات المرور، سجل التدقيق',                icon: 'fas fa-shield-halved',      color: 'linear-gradient(135deg,#ef4444,#b91c1c)', kind: 'rebuilt' },
  { key: 'backup',        title: 'النسخ الاحتياطي',          description: 'جدولة النسخ، الاستعادة، السحابة',               icon: 'fas fa-cloud-arrow-up',     color: 'linear-gradient(135deg,#06b6d4,#0f766e)', kind: 'legacy'  },
  { key: 'appearance',    title: 'المظهر',                   description: 'الثيم، الألوان، الخطوط',                        icon: 'fas fa-palette',            color: 'linear-gradient(135deg,#ec4899,#8b5cf6)', kind: 'rebuilt' },
  { key: 'printing',      title: 'الطباعة',                  description: 'A4، A5، الهوامش، القوالب',                      icon: 'fas fa-print',              color: 'linear-gradient(135deg,#475569,#0f172a)', kind: 'rebuilt' },
  { key: 'reports',       title: 'التقارير',                 description: 'التصدير، الجدولة، الرسوم البيانية',             icon: 'fas fa-chart-column',       color: 'linear-gradient(135deg,#14b8a6,#0284c7)', kind: 'rebuilt' },
  { key: 'performance',   title: 'الأداء',                   description: 'الذاكرة، الكاش، الضغط',                         icon: 'fas fa-gauge-high',         color: 'linear-gradient(135deg,#84cc16,#4d7c0f)', kind: 'rebuilt' },
  { key: 'database',      title: 'قاعدة البيانات',           description: 'الجداول، الفهارس، التخزين',                     icon: 'fas fa-database',           color: 'linear-gradient(135deg,#64748b,#1e293b)', kind: 'rebuilt' },
  { key: 'api',           title: 'واجهة البرمجة',            description: 'API Keys، Webhooks، OAuth',                     icon: 'fas fa-code',               color: 'linear-gradient(135deg,#2563eb,#1d4ed8)', kind: 'rebuilt' },
  { key: 'logs',          title: 'السجلات',                  description: 'الأنشطة، الأخطاء، سجلات الذكاء الاصطناعي',       icon: 'fas fa-file-lines',         color: 'linear-gradient(135deg,#a855f7,#7e22ce)', kind: 'rebuilt' },
  { key: 'about',         title: 'عن النظام',                description: 'النسخة، الترخيص، التحديثات',                    icon: 'fas fa-circle-info',        color: 'linear-gradient(135deg,#64748b,#475569)', kind: 'rebuilt' },
];

export function findCategory(key: string): CategoryMeta {
  return CATEGORIES.find((c) => c.key === key) ?? (CATEGORIES[0] as CategoryMeta);
}
