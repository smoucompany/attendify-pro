import { SettingsStore } from '../core/store';
import type { MountedPanel } from '../components/LegacyFrame';

import { render as renderGeneral } from '../features/general';
import { render as renderAppearance } from '../features/appearance';
import { render as renderNotifications } from '../features/notifications';
import { render as renderSecurity } from '../features/security';
import { render as renderPrinting } from '../features/printing';
import { render as renderReports } from '../features/reports';
import { render as renderPerformance } from '../features/performance';
import { render as renderDatabase } from '../features/database';
import { render as renderApi } from '../features/api';
import { render as renderLogs } from '../features/logs';
import { render as renderAbout } from '../features/about';
import { render as renderAutomation } from '../features/automation';
import { render as renderIntegrations } from '../features/integrations';
import { render as renderAiCenter } from '../features/ai-center';

import { render as renderCompany } from '../features/company';
import { render as renderAttendance } from '../features/attendance';
import { render as renderHr } from '../features/hr';
import { render as renderPayroll } from '../features/payroll';
import { render as renderCorrespondence } from '../features/correspondence';
import { render as renderUsers } from '../features/users';
import { render as renderBackup } from '../features/backup';

export const REBUILT_REGISTRY: Record<string, (store: SettingsStore) => HTMLElement> = {
  general: renderGeneral,
  appearance: renderAppearance,
  notifications: renderNotifications,
  security: renderSecurity,
  printing: renderPrinting,
  reports: renderReports,
  performance: renderPerformance,
  database: renderDatabase,
  api: renderApi,
  logs: renderLogs,
  about: renderAbout,
  automation: renderAutomation,
  integrations: renderIntegrations,
  'ai-center': renderAiCenter,
};

export const LEGACY_REGISTRY: Record<string, () => MountedPanel> = {
  company: renderCompany,
  attendance: renderAttendance,
  hr: renderHr,
  payroll: renderPayroll,
  correspondence: renderCorrespondence,
  users: renderUsers,
  backup: renderBackup,
};
