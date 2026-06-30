/**
 * Single typed boundary between the new TS Settings Center and the existing
 * vanilla-JS app. The host app's modules are loaded as classic <script> tags
 * with top-level `const`/`let` (DB, App, SupabaseDB, currentLang, SettingsModule,
 * RolesModule, BackupModule) — those do NOT become `window.*` properties, but
 * they ARE visible as bare identifiers to every later classic script sharing
 * the same global scope (which this bundle, also loaded via <script src>, is).
 * So we declare them as ambient globals and reference them directly — no other
 * file in this project should reference these names itself.
 */

export interface FetchResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

interface LegacyCompany {
  settingsCenter?: {
    values: Record<string, Record<string, unknown>>;
    history: Array<{ sectionKey: string; at: string; values: Record<string, unknown> }>;
    favorites?: string[];
    recent?: string[];
  };
  [key: string]: unknown;
}

interface LegacyDB {
  company: LegacyCompany;
  saveCompany: () => Promise<void> | void;
  [key: string]: unknown;
}

interface LegacyApp {
  toast: (message: string, type?: 'success' | 'warning' | 'danger' | 'info', duration?: number) => void;
  openModal: (title: string, html: string, opts?: Record<string, unknown>) => void;
  closeModal: () => void;
  logout: () => void;
  [key: string]: unknown;
}

interface LegacySettingsModule {
  _company: () => string;
  _hours: () => string;
  _attendance: () => string;
  _leavesSettings: () => string;
  _payrollSettings: () => string;
  _signatures: () => string;
  _notifications: () => string;
  _integrations: () => string;
  _security: () => string;
  _appearance: () => string;
  openAIAssistant: () => void;
  [key: string]: unknown;
}

interface LegacyRenderable {
  render: (container: HTMLElement) => void;
}

interface LegacySupabaseDB {
  _fetch: (path: string, options?: RequestInit) => Promise<FetchResult>;
  [key: string]: unknown;
}

declare global {
  // eslint-disable-next-line no-var
  var DB: LegacyDB | undefined;
  // eslint-disable-next-line no-var
  var App: LegacyApp | undefined;
  // eslint-disable-next-line no-var
  var t: ((key: string, fallback?: string) => string) | undefined;
  // eslint-disable-next-line no-var
  var currentLang: string | undefined;
  // eslint-disable-next-line no-var
  var SettingsModule: LegacySettingsModule | undefined;
  // eslint-disable-next-line no-var
  var RolesModule: LegacyRenderable | undefined;
  // eslint-disable-next-line no-var
  var BackupModule: LegacyRenderable | undefined;
  // eslint-disable-next-line no-var
  var SupabaseDB: LegacySupabaseDB | undefined;
}

function required<T>(value: T | undefined, name: string): T {
  if (typeof value === 'undefined') throw new Error(`Settings Center: required legacy global "${name}" is not available yet`);
  return value;
}

export const legacy = {
  db(): LegacyDB {
    return required(typeof DB !== 'undefined' ? DB : undefined, 'DB');
  },
  app(): LegacyApp {
    return required(typeof App !== 'undefined' ? App : undefined, 'App');
  },
  t(key: string, fallback?: string): string {
    return typeof t !== 'undefined' ? t(key, fallback) : fallback ?? key;
  },
  lang(): 'ar' | 'en' {
    return typeof currentLang !== 'undefined' && currentLang === 'en' ? 'en' : 'ar';
  },
  settingsModule(): LegacySettingsModule {
    return required(typeof SettingsModule !== 'undefined' ? SettingsModule : undefined, 'SettingsModule');
  },
  rolesModule(): LegacyRenderable | undefined {
    return typeof RolesModule !== 'undefined' ? RolesModule : undefined;
  },
  backupModule(): LegacyRenderable | undefined {
    return typeof BackupModule !== 'undefined' ? BackupModule : undefined;
  },
  api(): LegacySupabaseDB {
    return required(typeof SupabaseDB !== 'undefined' ? SupabaseDB : undefined, 'SupabaseDB');
  },
};

export function onLegacyRerender(handler: () => void): () => void {
  window.addEventListener('sc:legacy-rerender', handler);
  return () => window.removeEventListener('sc:legacy-rerender', handler);
}
