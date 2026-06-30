import { h, escapeHtml } from '../../components/dom';
import { panelHeader, card } from '../../components/Card';
import { renderField } from '../../components/Field';
import { SettingsStore } from '../../core/store';
import { askAssistant, getUsageStats, recordUsage, type ChatMessage } from '../../services/aiService';
import { legacy } from '../../adapter/legacyBridge';
import { aiCenterSchema } from './schema';

function renderMarkdownLite(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function chatCard(): HTMLElement {
  const history: ChatMessage[] = [];
  const messages = h('div', { class: 'cc-chat-messages' });
  const input = h('input', { class: 'cc-input', placeholder: 'اسأل عن أي شيء في النظام...' }) as HTMLInputElement;

  function addBubble(role: 'user' | 'assistant', html: string): HTMLElement {
    const bubble = h('div', { class: `cc-chat-msg cc-chat-msg--${role}` }, [h('div', { class: 'cc-chat-bubble' })]);
    (bubble.firstElementChild as HTMLElement).innerHTML = html;
    messages.append(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  }

  async function send(): Promise<void> {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addBubble('user', escapeHtml(text));
    const thinking = addBubble('assistant', '<span class="cc-thinking"><span></span><span></span><span></span></span>');

    const result = await askAssistant(text, history);
    if (result.ok && result.reply) {
      history.push({ role: 'user', content: text }, { role: 'assistant', content: result.reply });
      recordUsage();
      (thinking.firstElementChild as HTMLElement).innerHTML = renderMarkdownLite(result.reply);
    } else {
      (thinking.firstElementChild as HTMLElement).innerHTML =
        `${renderMarkdownLite(result.error ?? 'تعذّر الاتصال')}`;
    }
  }

  const sendBtn = h('button', { class: 'btn btn-primary cc-btn-sm', type: 'button', onclick: () => void send() }, [
    h('i', { class: 'fas fa-paper-plane' }),
  ]);
  input.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') void send();
  });

  addBubble('assistant', 'مرحباً 👋 اسألني عن الموظفين، الحضور، الإجازات، أو أي بيانات في النظام — إجابتي مبنية على بياناتك الفعلية.');

  return card([
    h('div', { class: 'cc-card-title' }, ['تجربة المساعد']),
    messages,
    h('div', { class: 'cc-chat-input-row' }, [input, sendBtn]),
  ], 'cc-card--chat');
}

function usageCard(): HTMLElement {
  const stats = getUsageStats();
  return card([
    h('div', { class: 'cc-card-title' }, ['الاستخدام']),
    h('div', { class: 'cc-usage-row' }, [
      h('span', {}, ['عدد الطلبات']),
      h('strong', {}, [String(stats.requests)]),
    ]),
    h('div', { class: 'cc-usage-row' }, [
      h('span', {}, ['آخر استخدام']),
      h('strong', {}, [stats.lastUsed ? new Date(stats.lastUsed).toLocaleString() : '—']),
    ]),
    h('div', { class: 'cc-field-hint' }, ['عدّادات محلية — لا يوجد تكامل مع فوترة المزوّد بعد.']),
  ]);
}

export function render(store: SettingsStore): HTMLElement {
  const values = store.getSectionValues(aiCenterSchema.key, aiCenterSchema.defaults);

  const configCard = card([
    h('div', { class: 'cc-card-title' }, ['إعدادات المزوّد']),
    h('div', { class: 'cc-fields-grid' }, aiCenterSchema.fields.map((field) =>
      renderField(field, values[field.key], (value) => {
        const current = store.getSectionValues(aiCenterSchema.key, aiCenterSchema.defaults);
        store.setSectionValues(aiCenterSchema.key, { ...current, [field.key]: value });
      }),
    )),
  ]);

  const legacyCheckBtn = h('button', {
    class: 'btn btn-outline-primary cc-btn-sm', type: 'button',
    onclick: () => legacy.settingsModule().openAIAssistant(),
  }, [h('i', { class: 'fas fa-list-check' }), ' فحص سريع للإعدادات']);

  return h('div', { class: 'cc-panel' }, [
    panelHeader({
      icon: aiCenterSchema.icon, title: aiCenterSchema.title, description: aiCenterSchema.description,
      color: aiCenterSchema.color, actions: [legacyCheckBtn],
    }),
    h('div', { class: 'cc-grid-2' }, [configCard, usageCard()]),
    chatCard(),
  ]);
}
