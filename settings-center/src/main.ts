import './styles/index.css';
import { mountSettingsCenter } from './app/shell';
import { applyFromDB } from './services/applySettings';

declare global {
  interface Window {
    SettingsCenterV2?: {
      render:       (container: HTMLElement, initialKey?: string) => void;
      applyFromDB:  () => void;
    };
  }
}

window.SettingsCenterV2 = {
  render(container: HTMLElement, initialKey?: string) {
    mountSettingsCenter(container, initialKey);
  },
  applyFromDB,
};

/* Auto-apply on script load (DB may already be ready) */
applyFromDB();
