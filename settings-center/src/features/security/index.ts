import { h } from '../../components/dom';
import { SettingsStore } from '../../core/store';
import { securitySchema } from './schema';

const TOGGLES = [
  { key: 'passwordPolicy',  label: 'سياسة كلمات المرور القوية', hint: 'كلمة مرور بحروف وأرقام ورموز', icon: 'fas fa-key',            weight: 20 },
  { key: 'twoFactor',       label: 'المصادقة الثنائية (2FA)',    hint: 'طبقة حماية إضافية عند الدخول', icon: 'fas fa-shield-halved',   weight: 25 },
  { key: 'encryption',      label: 'تشفير البيانات الحساسة',     hint: 'AES-256 لحماية المعلومات',      icon: 'fas fa-lock',            weight: 20 },
  { key: 'auditLogs',       label: 'سجل التدقيق',                hint: 'تسجيل جميع العمليات والتغييرات', icon: 'fas fa-file-shield',    weight: 15 },
  { key: 'failedLoginLock', label: 'قفل الحساب بعد محاولات',     hint: '5 محاولات خاطئة = قفل مؤقت',   icon: 'fas fa-user-lock',       weight: 10 },
  { key: 'captcha',         label: 'CAPTCHA عند الدخول',          hint: 'تحقق بشري عند تسجيل الدخول',   icon: 'fas fa-robot',           weight: 5  },
  { key: 'ipWhitelist',     label: 'القائمة البيضاء لعناوين IP', hint: 'قصر الوصول على عناوين محددة',  icon: 'fas fa-shield-virus',    weight: 5  },
];

export function render(store: SettingsStore): HTMLElement {
  const vals = () => store.getSectionValues('security', securitySchema.defaults);
  const set  = (key: string, v: unknown) => { store.setSectionValues('security', { ...vals(), [key]: v }); rerender(); };

  let root: HTMLElement;

  function build(): HTMLElement {
    const v = vals();
    const score = TOGGLES.reduce((s, t) => s + (Boolean(v[t.key]) ? t.weight : 0), 0);
    const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    const scoreLabel = score >= 80 ? 'ممتاز' : score >= 50 ? 'متوسط' : 'ضعيف';

    const toggleRows = TOGGLES.map((t) => {
      const inp = document.createElement('input');
      inp.type = 'checkbox'; inp.checked = Boolean(v[t.key]);
      inp.addEventListener('change', () => set(t.key, inp.checked));
      return h('div', { class: 'fp-toggle-row' }, [
        h('div', { class: 'fp-toggle-meta fp-toggle-meta--icon' }, [
          h('div', { class: 'sec-field-icon', style: `color:${scoreColor}` }, [h('i', { class: t.icon })]),
          h('div', {}, [h('div', { class: 'fp-toggle-label' }, [t.label]), h('div', { class: 'fp-toggle-hint' }, [t.hint])]),
        ]),
        h('label', { class: 'cc-toggle' }, [inp, h('span')]),
      ]);
    });

    const timeoutEl = document.createElement('input');
    timeoutEl.type = 'number'; timeoutEl.className = 'cc-input'; timeoutEl.style.width = '100px';
    timeoutEl.value = String(v['sessionTimeout'] ?? 60);
    timeoutEl.addEventListener('change', () => set('sessionTimeout', Number(timeoutEl.value)));

    return h('div', { class: 'cc-panel' }, [
      h('div', { class: 'fp-header', style: '--fp-color:linear-gradient(135deg,#ef4444,#b91c1c)' }, [
        h('div', { class: 'fp-header-icon', style: 'background:linear-gradient(135deg,#ef4444,#b91c1c)' }, [h('i', { class: 'fas fa-shield-halved' })]),
        h('div', {}, [h('h2', { class: 'fp-header-title' }, ['الأمان والحماية']), h('p', { class: 'fp-header-sub' }, ['إعدادات الحماية والتحقق وسجل التدقيق'])]),
      ]),
      h('div', { class: 'sec-score-card' }, [
        h('div', { class: 'sec-score-left' }, [
          h('div', { class: 'sec-score-ring', style: `--score:${score};--color:${scoreColor}` }, [
            h('span', { class: 'sec-score-num', style: `color:${scoreColor}` }, [`${score}`]),
            h('span', { class: 'sec-score-pct' }, ['%']),
          ]),
        ]),
        h('div', {}, [
          h('div', { class: 'sec-score-label', style: `color:${scoreColor}` }, [scoreLabel]),
          h('div', { class: 'sec-score-desc' }, ['مستوى أمان الحساب']),
          h('div', { class: 'sec-score-bar' }, [
            h('div', { class: 'sec-score-fill', style: `width:${score}%;background:${scoreColor}` }),
          ]),
        ]),
      ]),
      h('div', { class: 'fp-card' }, [
        h('div', { class: 'fp-card-head' }, [h('i', { class: 'fas fa-shield' }), h('span', {}, ['إعدادات الحماية'])]),
        h('div', { class: 'fp-card-body fp-toggle-body' }, toggleRows),
      ]),
      h('div', { class: 'fp-card' }, [
        h('div', { class: 'fp-card-head' }, [h('i', { class: 'fas fa-clock' }), h('span', {}, ['مهلة الجلسة'])]),
        h('div', { class: 'fp-card-body' }, [
          h('div', { class: 'fp-config-row' }, [
            h('label', { class: 'fp-config-label' }, [h('i', { class: 'fas fa-hourglass-half' }), 'المهلة (بالدقائق)']),
            h('div', { class: 'fp-config-control' }, [timeoutEl, h('div', { class: 'fp-config-hint' }, ['انتهاء الجلسة تلقائياً بعد فترة الخمول'])]),
          ]),
        ]),
      ]),
    ]);
  }

  function rerender() { const n = build(); root.replaceWith(n); root = n; }
  root = build();
  return root;
}
