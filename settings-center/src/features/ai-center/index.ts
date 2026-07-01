import { h, escapeHtml, fromHtml } from '../../components/dom';
import { SettingsStore } from '../../core/store';
import { askAssistant, getUsageStats, recordUsage, type ChatMessage } from '../../services/aiService';
import { aiCenterSchema } from './schema';

// ── Markdown lite renderer ────────────────────────────────────────
function renderMarkdownLite(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(99,102,241,.12);padding:1px 5px;border-radius:4px;font-size:.92em">$1</code>')
    .replace(/\n/g, '<br>');
}

// ── Provider cards data ───────────────────────────────────────────
const PROVIDERS = [
  { id: 'OpenAI',   label: 'OpenAI',    icon: '🤖', color: '#10a37f', bg: 'rgba(16,163,127,.1)',  model: 'gpt-4o-mini' },
  { id: 'Claude',   label: 'Claude',    icon: '✦',  color: '#c25a1b', bg: 'rgba(194,90,27,.1)',   model: 'claude-sonnet-4-6' },
  { id: 'Gemini',   label: 'Gemini',    icon: '◈',  color: '#4285f4', bg: 'rgba(66,133,244,.1)',  model: 'gemini-2.0-flash' },
  { id: 'DeepSeek', label: 'DeepSeek',  icon: '⬡',  color: '#6366f1', bg: 'rgba(99,102,241,.1)',  model: 'deepseek-chat' },
];

// ── Main render ───────────────────────────────────────────────────
export function render(store: SettingsStore): HTMLElement {
  const getVals = () => store.getSectionValues(aiCenterSchema.key, aiCenterSchema.defaults);
  const setVal  = (patch: Record<string, unknown>) =>
    store.setSectionValues(aiCenterSchema.key, { ...getVals(), ...patch });

  let root: HTMLElement;

  function build(): HTMLElement {
    const v = getVals();

    // ── Provider cards ──────────────────────────────────────────
    const providerCards = h('div', { class: 'ai-provider-grid' },
      PROVIDERS.map(p => {
        const active = (v.provider || 'OpenAI') === p.id;
        const card = h('button', {
          class: `ai-provider-card${active ? ' ai-provider-card--active' : ''}`,
          type: 'button',
        }, [
          h('span', { class: 'ai-provider-icon', style: `color:${p.color};background:${p.bg}` }, [p.icon]),
          h('span', { class: 'ai-provider-label' }, [p.label]),
          ...(active ? [h('span', { class: 'ai-provider-check' }, ['✓'])] : []),
        ]);
        card.addEventListener('click', () => {
          setVal({ provider: p.id, model: p.model });
          rerender();
        });
        return card;
      })
    );

    // ── Config fields ───────────────────────────────────────────
    const apiKeyInput = h('input', {
      class: 'ai-field-input',
      type: 'password',
      placeholder: 'sk-... أو AIza... أو sk-ant-...',
      value: String(v.apiKey || ''),
    }) as HTMLInputElement;

    const eyeBtn = h('button', { class: 'ai-eye-btn', type: 'button', title: 'إظهار / إخفاء' }, [
      fromHtml('<i class="fas fa-eye"></i>'),
    ]);
    let showKey = false;
    eyeBtn.addEventListener('click', () => {
      showKey = !showKey;
      apiKeyInput.type = showKey ? 'text' : 'password';
      eyeBtn.innerHTML = showKey ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    });
    apiKeyInput.addEventListener('input', () => setVal({ apiKey: apiKeyInput.value.trim() }));

    const modelInput = h('input', {
      class: 'ai-field-input',
      type: 'text',
      placeholder: PROVIDERS.find(p => p.id === (v.provider || 'OpenAI'))?.model || 'gpt-4o-mini',
      value: String(v.model || ''),
    }) as HTMLInputElement;
    modelInput.addEventListener('input', () => setVal({ model: modelInput.value.trim() }));

    // Model picker dropdown
    const modelPicker = h('div', { class: 'ai-model-picker' });
    const fetchModelsBtn = h('button', {
      class: 'btn btn-outline-primary ai-fetch-btn',
      type: 'button',
      title: 'جلب النماذج المتاحة',
    }, [fromHtml('<i class="fas fa-list"></i>'), ' النماذج المتاحة']);

    fetchModelsBtn.addEventListener('click', async () => {
      fetchModelsBtn.setAttribute('disabled', '');
      fetchModelsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جارٍ الجلب...';
      modelPicker.innerHTML = '';
      try {
        const res = await (window as any).DB?.api()._fetch('/api/ai/models', { method: 'POST', body: '{}' });
        const models: string[] = res?.data?.models || [];
        if (models.length === 0) {
          modelPicker.innerHTML = '<div class="ai-model-empty">لا توجد نماذج متاحة</div>';
        } else {
          models.forEach(m => {
            const chip = h('button', { class: 'ai-model-chip', type: 'button' }, [m]);
            chip.addEventListener('click', () => {
              modelInput.value = m;
              setVal({ model: m });
              modelPicker.innerHTML = '';
            });
            modelPicker.append(chip);
          });
        }
      } catch {
        modelPicker.innerHTML = '<div class="ai-model-empty" style="color:#ef4444">تعذّر الجلب</div>';
      }
      fetchModelsBtn.removeAttribute('disabled');
      fetchModelsBtn.innerHTML = '<i class="fas fa-list"></i> النماذج المتاحة';
    });

    const tempInput = h('input', {
      class: 'ai-field-input',
      type: 'number', min: '0', max: '2', step: '0.1',
      value: String(v.temperature ?? 0.7),
    }) as HTMLInputElement;
    tempInput.addEventListener('input', () => setVal({ temperature: parseFloat(tempInput.value) || 0.7 }));

    const tokensInput = h('input', {
      class: 'ai-field-input',
      type: 'number', min: '100', max: '8000', step: '100',
      value: String(v.maxTokens ?? 1500),
    }) as HTMLInputElement;
    tokensInput.addEventListener('input', () => setVal({ maxTokens: parseInt(tokensInput.value) || 1500 }));

    const promptInput = h('textarea', {
      class: 'ai-field-input ai-field-textarea',
      placeholder: 'You are a smart HR assistant for Attendify Pro...',
      rows: 3,
    }) as HTMLTextAreaElement;
    promptInput.value = String(v.systemPrompt || '');
    promptInput.addEventListener('input', () => setVal({ systemPrompt: promptInput.value }));

    // ── Toggle options ──────────────────────────────────────────
    function makeToggle(key: string, label: string, icon: string): HTMLElement {
      const on = Boolean((v as Record<string, unknown>)[key] ?? true);
      const tog = h('div', { class: `ai-toggle-row${on ? ' ai-toggle-row--on' : ''}` }, [
        h('span', { class: 'ai-toggle-icon' }, [fromHtml(`<i class="fas ${icon}"></i>`)]),
        h('span', { class: 'ai-toggle-label' }, [label]),
        h('div', { class: `ai-toggle-switch${on ? ' ai-toggle-switch--on' : ''}` },
          [h('div', { class: 'ai-toggle-thumb' }, [])]),
      ]);
      tog.style.cursor = 'pointer';
      tog.addEventListener('click', () => {
        setVal({ [key]: !on });
        rerender();
      });
      return tog;
    }

    // ── Usage stats ─────────────────────────────────────────────
    const stats = getUsageStats();
    const usageSection = h('div', { class: 'ai-usage-grid' }, [
      h('div', { class: 'ai-usage-stat' }, [
        h('div', { class: 'ai-usage-num' }, [String(stats.requests)]),
        h('div', { class: 'ai-usage-lbl' }, ['طلب مُرسَل']),
      ]),
      h('div', { class: 'ai-usage-stat' }, [
        h('div', { class: 'ai-usage-num' }, [
          stats.lastUsed ? new Date(stats.lastUsed).toLocaleDateString('ar') : '—',
        ]),
        h('div', { class: 'ai-usage-lbl' }, ['آخر استخدام']),
      ]),
      h('div', { class: 'ai-usage-stat' }, [
        h('div', { class: 'ai-usage-num ai-status-dot' }, [
          h('span', { class: `ai-dot${v.apiKey ? ' ai-dot--on' : ''}` }, []),
          v.apiKey ? 'متصل' : 'غير مُعدَّ',
        ]),
        h('div', { class: 'ai-usage-lbl' }, ['حالة المزود']),
      ]),
    ]);

    // ── Config panel ────────────────────────────────────────────
    const configPanel = h('div', { class: 'ai-config-panel' }, [
      h('div', { class: 'ai-section-title' }, [
        fromHtml('<i class="fas fa-sliders"></i>'), ' الإعدادات',
      ]),

      providerCards,

      h('div', { class: 'ai-field-group' }, [
        h('label', { class: 'ai-field-label' }, ['مفتاح API']),
        h('div', { class: 'ai-field-wrap' }, [apiKeyInput, eyeBtn]),
      ]),
      h('div', { class: 'ai-field-group' }, [
        h('label', { class: 'ai-field-label' }, ['النموذج']),
        modelInput,
        fetchModelsBtn,
        modelPicker,
      ]),
      h('div', { class: 'ai-field-row-2' }, [
        h('div', { class: 'ai-field-group' }, [
          h('label', { class: 'ai-field-label' }, ['Temperature']),
          tempInput,
        ]),
        h('div', { class: 'ai-field-group' }, [
          h('label', { class: 'ai-field-label' }, ['Max Tokens']),
          tokensInput,
        ]),
      ]),
      h('div', { class: 'ai-field-group' }, [
        h('label', { class: 'ai-field-label' }, ['System Prompt']),
        promptInput,
      ]),

      makeToggle('memory',      'التذكّر الذكي في المحادثة', 'fa-brain'),
      makeToggle('suggestions', 'توصيات تلقائية',            'fa-lightbulb'),

      h('div', { class: 'ai-divider' }, []),
      h('div', { class: 'ai-section-title' }, [
        fromHtml('<i class="fas fa-chart-bar"></i>'), ' الاستخدام',
      ]),
      usageSection,
    ]);

    // ── Chat panel ──────────────────────────────────────────────
    const chatPanel = buildChat(v.apiKey ? true : false);

    return h('div', { class: 'cc-panel ai-root' }, [
      // Header
      h('div', { class: 'ai-page-header' }, [
        h('div', { class: 'ai-page-header-icon' }, [
          fromHtml('<i class="fas fa-robot"></i>'),
        ]),
        h('div', {}, [
          h('div', { class: 'ai-page-title' }, ['مركز الذكاء الاصطناعي']),
          h('div', { class: 'ai-page-desc' }, ['ضبط المزود والنموذج وتجربة المساعد الذكي مباشرةً']),
        ]),
      ]),
      // Body
      h('div', { class: 'ai-body' }, [configPanel, chatPanel]),
    ]);
  }

  function buildChat(hasKey: boolean): HTMLElement {
    const history: ChatMessage[] = [];
    const messages = h('div', { class: 'ai-chat-messages' });

    function addBubble(role: 'user' | 'assistant', html: string): HTMLElement {
      const bubble = h('div', { class: `ai-chat-msg ai-chat-msg--${role}` }, [
        h('div', { class: 'ai-chat-bubble' }),
      ]);
      (bubble.firstElementChild as HTMLElement).innerHTML = html;
      messages.append(bubble);
      messages.scrollTop = messages.scrollHeight;
      return bubble;
    }

    // Welcome message
    addBubble('assistant', hasKey
      ? 'مرحباً 👋 اسألني عن الموظفين، الحضور، الإجازات، أو أي بيانات في النظام — إجابتي مبنية على بياناتك الفعلية.'
      : '⚠️ أضف مفتاح API أولاً من إعدادات المزود على اليسار، ثم ابدأ المحادثة.');

    const input = h('input', {
      class: 'ai-chat-input',
      type: 'text',
      placeholder: hasKey ? 'اكتب سؤالك...' : 'أضف API Key أولاً...',
      disabled: !hasKey,
    }) as HTMLInputElement;

    const sendBtn = h('button', {
      class: 'btn btn-primary ai-send-btn',
      type: 'button',
      disabled: !hasKey,
    }, [fromHtml('<i class="fas fa-paper-plane"></i>')]);

    async function send(): Promise<void> {
      const text = input.value.trim();
      if (!text || !hasKey) return;
      input.value = '';
      sendBtn.setAttribute('disabled', '');
      input.setAttribute('disabled', '');
      addBubble('user', escapeHtml(text));
      const thinking = addBubble('assistant',
        '<span class="ai-thinking"><span></span><span></span><span></span></span>');

      const result = await askAssistant(text, history);

      sendBtn.removeAttribute('disabled');
      input.removeAttribute('disabled');
      input.focus();

      if (result.ok && result.reply) {
        history.push({ role: 'user', content: text }, { role: 'assistant', content: result.reply });
        recordUsage();
        (thinking.firstElementChild as HTMLElement).innerHTML = renderMarkdownLite(result.reply);
      } else {
        (thinking.firstElementChild as HTMLElement).innerHTML =
          `<span style="color:#ef4444">⚠ ${escapeHtml(result.error ?? 'تعذّر الاتصال')}</span>`;
      }
    }

    sendBtn.addEventListener('click', () => void send());
    input.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') void send(); });

    // Suggestions
    const suggestions = ['كم موظف غائب اليوم؟', 'من أكثر المتأخرين هذا الشهر؟', 'ملخص الرواتب لهذا الشهر'];
    const suggChips = h('div', { class: 'ai-suggestions' },
      suggestions.map(s => {
        const chip = h('button', { class: 'ai-suggestion-chip', type: 'button' }, [s]);
        chip.addEventListener('click', () => {
          if (!hasKey) return;
          input.value = s;
          void send();
        });
        return chip;
      })
    );

    return h('div', { class: 'ai-chat-panel' }, [
      h('div', { class: 'ai-chat-header' }, [
        fromHtml('<i class="fas fa-comments"></i>'),
        h('span', {}, [' تجربة المساعد']),
        h('span', { class: `ai-chat-status${hasKey ? ' ai-chat-status--on' : ''}` }, [
          hasKey ? 'جاهز' : 'غير مُعدَّ',
        ]),
      ]),
      messages,
      ...(hasKey ? [suggChips] : []),
      h('div', { class: 'ai-chat-input-row' }, [input, sendBtn]),
    ]);
  }

  function rerender(): void { const next = build(); root.replaceWith(next); root = next; }
  root = build();
  return root;
}
