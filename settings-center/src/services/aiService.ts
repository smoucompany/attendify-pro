import { legacy } from '../adapter/legacyBridge';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  ok: boolean;
  reply?: string;
  error?: string;
}

export async function askAssistant(message: string, history: ChatMessage[]): Promise<ChatResult> {
  try {
    const res = await legacy.api()._fetch('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history: history.slice(-8) }),
    });
    const data = res.data as { reply?: string; error?: string };
    if (res.ok && data.reply) return { ok: true, reply: data.reply };
    return { ok: false, error: data.error || 'تعذّر الاتصال بمزود الذكاء الاصطناعي' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'خطأ غير متوقع' };
  }
}

// Local, no-network usage counters (no provider exposes a billing API we can call from the browser).
const USAGE_KEY = 'sc-ai-usage';

export interface UsageStats {
  requests: number;
  lastUsed: string | null;
}

export function getUsageStats(): UsageStats {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (raw) return JSON.parse(raw) as UsageStats;
  } catch {
    /* ignore corrupt local usage data */
  }
  return { requests: 0, lastUsed: null };
}

export function recordUsage(): UsageStats {
  const stats = getUsageStats();
  const next: UsageStats = { requests: stats.requests + 1, lastUsed: new Date().toISOString() };
  localStorage.setItem(USAGE_KEY, JSON.stringify(next));
  return next;
}
