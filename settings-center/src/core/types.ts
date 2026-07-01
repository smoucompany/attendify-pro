export type FieldType = 'text' | 'email' | 'password' | 'number' | 'time' | 'color' | 'select' | 'toggle' | 'textarea';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: FieldOption[];
  hint?: string;
}

export type SectionValues = Record<string, unknown>;

export interface FeatureSchema {
  key: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  fields: FieldDef[];
  defaults: SectionValues;
}

export interface HistoryEntry {
  sectionKey: string;
  at: string;
  values: SectionValues;
}

export interface SettingsState {
  values: Record<string, SectionValues>;
  history: HistoryEntry[];
  favorites: string[];
  recent: string[];
}

export type Kind = 'rebuilt' | 'legacy';

export interface CategoryMeta {
  key: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  kind: Kind;
  group?: string;
}
