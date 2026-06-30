import { h } from './dom';

export interface CardHeaderProps {
  icon: string;
  title: string;
  description: string;
  color: string;
  actions?: HTMLElement[];
}

export function panelHeader(props: CardHeaderProps): HTMLElement {
  return h('div', { class: 'cc-panel-header' }, [
    h('div', { class: 'cc-panel-icon', style: `background:${props.color}` }, [
      h('i', { class: props.icon }),
    ]),
    h('div', { class: 'cc-panel-heading' }, [
      h('h2', {}, [props.title]),
      h('p', {}, [props.description]),
    ]),
    props.actions ? h('div', { class: 'cc-panel-actions' }, props.actions) : null,
  ]);
}

export function card(children: (HTMLElement | string)[], extraClass = ''): HTMLElement {
  return h('div', { class: `cc-card ${extraClass}`.trim() }, children);
}

export function emptyState(icon: string, message: string): HTMLElement {
  return h('div', { class: 'cc-empty' }, [
    h('i', { class: icon }),
    h('p', {}, [message]),
  ]);
}
