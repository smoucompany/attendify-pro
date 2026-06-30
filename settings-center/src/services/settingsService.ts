import { legacy } from '../adapter/legacyBridge';
import type { SettingsState } from '../core/types';

function readStore() {
  const db = legacy.db();
  db.company.settingsCenter = db.company.settingsCenter || { values: {}, history: [], favorites: [], recent: [] };
  return db.company.settingsCenter;
}

export function loadInitialState(): SettingsState {
  const store = readStore();
  return {
    values: store.values ?? {},
    history: store.history ?? [],
    favorites: store.favorites ?? [],
    recent: store.recent ?? [],
  };
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;

export function persistState(state: SettingsState, opts: { immediate?: boolean } = {}): void {
  const db = legacy.db();
  const store = readStore();
  store.values = state.values;
  store.history = state.history;
  store.favorites = state.favorites;
  store.recent = state.recent;

  if (saveTimer) clearTimeout(saveTimer);
  const run = () => db.saveCompany();
  if (opts.immediate) run();
  else saveTimer = setTimeout(run, 500);
}
