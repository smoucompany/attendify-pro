import type { HistoryEntry, SectionValues, SettingsState } from './types';

type Listener = (state: SettingsState) => void;

const MAX_HISTORY = 50;

export class SettingsStore {
  private state: SettingsState;
  private listeners = new Set<Listener>();
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];

  constructor(initial: SettingsState) {
    this.state = initial;
  }

  getState(): SettingsState {
    return this.state;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    this.listeners.forEach((fn) => fn(this.state));
  }

  getSectionValues(sectionKey: string, defaults: SectionValues): SectionValues {
    return this.state.values[sectionKey] ?? defaults;
  }

  setSectionValues(sectionKey: string, values: SectionValues, opts: { pushHistory?: boolean } = {}): void {
    const prev = this.state.values[sectionKey];
    this.state = { ...this.state, values: { ...this.state.values, [sectionKey]: values } };

    if (opts.pushHistory !== false) {
      if (prev) this.undoStack.push({ sectionKey, at: new Date().toISOString(), values: prev });
      this.redoStack = [];
      const entry: HistoryEntry = { sectionKey, at: new Date().toISOString(), values };
      this.state = { ...this.state, history: [...this.state.history, entry].slice(-MAX_HISTORY) };
    }
    this.emit();
  }

  setField(sectionKey: string, defaults: SectionValues, field: string, value: unknown): void {
    const current = this.getSectionValues(sectionKey, defaults);
    this.setSectionValues(sectionKey, { ...current, [field]: value });
  }

  undo(): HistoryEntry | null {
    const entry = this.undoStack.pop();
    if (!entry) return null;
    const current = this.state.values[entry.sectionKey];
    if (current) this.redoStack.push({ sectionKey: entry.sectionKey, at: new Date().toISOString(), values: current });
    this.state = { ...this.state, values: { ...this.state.values, [entry.sectionKey]: entry.values } };
    this.emit();
    return entry;
  }

  redo(): HistoryEntry | null {
    const entry = this.redoStack.pop();
    if (!entry) return null;
    const current = this.state.values[entry.sectionKey];
    if (current) this.undoStack.push({ sectionKey: entry.sectionKey, at: new Date().toISOString(), values: current });
    this.state = { ...this.state, values: { ...this.state.values, [entry.sectionKey]: entry.values } };
    this.emit();
    return entry;
  }

  restoreFromHistory(entry: HistoryEntry): void {
    this.state = { ...this.state, values: { ...this.state.values, [entry.sectionKey]: entry.values } };
    this.emit();
  }

  toggleFavorite(key: string): void {
    const favorites = this.state.favorites.includes(key)
      ? this.state.favorites.filter((k) => k !== key)
      : [...this.state.favorites, key];
    this.state = { ...this.state, favorites };
    this.emit();
  }

  isFavorite(key: string): boolean {
    return this.state.favorites.includes(key);
  }

  trackRecent(key: string): void {
    const recent = [key, ...this.state.recent.filter((k) => k !== key)].slice(0, 6);
    this.state = { ...this.state, recent };
    this.emit();
  }
}
