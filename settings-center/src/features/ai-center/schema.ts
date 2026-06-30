import type { FeatureSchema } from '../../core/types';

export const aiCenterSchema: FeatureSchema = {
  key: 'ai-center',
  title: 'مركز الذكاء الاصطناعي',
  description: 'المزود، النموذج، إعدادات المساعد',
  icon: 'fas fa-robot',
  color: 'linear-gradient(135deg,#8b5cf6,#6366f1)',
  defaults: {
    provider: 'OpenAI', model: 'gpt-4o-mini', apiKey: '', temperature: 0.7, maxTokens: 1500,
    systemPrompt: 'You are a smart HR and operations assistant for Attendify Pro.',
    memory: true, suggestions: true,
  },
  fields: [
    { key: 'provider', label: 'المزود', type: 'select', options: [{ value: 'OpenAI', label: 'OpenAI' }, { value: 'Claude', label: 'Claude' }, { value: 'Gemini', label: 'Gemini' }, { value: 'DeepSeek', label: 'DeepSeek' }] },
    { key: 'model', label: 'النموذج', type: 'text' },
    { key: 'apiKey', label: 'API Key', type: 'password' },
    { key: 'temperature', label: 'Temperature', type: 'number' },
    { key: 'maxTokens', label: 'Max Tokens', type: 'number' },
    { key: 'systemPrompt', label: 'System Prompt', type: 'textarea' },
    { key: 'memory', label: 'التذكر الذكي ضمن المحادثة', type: 'toggle' },
    { key: 'suggestions', label: 'توصيات تلقائية', type: 'toggle' },
  ],
};
