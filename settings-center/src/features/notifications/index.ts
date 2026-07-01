import { h } from '../../components/dom';
import { SettingsStore } from '../../core/store';
import { notificationsSchema } from './schema';

const CHANNELS = [
  { key: 'email',    label: 'البريد الإلكتروني', icon: 'fas fa-envelope',      color: '#0ea5e9', desc: 'إشعارات عبر البريد' },
  { key: 'sms',      label: 'رسائل SMS',          icon: 'fas fa-comment-sms',   color: '#10b981', desc: 'رسائل نصية قصيرة' },
  { key: 'whatsapp', label: 'WhatsApp',            icon: 'fab fa-whatsapp',      color: '#25d366', desc: 'مجموعات أو خاص' },
  { key: 'telegram', label: 'Telegram',            icon: 'fab fa-telegram',      color: '#0088cc', desc: 'قناة أو بوت' },
  { key: 'push',     label: 'Push Notifications', icon: 'fas fa-mobile-screen', color: '#8b5cf6', desc: 'إشعارات التطبيق' },
  { key: 'desktop',  label: 'سطح المكتب',          icon: 'fas fa-desktop',       color: '#6366f1', desc: 'إشعارات المتصفح' },
];

export function render(store: SettingsStore): HTMLElement {
  const vals = () => store.getSectionValues('notifications', notificationsSchema.defaults);
  const set  = (key: string, v: unknown) => { store.setSectionValues('notifications', { ...vals(), [key]: v }); rerender(); };

  let root: HTMLElement;

  function build(): HTMLElement {
    const v = vals();

    const channelCards = CHANNELS.map((ch) => {
      const active = Boolean(v[ch.key]);
      const inp = document.createElement('input');
      inp.type = 'checkbox'; inp.checked = active;
      inp.addEventListener('change', () => set(ch.key, inp.checked));
      return h('div', { class: `notif-channel ${active ? 'notif-channel--on' : ''}`, onclick: () => { inp.checked = !inp.checked; set(ch.key, inp.checked); } }, [
        h('div', { class: 'notif-channel-top' }, [
          h('div', { class: 'notif-channel-icon', style: `background:${ch.color}22;color:${ch.color}` }, [h('i', { class: ch.icon })]),
          h('span', { class: `notif-badge ${active ? 'notif-badge--on' : 'notif-badge--off'}` }, [active ? 'مفعّل' : 'معطّل']),
        ]),
        h('div', { class: 'notif-channel-label' }, [ch.label]),
        h('div', { class: 'notif-channel-desc'  }, [ch.desc]),
        h('div', { class: 'notif-channel-footer' }, [h('label', { class: 'cc-toggle', onclick: (e: Event) => e.stopPropagation() }, [inp, h('span')])]),
      ]);
    });

    const rulesInp = document.createElement('input');
    rulesInp.type = 'checkbox'; rulesInp.checked = Boolean(v['rules']);
    rulesInp.addEventListener('change', () => set('rules', rulesInp.checked));

    return h('div', { class: 'cc-panel' }, [
      h('div', { class: 'fp-header', style: '--fp-color:linear-gradient(135deg,#f97316,#ea580c)' }, [
        h('div', { class: 'fp-header-icon', style: 'background:linear-gradient(135deg,#f97316,#ea580c)' }, [h('i', { class: 'fas fa-bell' })]),
        h('div', {}, [h('h2', { class: 'fp-header-title' }, ['الإشعارات']), h('p', { class: 'fp-header-sub' }, ['تفعيل وتعطيل قنوات الإشعار المختلفة'])]),
      ]),
      h('div', { class: 'fp-card' }, [
        h('div', { class: 'fp-card-head' }, [h('i', { class: 'fas fa-satellite-dish' }), h('span', {}, ['قنوات الإشعار'])]),
        h('div', { class: 'fp-card-body' }, [h('div', { class: 'notif-grid' }, channelCards)]),
      ]),
      h('div', { class: 'fp-card' }, [
        h('div', { class: 'fp-card-head' }, [h('i', { class: 'fas fa-robot' }), h('span', {}, ['الإشعارات الذكية'])]),
        h('div', { class: 'fp-card-body' }, [
          h('div', { class: 'fp-toggle-row' }, [
            h('div', { class: 'fp-toggle-meta' }, [h('div', { class: 'fp-toggle-label' }, ['قواعد الإشعارات الذكية']), h('div', { class: 'fp-toggle-hint' }, ['إرسال إشعارات تلقائية بناءً على قواعد محددة'])]),
            h('label', { class: 'cc-toggle' }, [rulesInp, h('span')]),
          ]),
        ]),
      ]),
    ]);
  }

  function rerender() { const n = build(); root.replaceWith(n); root = n; }
  root = build();
  return root;
}
