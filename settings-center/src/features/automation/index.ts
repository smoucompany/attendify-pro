import { h } from '../../components/dom';
import { panelHeader, card, emptyState } from '../../components/Card';
import { SettingsStore } from '../../core/store';
import { toast } from '../../components/toast';
import { ACTION_OPTIONS, DEFAULT_AUTOMATION, TRIGGER_OPTIONS, type AutomationRule, type AutomationState } from './types';

const KEY = 'automation';

function getState(store: SettingsStore): AutomationState {
  return store.getSectionValues(KEY, DEFAULT_AUTOMATION as unknown as Record<string, unknown>) as unknown as AutomationState;
}

function setState(store: SettingsStore, state: AutomationState): void {
  store.setSectionValues(KEY, state as unknown as Record<string, unknown>);
}

function ruleRow(rule: AutomationRule, store: SettingsStore, rerender: () => void): HTMLElement {
  const triggerLabel = TRIGGER_OPTIONS.find((t) => t.value === rule.trigger)?.label ?? rule.trigger;
  const actionLabel = ACTION_OPTIONS.find((a) => a.value === rule.action)?.label ?? rule.action;

  const toggle = h('label', { class: 'cc-toggle' }, [
    (() => {
      const input = h('input', { type: 'checkbox' }) as HTMLInputElement;
      input.checked = rule.enabled;
      input.addEventListener('change', () => {
        const state = getState(store);
        const next = { ...state, rules: state.rules.map((r) => (r.id === rule.id ? { ...r, enabled: input.checked } : r)) };
        setState(store, next);
      });
      return input;
    })(),
    h('span', {}),
  ]);

  const removeBtn = h('button', {
    class: 'cc-icon-btn cc-icon-btn--danger', type: 'button', title: 'حذف',
    onclick: () => {
      const state = getState(store);
      setState(store, { ...state, rules: state.rules.filter((r) => r.id !== rule.id) });
      toast('تم حذف القاعدة', 'success');
      rerender();
    },
  }, [h('i', { class: 'fas fa-trash' })]);

  return h('div', { class: 'cc-rule-row' }, [
    h('div', { class: 'cc-rule-flow' }, [
      h('span', { class: 'cc-rule-chip cc-rule-chip--trigger' }, [triggerLabel]),
      h('i', { class: 'fas fa-arrow-left-long' }),
      h('span', { class: 'cc-rule-chip cc-rule-chip--action' }, [actionLabel]),
    ]),
    h('div', { class: 'cc-rule-controls' }, [toggle, removeBtn]),
  ]);
}

export function render(store: SettingsStore): HTMLElement {
  const state = getState(store);

  const container = h('div', { class: 'cc-panel' });
  const rerender = () => {
    container.replaceChildren(...renderInner());
  };

  function renderInner(): HTMLElement[] {
    const current = getState(store);
    const triggerSelect = document.createElement('select');
    triggerSelect.className = 'cc-input';
    TRIGGER_OPTIONS.forEach((opt) => {
      const o = document.createElement('option');
      o.value = opt.value; o.textContent = opt.label;
      triggerSelect.appendChild(o);
    });

    const actionSelect = document.createElement('select');
    actionSelect.className = 'cc-input';
    ACTION_OPTIONS.forEach((opt) => {
      const o = document.createElement('option');
      o.value = opt.value; o.textContent = opt.label;
      actionSelect.appendChild(o);
    });

    const addBtn = h('button', {
      class: 'btn btn-primary cc-btn-sm', type: 'button',
      onclick: () => {
        const fresh = getState(store);
        const rule: AutomationRule = {
          id: `r${Date.now()}`, trigger: triggerSelect.value, action: actionSelect.value, enabled: true,
        };
        setState(store, { ...fresh, rules: [...fresh.rules, rule] });
        toast('تمت إضافة القاعدة', 'success');
        rerender();
      },
    }, [h('i', { class: 'fas fa-plus' }), ' إضافة قاعدة']);

    const masterToggle = h('label', { class: 'cc-toggle' }, [
      (() => {
        const input = h('input', { type: 'checkbox' }) as HTMLInputElement;
        input.checked = current.masterEnabled;
        input.addEventListener('change', () => setState(store, { ...current, masterEnabled: input.checked }));
        return input;
      })(),
      h('span', {}),
    ]);

    return [
      panelHeader({ icon: 'fas fa-gears', title: 'الأتمتة', description: 'قواعد تشغيل تلقائية بدون برمجة — إذا حدث كذا، نفّذ كذا', color: 'linear-gradient(135deg,#22c55e,#16a34a)' }),
      card([
        h('div', { class: 'cc-card-title-row' }, [h('div', { class: 'cc-card-title' }, ['تفعيل الأتمتة']), masterToggle]),
      ]),
      card([
        h('div', { class: 'cc-card-title' }, ['إنشاء قاعدة جديدة']),
        h('div', { class: 'cc-rule-builder' }, [
          h('span', {}, ['إذا']), triggerSelect, h('span', {}, ['→ نفّذ']), actionSelect, addBtn,
        ]),
      ]),
      card([
        h('div', { class: 'cc-card-title' }, [`القواعد الحالية (${current.rules.length})`]),
        current.rules.length
          ? h('div', { class: 'cc-rules-list' }, current.rules.map((r) => ruleRow(r, store, rerender)))
          : emptyState('fas fa-gears', 'لا توجد قواعد بعد — أضف أول قاعدة أعلاه'),
      ]),
    ];
  }

  container.replaceChildren(...renderInner());
  void state;
  return container;
}
