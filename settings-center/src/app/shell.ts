import { h } from '../components/dom';
import { renderSidebar } from '../components/Sidebar';
import { openCommandPalette } from '../components/CommandPalette';
import { openHistoryPanel } from '../components/HistoryPanel';
import { skeletonPanel } from '../components/Skeleton';
import { renderOverview } from './overview';
import { findCategory } from './categories';
import { REBUILT_REGISTRY, LEGACY_REGISTRY } from './registry';
import { SettingsStore } from '../core/store';
import { loadInitialState, persistState } from '../services/settingsService';
import { applyAppearance } from '../services/applySettings';
import { appearanceSchema } from '../features/appearance/schema';
import { toast } from '../components/toast';
import type { MountedPanel } from '../components/LegacyFrame';

export function mountSettingsCenter(container: HTMLElement, initialKey?: string): void {
  const store = new SettingsStore(loadInitialState());
  let activeKey = initialKey && (REBUILT_REGISTRY[initialKey] || LEGACY_REGISTRY[initialKey]) ? initialKey : 'overview';
  let activePanel: MountedPanel | null = null;

  /* Apply appearance immediately and on every change */
  const syncAppearance = () => applyAppearance(store.getSectionValues('appearance', appearanceSchema.defaults));
  syncAppearance();
  store.subscribe((state) => { persistState(state); syncAppearance(); });

  const root = h('div', { class: 'cc-root' });
  container.style.padding  = '0';
  container.style.overflowY = 'visible';
  container.replaceChildren(root);

  function disposeActivePanel(): void {
    if (activePanel) { activePanel.dispose(); activePanel = null; }
  }

  function renderContent(): HTMLElement {
    if (activeKey === 'overview') return renderOverview(store, navigate, () => openCommandPalette(navigate));

    const meta = findCategory(activeKey);
    if (meta.kind === 'rebuilt') {
      const renderFn = REBUILT_REGISTRY[activeKey];
      if (renderFn) return renderFn(store);
    } else {
      const renderFn = LEGACY_REGISTRY[activeKey];
      if (renderFn) {
        const panel = renderFn();
        activePanel = panel;
        return panel.element;
      }
    }
    return h('div', { class: 'cc-empty' }, ['القسم غير متاح']);
  }

  function rebuild(): void {
    disposeActivePanel();
    const content = h('main', { class: 'cc-content' }, [renderContent()]);
    const sidebar = renderSidebar({
      store,
      activeKey,
      onSelect:       navigate,
      onOpenPalette:  () => openCommandPalette(navigate),
      onOpenHistory:  () => openHistoryPanel(store, rebuild),
      onUndo:  () => { const r = store.undo(); if (r) { toast('تم التراجع', 'info'); rebuild(); } else toast('لا يوجد ما يُتراجع عنه', 'info'); },
      onRedo:  () => { const r = store.redo(); if (r) { toast('تمت الإعادة', 'info'); rebuild(); } else toast('لا يوجد ما يُعاد', 'info'); },
      onRebuild: rebuild,
    });
    root.replaceChildren(h('div', { class: 'cc-layout' }, [sidebar, content]));
  }

  function navigate(key: string): void {
    if (key === activeKey) return;
    activeKey = key;
    if (key !== 'overview') store.trackRecent(key);
    disposeActivePanel();
    const contentSlot = root.querySelector('.cc-content');
    if (contentSlot) contentSlot.replaceChildren(skeletonPanel());
    requestAnimationFrame(rebuild);
  }

  const onKeydown = (e: KeyboardEvent): void => {
    if (!root.isConnected) {
      document.removeEventListener('keydown', onKeydown, true);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      e.stopPropagation();
      openCommandPalette(navigate);
    }
  };
  document.addEventListener('keydown', onKeydown, true);

  rebuild();
}
