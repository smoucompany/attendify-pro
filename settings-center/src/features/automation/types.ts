export interface AutomationRule {
  id: string;
  trigger: string;
  action: string;
  enabled: boolean;
}

export interface AutomationState {
  masterEnabled: boolean;
  rules: AutomationRule[];
}

export const TRIGGER_OPTIONS = [
  { value: 'employee_late', label: 'إذا تأخر موظف' },
  { value: 'employee_absent', label: 'إذا غاب موظف' },
  { value: 'leave_requested', label: 'عند طلب إجازة' },
  { value: 'leave_balance_low', label: 'عند انخفاض رصيد الإجازات' },
  { value: 'payroll_ready', label: 'عند جاهزية الرواتب' },
  { value: 'document_expiring', label: 'عند اقتراب انتهاء وثيقة' },
];

export const ACTION_OPTIONS = [
  { value: 'send_notification', label: 'إرسال إشعار' },
  { value: 'send_email', label: 'إرسال بريد إلكتروني' },
  { value: 'apply_deduction', label: 'تطبيق خصم' },
  { value: 'generate_report', label: 'إنشاء تقرير' },
  { value: 'create_reminder', label: 'إنشاء تذكير للإدارة' },
];

export const DEFAULT_AUTOMATION: AutomationState = {
  masterEnabled: true,
  rules: [
    { id: 'r1', trigger: 'employee_late', action: 'send_notification', enabled: true },
    { id: 'r2', trigger: 'leave_balance_low', action: 'send_email', enabled: false },
  ],
};
