import { h, escapeHtml, fromHtml } from '../../components/dom';
import { SettingsStore } from '../../core/store';
import { askAssistant, getUsageStats, recordUsage, type ChatMessage } from '../../services/aiService';
import { aiCenterSchema } from './schema';

function md(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(99,102,241,.15);padding:1px 6px;border-radius:4px;font-size:.9em;font-family:monospace">$1</code>')
    .replace(/\n\n/g, '</p><p style="margin:.5em 0">')
    .replace(/\n/g, '<br>');
}

const PROVIDERS = [
  { id: 'Groq',     label: 'Groq',     sub: 'مجاني • سريع',    icon: 'fa-bolt',        color: '#f55036', grad: 'linear-gradient(135deg,#f55036,#ff8c69)', model: 'llama-3.3-70b-versatile' },
  { id: 'OpenAI',   label: 'OpenAI',   sub: 'GPT-4o',           icon: 'fa-robot',       color: '#10a37f', grad: 'linear-gradient(135deg,#10a37f,#34d399)', model: 'gpt-4o-mini' },
  { id: 'Gemini',   label: 'Gemini',   sub: 'Google AI',        icon: 'fa-gem',         color: '#4285f4', grad: 'linear-gradient(135deg,#4285f4,#60a5fa)', model: 'gemini-2.0-flash' },
  { id: 'Claude',   label: 'Claude',   sub: 'Anthropic',        icon: 'fa-wand-sparkles',color: '#c25a1b',grad: 'linear-gradient(135deg,#c25a1b,#fb923c)', model: 'claude-sonnet-4-6' },
  { id: 'DeepSeek', label: 'DeepSeek', sub: 'R1 / V3',          icon: 'fa-microchip',   color: '#6366f1', grad: 'linear-gradient(135deg,#6366f1,#8b5cf6)', model: 'deepseek-chat' },
];

export function render(store: SettingsStore): HTMLElement {
  const getVals = () => store.getSectionValues(aiCenterSchema.key, aiCenterSchema.defaults);
  const setVal  = (p: Record<string, unknown>) =>
    store.setSectionValues(aiCenterSchema.key, { ...getVals(), ...p });

  // ── chat history (survives rerenders via closure ref) ────────────
  const chatHistory: ChatMessage[] = [];
  let chatMessagesEl: HTMLElement | null = null;

  let root: HTMLElement;

  function build(): HTMLElement {
    const v = getVals();
    const stats  = getUsageStats();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const active = (PROVIDERS.find(p => p.id === (v.provider || 'Groq')) ?? PROVIDERS[0])!;
    const hasKey = Boolean(v.apiKey);

    // ════════════════════════════════════════════════════════════════
    // HERO HEADER
    // ════════════════════════════════════════════════════════════════
    const hero = h('div', { class: 'aic-hero' }, [
      h('div', { class: 'aic-hero-glow' }, []),
      h('div', { class: 'aic-hero-content' }, [
        h('div', { class: 'aic-hero-icon', style: `background:${active.grad}` }, [
          fromHtml(`<i class="fas ${active.icon}"></i>`),
        ]),
        h('div', { class: 'aic-hero-text' }, [
          h('h2', { class: 'aic-hero-title' }, ['مركز الذكاء الاصطناعي']),
          h('p',  { class: 'aic-hero-sub'   }, [`المزود النشط: ${active.label} — ${active.sub}`]),
        ]),
        h('div', { class: 'aic-hero-stats' }, [
          heroStat(fromHtml(`<i class="fas fa-paper-plane"></i>`), String(stats.requests), 'طلب'),
          heroStat(fromHtml(`<i class="fas fa-clock"></i>`),
            stats.lastUsed ? new Date(stats.lastUsed).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '—',
            'آخر استخدام'),
          h('div', { class: `aic-status-pill${hasKey ? ' aic-status-pill--on' : ''}` }, [
            h('span', { class: 'aic-status-dot' }, []),
            hasKey ? 'متصل' : 'غير مُعدَّ',
          ]),
        ]),
      ]),
    ]);

    // ════════════════════════════════════════════════════════════════
    // PROVIDER TABS
    // ════════════════════════════════════════════════════════════════
    const providerTabs = h('div', { class: 'aic-provider-tabs' },
      PROVIDERS.map(p => {
        const isActive = p.id === (v.provider || 'Groq');
        const tab = h('button', { class: `aic-tab${isActive ? ' aic-tab--active' : ''}`, type: 'button' }, [
          h('span', { class: 'aic-tab-icon', style: isActive ? `background:${p.grad};color:#fff` : `color:${p.color};background:${p.color}1a` }, [
            fromHtml(`<i class="fas ${p.icon}"></i>`),
          ]),
          h('div', { class: 'aic-tab-text' }, [
            h('span', { class: 'aic-tab-name' }, [p.label]),
            h('span', { class: 'aic-tab-sub'  }, [p.sub]),
          ]),
        ]);
        if (isActive) tab.style.setProperty('--tab-color', p.color);
        tab.addEventListener('click', () => { setVal({ provider: p.id, model: p.model }); rerender(); });
        return tab;
      })
    );

    // ════════════════════════════════════════════════════════════════
    // CONFIG SIDEBAR
    // ════════════════════════════════════════════════════════════════

    // API Key
    const keyInput = h('input', {
      class: 'aic-input', type: 'password',
      placeholder: 'الصق مفتاح الـ API هنا...',
      value: String(v.apiKey || ''),
    }) as HTMLInputElement;
    let showKey = false;
    const eyeBtn = h('button', { class: 'aic-eye', type: 'button' }, [fromHtml('<i class="fas fa-eye"></i>')]);
    eyeBtn.addEventListener('click', () => {
      showKey = !showKey;
      keyInput.type = showKey ? 'text' : 'password';
      eyeBtn.innerHTML = showKey ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    });
    keyInput.addEventListener('input', () => setVal({ apiKey: keyInput.value.trim() }));

    // Model
    const modelInput = h('input', {
      class: 'aic-input', type: 'text',
      placeholder: active.model,
      value: String(v.model || ''),
    }) as HTMLInputElement;
    modelInput.addEventListener('input', () => setVal({ model: modelInput.value.trim() }));

    const modelPicker = h('div', { class: 'aic-model-chips' });
    const fetchBtn = h('button', { class: 'aic-fetch-btn', type: 'button' }, [
      fromHtml('<i class="fas fa-sync-alt"></i>'), ' جلب النماذج',
    ]);
    fetchBtn.addEventListener('click', async () => {
      fetchBtn.setAttribute('disabled', '');
      fetchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جارٍ الجلب...';
      modelPicker.innerHTML = '';
      try {
        const res = await (window as any).DB?.api()._fetch('/api/ai/models', { method: 'POST', body: '{}' });
        const models: string[] = res?.data?.models || [];
        if (!models.length) {
          modelPicker.innerHTML = '<span class="aic-empty-chips">لا توجد نماذج</span>';
        } else {
          models.forEach(m => {
            const c = h('button', { class: 'aic-chip', type: 'button' }, [m]);
            c.addEventListener('click', () => { modelInput.value = m; setVal({ model: m }); modelPicker.innerHTML = ''; });
            modelPicker.append(c);
          });
        }
      } catch { modelPicker.innerHTML = '<span class="aic-empty-chips" style="color:#ef4444">تعذّر الجلب</span>'; }
      fetchBtn.removeAttribute('disabled');
      fetchBtn.innerHTML = '<i class="fas fa-sync-alt"></i> جلب النماذج';
    });

    // Temp + Tokens
    const tempInput = h('input', {
      class: 'aic-input', type: 'number', min: '0', max: '2', step: '0.1',
      value: String(v.temperature ?? 0.7),
    }) as HTMLInputElement;
    tempInput.addEventListener('input', () => setVal({ temperature: parseFloat(tempInput.value) || 0.7 }));

    const tokensInput = h('input', {
      class: 'aic-input', type: 'number', min: '100', max: '8000', step: '100',
      value: String(v.maxTokens ?? 1500),
    }) as HTMLInputElement;
    tokensInput.addEventListener('input', () => setVal({ maxTokens: parseInt(tokensInput.value) || 1500 }));

    // Prompt
    const promptArea = h('textarea', {
      class: 'aic-textarea', rows: 3,
      placeholder: 'أنت مساعد ذكي متخصص في إدارة الموارد البشرية...',
    }) as HTMLTextAreaElement;
    promptArea.value = String(v.systemPrompt || '');
    promptArea.addEventListener('input', () => setVal({ systemPrompt: promptArea.value }));

    // Toggle
    function toggle(key: string, label: string, icon: string): HTMLElement {
      const on = Boolean((v as Record<string, unknown>)[key] ?? true);
      const el = h('label', { class: 'aic-toggle' }, [
        fromHtml(`<i class="fas ${icon} aic-toggle-ico"></i>`),
        h('span', { class: 'aic-toggle-lbl' }, [label]),
        h('div', { class: `aic-switch${on ? ' aic-switch--on' : ''}` }, [h('div', { class: 'aic-thumb' })]),
      ]);
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => { setVal({ [key]: !on }); rerender(); });
      return el;
    }

    const sidebar = h('div', { class: 'aic-sidebar' }, [
      // Key section
      h('div', { class: 'aic-section' }, [
        h('div', { class: 'aic-section-head' }, [fromHtml('<i class="fas fa-key"></i>'), ' مفتاح API']),
        h('div', { class: 'aic-key-wrap' }, [keyInput, eyeBtn]),
        h('div', { class: 'aic-hint' }, [
          fromHtml(`<i class="fas fa-circle-info"></i> احصل على مفتاح مجاني من <strong>${active.label}</strong>`),
        ]),
      ]),
      // Model section
      h('div', { class: 'aic-section' }, [
        h('div', { class: 'aic-section-head' }, [fromHtml('<i class="fas fa-microchip"></i>'), ' النموذج']),
        h('div', { class: 'aic-model-row' }, [modelInput, fetchBtn]),
        modelPicker,
      ]),
      // Params
      h('div', { class: 'aic-section' }, [
        h('div', { class: 'aic-section-head' }, [fromHtml('<i class="fas fa-sliders"></i>'), ' المعاملات']),
        h('div', { class: 'aic-params-grid' }, [
          h('div', { class: 'aic-param' }, [h('label', { class: 'aic-label' }, ['Temperature']), tempInput]),
          h('div', { class: 'aic-param' }, [h('label', { class: 'aic-label' }, ['Max Tokens']),  tokensInput]),
        ]),
      ]),
      // Prompt
      h('div', { class: 'aic-section' }, [
        h('div', { class: 'aic-section-head' }, [fromHtml('<i class="fas fa-scroll"></i>'), ' System Prompt']),
        promptArea,
      ]),
      // Toggles
      h('div', { class: 'aic-section aic-section--toggles' }, [
        toggle('memory',      'التذكّر الذكي', 'fa-brain'),
        toggle('suggestions', 'توصيات تلقائية', 'fa-lightbulb'),
      ]),
    ]);

    // ════════════════════════════════════════════════════════════════
    // CHAT PANEL
    // ════════════════════════════════════════════════════════════════
    const chatPanel = buildChat(hasKey, v.provider as string || 'Groq');

    const body = h('div', { class: 'aic-body' }, [
      providerTabs,
      h('div', { class: 'aic-main' }, [sidebar, chatPanel]),
    ]);

    return h('div', { class: 'cc-panel aic-root' }, [hero, body]);
  }

  // ── Chat builder ─────────────────────────────────────────────────
  function buildChat(hasKey: boolean, providerName: string): HTMLElement {
    const msgWrap = h('div', { class: 'aic-chat-wrap' });
    chatMessagesEl = msgWrap;

    function bubble(role: 'user' | 'assistant', html: string, ts?: string): HTMLElement {
      const time = ts || new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
      const el = h('div', { class: `aic-msg aic-msg--${role}` }, [
        role === 'assistant'
          ? h('div', { class: 'aic-avatar' }, [fromHtml('<i class="fas fa-robot"></i>')])
          : h('div', { class: 'aic-avatar aic-avatar--user' }, [fromHtml('<i class="fas fa-user"></i>')]),
        h('div', { class: 'aic-bubble-wrap' }, [
          h('div', { class: 'aic-bubble' }),
          h('span', { class: 'aic-ts' }, [time]),
        ]),
      ]);
      (el.querySelector('.aic-bubble') as HTMLElement).innerHTML = html;
      msgWrap.append(el);
      msgWrap.scrollTop = msgWrap.scrollHeight;
      return el;
    }

    // Restore chat history
    if (chatHistory.length === 0) {
      bubble('assistant',
        hasKey
          ? `مرحباً! أنا مساعدك الذكي المدعوم بـ <strong>${providerName}</strong> 🤖<br>اسألني عن الموظفين، الحضور، الرواتب، أو أي بيانات في النظام.`
          : '⚠️ <strong>لم يتم إعداد مفتاح API بعد</strong><br>اختر مزوداً من التبويبات وأضف مفتاح API من الإعدادات على اليسار.'
      );
    } else {
      chatHistory.forEach(m =>
        bubble(m.role === 'user' ? 'user' : 'assistant', m.role === 'user' ? escapeHtml(m.content) : md(m.content))
      );
    }

    const input = h('input', {
      class: 'aic-chat-input',
      type: 'text',
      placeholder: hasKey ? 'اكتب سؤالك واضغط Enter...' : 'أضف مفتاح API أولاً...',
      disabled: !hasKey,
    }) as HTMLInputElement;

    const sendBtn = h('button', { class: 'aic-send', type: 'button', disabled: !hasKey }, [
      fromHtml('<i class="fas fa-paper-plane"></i>'),
    ]);

    const clearBtn = h('button', { class: 'aic-clear', type: 'button', title: 'مسح المحادثة' }, [
      fromHtml('<i class="fas fa-broom"></i>'),
    ]);
    clearBtn.addEventListener('click', () => {
      chatHistory.length = 0;
      msgWrap.innerHTML = '';
      bubble('assistant', `المحادثة جاهزة ✨ اسألني عن أي شيء في النظام.`);
    });

    async function send(): Promise<void> {
      const text = input.value.trim();
      if (!text || !hasKey) return;
      input.value = '';
      sendBtn.setAttribute('disabled', '');
      input.setAttribute('disabled', '');
      bubble('user', escapeHtml(text));
      const thinkEl = bubble('assistant', '<span class="aic-thinking"><span></span><span></span><span></span></span>');
      const thinkBubble = thinkEl.querySelector('.aic-bubble') as HTMLElement;

      const result = await askAssistant(text, chatHistory.slice(-8));
      sendBtn.removeAttribute('disabled');
      input.removeAttribute('disabled');
      input.focus();

      if (result.ok && result.reply) {
        chatHistory.push({ role: 'user', content: text }, { role: 'assistant', content: result.reply });
        recordUsage();
        thinkBubble.innerHTML = md(result.reply);
      } else {
        thinkBubble.innerHTML = `<span style="color:#ef4444"><i class="fas fa-triangle-exclamation"></i> ${escapeHtml(result.error ?? 'تعذّر الاتصال')}</span>`;
      }
      msgWrap.scrollTop = msgWrap.scrollHeight;
    }

    sendBtn.addEventListener('click', () => void send());
    input.addEventListener('keydown', e => { if ((e as KeyboardEvent).key === 'Enter') void send(); });

    // Quick suggestions
    const suggs = ['كم موظف غائب اليوم؟', 'من أكثر المتأخرين هذا الشهر؟', 'ملخص الرواتب', 'حالة الإجازات المعلقة'];
    const suggRow = h('div', { class: 'aic-sugg-row' },
      suggs.map(s => {
        const c = h('button', { class: 'aic-sugg', type: 'button' }, [s]);
        c.addEventListener('click', () => { if (!hasKey) return; input.value = s; void send(); });
        return c;
      })
    );

    return h('div', { class: 'aic-chat' }, [
      h('div', { class: 'aic-chat-head' }, [
        fromHtml('<i class="fas fa-comments"></i>'),
        h('span', {}, [' المساعد الذكي']),
        h('div', { class: 'aic-chat-head-actions' }, [clearBtn]),
      ]),
      msgWrap,
      hasKey ? suggRow : h('div', {}),
      h('div', { class: 'aic-chat-foot' }, [input, sendBtn]),
    ]);
  }

  function heroStat(icon: HTMLElement, val: string, lbl: string): HTMLElement {
    return h('div', { class: 'aic-hero-stat' }, [icon, h('strong', {}, [val]), h('span', {}, [lbl])]);
  }

  function rerender(): void { const n = build(); root.replaceWith(n); root = n; }
  root = build();
  return root;
}
