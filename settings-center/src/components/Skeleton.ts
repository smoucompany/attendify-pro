import { h } from './dom';

export function skeletonBlock(height = 16, width = '100%'): HTMLElement {
  return h('div', { class: 'cc-skeleton', style: `height:${height}px;width:${width}` });
}

export function skeletonPanel(): HTMLElement {
  return h('div', { class: 'cc-skeleton-panel' }, [
    skeletonBlock(28, '40%'),
    skeletonBlock(14, '70%'),
    h('div', { class: 'cc-skeleton-grid' }, [
      skeletonBlock(56), skeletonBlock(56), skeletonBlock(56), skeletonBlock(56),
    ]),
  ]);
}
