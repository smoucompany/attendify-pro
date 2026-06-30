import { h } from '../components/dom';
import { renderSidebar } from '../components/Sidebar';
import { renderTopbar } from '../components/Topbar';
import { openCommandPalette } from '../components/CommandPalette';
import { openHistoryPanel } from '../components/HistoryPanel';
import { skeletonPanel } from '../components/Skeleton';
import { renderOverview } from './overview';
import { findCategory } from './categories';
import { REBUILT_REGISTRY, LEGACY_REGISTRY } from './registry';
import { SettingsStore } from '../core/store';
import { loadInitialState, persistState } from '../services/settingsService';
import { toast } from '../components/toast';
import type { MountedPanel } from '../components/LegacyFrame';

export function mountSettingsCenter(container: HTMLElement, initialKey?: string): void {
  const store = new SettingsStore(loadInitialState());
  let activeKey = initialKey && (REBUILT_REGISTRY[initialKey] || LEGACY_REGISTRY[initialKey]) ? initialKey : 'overview';
  let activePanel: MountedPanel | null = null;

  store.subscribe((state) => persistState(state));

  const root = h('div', { class: 'cc-root' });
  container.replaceChildren(root);

  function disposeActivePanel(): void {
    if (activePanel) { activePanel.dispose(); activePanel = null; }
  }

  function renderContent(): HTMLElement {
    if (activeKey === 'overview') return renderOverview(store, navigate);

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
    const sidebar = renderSidebar({ store, activeKey, onSelect: navigate });
    const topbar = renderTopbar({
      store,
      onOpenPalette: () => openCommandPalette(navigate),
      onOpenHistory: () => openHistoryPanel(store, rebuild),
      onUndo: () => { const r = store.undo(); if (r) { toast('تم التراجع', 'info'); rebuild(); } else toast('لا يوجد ما يُتراجع عنه', 'info'); },
      onRedo: () => { const r = store.redo(); if (r) { toast('تمت الإعادة', 'info'); rebuild(); } else toast('لا يوجد ما يُعاد', 'info'); },
    });
    root.replaceChildren(h('div', { class: 'cc-layout' }, [sidebar, h('div', { class: 'cc-main' }, [topbar, content])]));
  }

  function navigate(key: string): void {
    if (key === activeKey) return;
    activeKey = key;
    if (key !== 'overview') store.trackRecent(key);
    // Brief loading skeleton in the content slot for heavier (legacy) panels, then real content.
    disposeActivePanel();
    const contentSlot = root.querySelector('.cc-content');
    if (contentSlot) contentSlot.replaceChildren(skeletonPanel());
    requestAnimationFrame(rebuild);
  }

  // Capture phase + stopPropagation: the host app already binds a global Ctrl/Cmd+K
  // for its own search overlay (DashboardModule). While Settings is mounted we want
  // our palette instead, so we intercept before that bubble-phase listener runs.
  // `root.isConnected` self-disables this once the page navigates away (the router
  // replaces #page-content's children rather than giving modules an unmount hook),
  // and detaches itself the next time the combo is pressed after that.
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
