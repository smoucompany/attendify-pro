import { h } from '../../components/dom';
import { SettingsStore } from '../../core/store';
import { integrationsSchema } from './schema';

const INTEGRATIONS = [
  { key: 'googleDrive',    label: 'Google Drive',    icon: 'fab fa-google-drive', color: '#4285f4', desc: 'تخزين وإدارة الملفات' },
  { key: 'googleCalendar', label: 'Google Calendar', icon: 'fas fa-calendar-days', color: '#34a853', desc: 'مزامنة الإجازات والمواعيد' },
  { key: 'microsoft365',  label: 'Microsoft 365',   icon: 'fab fa-microsoft',     color: '#0078d4', desc: 'تكامل Office والبريد' },
  { key: 'outlook',       label: 'Outlook',         icon: 'fas fa-envelope-open', color: '#0072c6', desc: 'تزامن البريد الإلكتروني' },
  { key: 'slack',         label: 'Slack',           icon: 'fab fa-slack',         color: '#4a154b', desc: 'إشعارات في Slack' },
  { key: 'firebase',      label: 'Firebase',        icon: 'fas fa-fire',          color: '#ff6d00', desc: 'Push Notifications' },
  { key: 'cloudinary',    label: 'Cloudinary',      icon: 'fas fa-cloud-upload',  color: '#3448c5', desc: 'رفع وتحسين الصور' },
  { key: 'awsS3',         label: 'AWS S3',          icon: 'fab fa-aws',           color: '#ff9900', desc: 'تخزين الملفات السحابي' },
  { key: 'supabase',      label: 'Supabase',        icon: 'fas fa-database',      color: '#3ecf8e', desc: 'قاعدة البيانات الرئيسية' },
];

export function render(store: SettingsStore): HTMLElement {
  const vals = () => store.getSectionValues('integrations', integrationsSchema.defaults);
  const set  = (key: string, v: unknown) => { store.setSectionValues('integrations', { ...vals(), [key]: v }); rerender(); };

  let root: HTMLElement;

  function build(): HTMLElement {
    const v = vals();
    const total   = INTEGRATIONS.length;
    const enabled = INTEGRATIONS.filter((i) => Boolean(v[i.key])).length;

    const cards = INTEGRATIONS.map((intg) => {
      const on = Boolean(v[intg.key]);
      const inp = document.createElement('input');
      inp.type = 'checkbox'; inp.checked = on;
      inp.addEventListener('change', () => set(intg.key, inp.checked));

      return h('div', { class: `intg-card ${on ? 'intg-card--on' : ''}` }, [
        h('div', { class: 'intg-card-top' }, [
          h('div', { class: 'intg-icon', style: `background:${intg.color}18;color:${intg.color}` }, [h('i', { class: intg.icon })]),
          h('label', { class: 'cc-toggle', onclick: (e: Event) => e.stopPropagation() }, [inp, h('span')]),
        ]),
        h('div', { class: 'intg-label' }, [intg.label]),
        h('div', { class: 'intg-desc'  }, [intg.desc]),
        h('div', { class: `intg-status ${on ? 'intg-status--on' : 'intg-status--off'}` }, [
          h('i', { class: on ? 'fas fa-circle-check' : 'fas fa-circle-xmark' }),
          on ? 'متصل' : 'غير متصل',
        ]),
      ]);
    });

    return h('div', { class: 'cc-panel' }, [
      h('div', { class: 'fp-header', style: '--fp-color:linear-gradient(135deg,#6366f1,#4f46e5)' }, [
        h('div', { class: 'fp-header-icon', style: 'background:linear-gradient(135deg,#6366f1,#4f46e5)' }, [h('i', { class: 'fas fa-plug' })]),
        h('div', {}, [
          h('h2', { class: 'fp-header-title' }, ['التكاملات']),
          h('p',  { class: 'fp-header-sub'   }, [`${enabled} من ${total} تكامل نشط`]),
        ]),
      ]),
      h('div', { class: 'fp-card' }, [
        h('div', { class: 'fp-card-head' }, [h('i', { class: 'fas fa-network-wired' }), h('span', {}, ['الخدمات المتاحة'])]),
        h('div', { class: 'fp-card-body' }, [h('div', { class: 'intg-grid' }, cards)]),
      ]),
    ]);
  }

  function rerender() { const n = build(); root.replaceWith(n); root = n; }
  root = build();
  return root;
}
