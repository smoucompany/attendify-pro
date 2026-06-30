import './styles/index.css';
import { mountSettingsCenter } from './app/shell';

declare global {
  interface Window {
    SettingsCenterV2?: { render: (container: HTMLElement, initialKey?: string) => void };
  }
}

window.SettingsCenterV2 = {
  render(container: HTMLElement, initialKey?: string) {
    mountSettingsCenter(container, initialKey);
  },
};
