import { h } from '../../components/dom';
import { SettingsStore } from '../../core/store';
import { appearanceSchema } from './schema';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#10b981', '#14b8a6',
  '#0ea5e9', '#2563eb', '#64748b', '#0f172a',
];

const ACCENT_COLORS = [
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316',
  '#f59e0b', '#ef4444', '#84cc16', '#64748b',
];

function sectionCard(title: string, icon: string, children: HTMLElement[]): HTMLElement {
  return h('div', { class: 'ap-card' }, [
    h('div', { class: 'ap-card-head' }, [
      h('i', { class: icon }),
      h('span', {}, [title]),
    ]),
    h('div', { class: 'ap-card-body' }, children),
  ]);
}

export function render(store: SettingsStore): HTMLElement {
  const vals = () => store.getSectionValues('appearance', appearanceSchema.defaults);
  const set  = (patch: Record<string, unknown>) => {
    store.setSectionValues('appearance', { ...vals(), ...patch });
    rerender();
  };

  let root: HTMLElement;

  function build(): HTMLElement {
    const v = vals();

    /* ── Theme selector ── */
    const themes = [
      { value: 'light', label: 'فاتح',    icon: 'fas fa-sun',            preview: '#f8fafc' },
      { value: 'dark',  label: 'داكن',    icon: 'fas fa-moon',           preview: '#0f172a' },
      { value: 'auto',  label: 'تلقائي',  icon: 'fas fa-circle-half-stroke', preview: 'linear-gradient(135deg,#f8fafc 50%,#0f172a 50%)' },
    ];
    const themeCards = themes.map((t) =>
      h('div', {
        class: `ap-theme-card ${v.theme === t.value ? 'ap-theme-card--active' : ''}`,
        onclick: () => set({ theme: t.value }),
      }, [
        h('div', { class: 'ap-theme-preview', style: `background:${t.preview}` }, [
          h('div', { class: 'ap-theme-preview-bar' }),
          h('div', { class: 'ap-theme-preview-content' }, [
            h('div', { class: 'ap-theme-preview-card' }),
            h('div', { class: 'ap-theme-preview-card' }),
            h('div', { class: 'ap-theme-preview-card' }),
          ]),
        ]),
        h('div', { class: 'ap-theme-label' }, [
          h('i', { class: t.icon }),
          h('span', {}, [t.label]),
          v.theme === t.value ? h('i', { class: 'fas fa-circle-check ap-theme-check' }) : h('span'),
        ]),
      ])
    );

    /* ── Color swatches ── */
    const colorRow = (key: string, label: string, colors: string[], current: string) =>
      h('div', { class: 'ap-color-row' }, [
        h('div', { class: 'ap-color-label' }, [
          h('span', {}, [label]),
          h('div', { class: 'ap-color-current' }, [
            h('div', { class: 'ap-color-dot', style: `background:${current}` }),
            h('code', {}, [current]),
          ]),
        ]),
        h('div', { class: 'ap-swatches' }, [
          ...colors.map((c) =>
            h('button', {
              class: `ap-swatch ${current === c ? 'ap-swatch--active' : ''}`,
              style: `background:${c}`,
              type: 'button',
              title: c,
              onclick: () => set({ [key]: c }),
            })
          ),
          (() => {
            const inp = document.createElement('input');
            inp.type = 'color';
            inp.value = current;
            inp.className = 'ap-color-input';
            inp.addEventListener('change', () => set({ [key]: inp.value }));
            const btn = h('button', { class: 'ap-swatch ap-swatch--custom', type: 'button', title: 'لون مخصص', onclick: () => inp.click() }, [
              h('i', { class: 'fas fa-plus' }),
            ]);
            btn.appendChild(inp);
            return btn;
          })(),
        ]),
      ]);

    /* ── Radius slider ── */
    const radiusVal = Number(v.radius ?? 16);
    const radiusSlider = document.createElement('input');
    radiusSlider.type = 'range'; radiusSlider.min = '0'; radiusSlider.max = '32';
    radiusSlider.value = String(radiusVal); radiusSlider.className = 'ap-slider';
    const radiusNum = h('span', { class: 'ap-slider-val' }, [`${radiusVal}px`]);
    const radiusPreview = h('div', { class: 'ap-radius-preview' }, [
      h('div', { class: 'ap-radius-box', style: `border-radius:${radiusVal}px` }),
      h('div', { class: 'ap-radius-box', style: `border-radius:${radiusVal}px` }),
      h('div', { class: 'ap-radius-box ap-radius-box--sm', style: `border-radius:${Math.round(radiusVal * 0.6)}px` }),
    ]);
    radiusSlider.addEventListener('input', () => {
      const r = Number(radiusSlider.value);
      radiusNum.textContent = `${r}px`;
      radiusPreview.querySelectorAll('.ap-radius-box').forEach((el, i) => {
        (el as HTMLElement).style.borderRadius = `${i === 2 ? Math.round(r * 0.6) : r}px`;
      });
    });
    radiusSlider.addEventListener('change', () => set({ radius: Number(radiusSlider.value) }));

    /* ── Style pickers ── */
    const stylePicker = (key: string, label: string, options: { value: string; label: string; icon: string }[], current: string) =>
      h('div', { class: 'ap-style-group' }, [
        h('div', { class: 'ap-style-label' }, [label]),
        h('div', { class: 'ap-style-options' }, options.map((o) =>
          h('button', {
            class: `ap-style-opt ${current === o.value ? 'ap-style-opt--active' : ''}`,
            type: 'button',
            onclick: () => set({ [key]: o.value }),
          }, [h('i', { class: o.icon }), h('span', {}, [o.label])])
        )),
      ]);

    /* ── Toggle rows ── */
    const toggleRow = (key: string, label: string, hint: string, icon: string, current: boolean) => {
      const inp = document.createElement('input');
      inp.type = 'checkbox'; inp.checked = current;
      inp.addEventListener('change', () => set({ [key]: inp.checked }));
      const toggle = h('label', { class: 'cc-toggle' }, [inp, h('span')]);
      return h('div', { class: 'ap-toggle-row' }, [
        h('div', { class: 'ap-toggle-left' }, [
          h('div', { class: 'ap-toggle-icon' }, [h('i', { class: icon })]),
          h('div', {}, [
            h('div', { class: 'ap-toggle-label' }, [label]),
            h('div', { class: 'ap-toggle-hint' }, [hint]),
          ]),
        ]),
        toggle,
      ]);
    };

    return h('div', { class: 'cc-panel' }, [
      /* header */
      h('div', { class: 'ap-header' }, [
        h('div', { class: 'ap-header-icon' }, [h('i', { class: 'fas fa-palette' })]),
        h('div', {}, [
          h('h2', { class: 'ap-header-title' }, ['المظهر']),
          h('p',  { class: 'ap-header-sub'   }, ['تخصيص شامل لمظهر النظام — الثيم والألوان والشكل العام']),
        ]),
      ]),

      /* theme */
      sectionCard('السمة', 'fas fa-moon', [
        h('div', { class: 'ap-theme-grid' }, themeCards),
      ]),

      /* colors */
      sectionCard('الألوان', 'fas fa-droplet', [
        colorRow('primaryColor', 'اللون الأساسي', PRESET_COLORS, String(v.primaryColor ?? '#6366f1')),
        colorRow('accentColor',  'لون التمييز',   ACCENT_COLORS, String(v.accentColor  ?? '#10b981')),
      ]),

      /* radius */
      sectionCard('استدارة الحواف', 'fas fa-vector-square', [
        h('div', { class: 'ap-radius-wrap' }, [
          h('div', { class: 'ap-radius-slider-row' }, [
            radiusSlider,
            radiusNum,
          ]),
          radiusPreview,
        ]),
      ]),

      /* styles */
      sectionCard('نمط العناصر', 'fas fa-swatchbook', [
        stylePicker('sidebarStyle', 'الشريط الجانبي', [
          { value: 'glass', label: 'زجاجي',  icon: 'fas fa-glass-water' },
          { value: 'solid', label: 'صلب',    icon: 'fas fa-square'      },
        ], String(v.sidebarStyle ?? 'glass')),
        stylePicker('headerStyle', 'الترويسة', [
          { value: 'minimal', label: 'بسيط', icon: 'fas fa-minus'     },
          { value: 'bold',    label: 'بارز', icon: 'fas fa-bold'      },
        ], String(v.headerStyle ?? 'minimal')),
        stylePicker('cardStyle', 'البطاقات', [
          { value: 'modern', label: 'عصري', icon: 'fas fa-layer-group' },
          { value: 'flat',   label: 'مسطح', icon: 'fas fa-square'      },
        ], String(v.cardStyle ?? 'modern')),
      ]),

      /* toggles */
      sectionCard('التأثيرات والأداء', 'fas fa-wand-magic-sparkles', [
        toggleRow('glassEffect',  'تأثير الزجاج',         'خلفيات شفافة مع ضبابية',          'fas fa-glass-water-droplet', Boolean(v.glassEffect)),
        toggleRow('animations',   'الحركات والانتقالات',  'تحريك العناصر عند التنقل',         'fas fa-film',                Boolean(v.animations)),
        toggleRow('compactMode',  'الوضع المضغوط',        'تقليل المسافات لعرض أكثر للبيانات','fas fa-compress',            Boolean(v.compactMode)),
      ]),
    ]);
  }

  function rerender() {
    const next = build();
    root.replaceWith(next);
    root = next;
  }

  root = build();
  return root;
}
