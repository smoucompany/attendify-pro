import { h } from '../../components/dom';
import { SettingsStore } from '../../core/store';
import { generalSchema } from './schema';

export function render(store: SettingsStore): HTMLElement {
  const vals = () => store.getSectionValues('general', generalSchema.defaults);
  const set  = (key: string, v: unknown) => { store.setSectionValues('general', { ...vals(), [key]: v }); };

  const v = vals();

  function inp(key: string, type = 'text'): HTMLInputElement {
    const el = document.createElement('input');
    el.type = type; el.className = 'cc-input'; el.value = String(v[key] ?? '');
    el.addEventListener('change', () => set(key, type === 'number' ? Number(el.value) : el.value));
    return el;
  }

  function sel(key: string, options: { value: string; label: string }[]): HTMLSelectElement {
    const el = document.createElement('select'); el.className = 'cc-input fp-select';
    options.forEach((o) => { const opt = document.createElement('option'); opt.value = o.value; opt.textContent = o.label; if (String(v[key]) === o.value) opt.selected = true; el.appendChild(opt); });
    el.addEventListener('change', () => set(key, el.value));
    return el;
  }

  const maintenanceInp = document.createElement('input');
  maintenanceInp.type = 'checkbox'; maintenanceInp.checked = Boolean(v['maintenanceMode']);
  maintenanceInp.addEventListener('change', () => set('maintenanceMode', maintenanceInp.checked));

  return h('div', { class: 'cc-panel' }, [
    h('div', { class: 'fp-header', style: '--fp-color:linear-gradient(135deg,#0ea5e9,#2563eb)' }, [
      h('div', { class: 'fp-header-icon', style: 'background:linear-gradient(135deg,#0ea5e9,#2563eb)' }, [h('i', { class: 'fas fa-sliders' })]),
      h('div', {}, [h('h2', { class: 'fp-header-title' }, ['الإعدادات العامة']), h('p', { class: 'fp-header-sub' }, ['اسم النظام، اللغة، العملة، التنسيقات'])]),
    ]),
    h('div', { class: 'fp-card' }, [
      h('div', { class: 'fp-card-head' }, [h('i', { class: 'fas fa-building' }), h('span', {}, ['هوية النظام'])]),
      h('div', { class: 'fp-card-body fp-config-body' }, [
        h('div', { class: 'fp-config-row' }, [h('label', { class: 'fp-config-label' }, [h('i', { class: 'fas fa-tag' }), 'اسم النظام']),    h('div', { class: 'fp-config-control' }, [inp('systemName')])]),
        h('div', { class: 'fp-config-row' }, [h('label', { class: 'fp-config-label' }, [h('i', { class: 'fas fa-building' }), 'اسم الشركة']), h('div', { class: 'fp-config-control' }, [inp('companyName')])]),
      ]),
    ]),
    h('div', { class: 'fp-card' }, [
      h('div', { class: 'fp-card-head' }, [h('i', { class: 'fas fa-globe' }), h('span', {}, ['اللغة والتنسيق'])]),
      h('div', { class: 'fp-card-body fp-config-body' }, [
        h('div', { class: 'fp-config-row' }, [h('label', { class: 'fp-config-label' }, [h('i', { class: 'fas fa-language' }), 'اللغة']),        h('div', { class: 'fp-config-control' }, [sel('language', [{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }])])]),
        h('div', { class: 'fp-config-row' }, [h('label', { class: 'fp-config-label' }, [h('i', { class: 'fas fa-earth-americas' }), 'المنطقة الزمنية']), h('div', { class: 'fp-config-control' }, [sel('timezone', [{ value: 'Asia/Riyadh', label: 'Asia/Riyadh (GMT+3)' }, { value: 'Asia/Dubai', label: 'Asia/Dubai (GMT+4)' }, { value: 'UTC', label: 'UTC' }])])]),
        h('div', { class: 'fp-config-row' }, [h('label', { class: 'fp-config-label' }, [h('i', { class: 'fas fa-coins' }), 'العملة']),         h('div', { class: 'fp-config-control' }, [sel('currency', [{ value: 'SAR', label: 'ريال سعودي (SAR)' }, { value: 'AED', label: 'درهم (AED)' }, { value: 'USD', label: 'دولار (USD)' }])])]),
        h('div', { class: 'fp-config-row' }, [h('label', { class: 'fp-config-label' }, [h('i', { class: 'fas fa-calendar' }), 'صيغة التاريخ']),  h('div', { class: 'fp-config-control' }, [sel('dateFormat', [{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }])])]),
        h('div', { class: 'fp-config-row' }, [h('label', { class: 'fp-config-label' }, [h('i', { class: 'fas fa-clock' }), 'صيغة الوقت']),    h('div', { class: 'fp-config-control' }, [sel('timeFormat', [{ value: '24h', label: '24 ساعة' }, { value: '12h', label: '12 ساعة (AM/PM)' }])])]),
        h('div', { class: 'fp-config-row' }, [h('label', { class: 'fp-config-label' }, [h('i', { class: 'fas fa-table-list' }), 'صفوف الصفحة']), h('div', { class: 'fp-config-control' }, [inp('rowsPerPage', 'number')])]),
      ]),
    ]),
    h('div', { class: 'fp-card fp-card--warning' }, [
      h('div', { class: 'fp-card-head fp-card-head--warning' }, [h('i', { class: 'fas fa-triangle-exclamation' }), h('span', {}, ['وضع الصيانة'])]),
      h('div', { class: 'fp-card-body' }, [
        h('div', { class: 'fp-toggle-row' }, [
          h('div', { class: 'fp-toggle-meta' }, [
            h('div', { class: 'fp-toggle-label' }, ['تفعيل وضع الصيانة']),
            h('div', { class: 'fp-toggle-hint'  }, ['يُخفي النظام عن جميع الموظفين مؤقتاً']),
          ]),
          h('label', { class: 'cc-toggle' }, [maintenanceInp, h('span')]),
        ]),
      ]),
    ]),
  ]);
}
