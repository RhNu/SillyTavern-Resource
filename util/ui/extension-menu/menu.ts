import { getHostDocument } from '@util/st/dom/host';
import type {
  ExtensionMenuClickContext,
  ExtensionMenuItemOptions,
  ExtensionMenuPredicate,
  ExtensionMenuSession,
} from './types';

function evaluate(predicate: ExtensionMenuPredicate | undefined, fallback: boolean): boolean {
  return typeof predicate === 'function' ? predicate() : (predicate ?? fallback);
}

function addClassNames(element: HTMLElement, classNames: string): void {
  element.classList.add(...classNames.split(/\s+/).filter(Boolean));
}

export function mountExtensionMenuItem(options: ExtensionMenuItemOptions): ExtensionMenuSession {
  if (!options.id.trim()) throw new Error('Extension menu item id cannot be empty.');
  if (!options.label.trim()) throw new Error(`Extension menu item "${options.id}" requires a label.`);
  if (!options.iconClass.trim()) throw new Error(`Extension menu item "${options.id}" requires an icon class.`);

  const doc = options.document ?? getHostDocument();
  const containerId = options.containerId ?? `${options.id}_container`;
  const container = doc.createElement('div');
  container.id = containerId;
  container.classList.add('extension_container', 'interactable');
  container.tabIndex = 0;

  const element = doc.createElement('div');
  element.id = options.id;
  element.classList.add('list-group-item', 'flex-container', 'flexGap5', 'interactable');
  element.classList.add(...(options.classNames ?? []));
  element.title = options.title ?? options.label;
  element.tabIndex = 0;
  element.setAttribute('role', 'listitem');

  const icon = doc.createElement('div');
  addClassNames(icon, options.iconClass);
  icon.classList.add('extensionsMenuExtensionButton');
  const label = doc.createElement('span');
  label.textContent = options.label;
  element.append(icon, label);
  container.append(element);

  let destroyed = false;
  let mounted = false;
  let pending = false;

  const updateMounted = (nextMounted: boolean) => {
    if (mounted === nextMounted) return;
    mounted = nextMounted;
    options.onMountChange?.(mounted);
  };

  const refresh = () => {
    const visible = evaluate(options.visible, true);
    const enabled = evaluate(options.enabled, true) && !pending;
    container.hidden = !visible;
    element.setAttribute('aria-disabled', String(!enabled));
    element.setAttribute('aria-busy', String(pending));
    element.tabIndex = enabled ? 0 : -1;
    element.classList.toggle('disabled', !enabled);
    element.classList.toggle('is-pending', pending);
  };

  const mount = (): boolean => {
    if (destroyed) return false;
    const menu = doc.querySelector('#extensionsMenu');
    if (!menu) {
      updateMounted(false);
      return false;
    }
    const staleContainer = doc.getElementById(containerId);
    if (staleContainer && staleContainer !== container) staleContainer.remove();
    if (container.parentElement !== menu) menu.append(container);
    updateMounted(container.isConnected);
    refresh();
    return mounted;
  };

  const handleClick = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (destroyed || pending || !evaluate(options.visible, true) || !evaluate(options.enabled, true)) return;

    pending = true;
    refresh();
    const context: ExtensionMenuClickContext = { event, session };
    try {
      await options.onClick(context);
    } catch (error) {
      if (options.onError) {
        try {
          await options.onError(error, context);
        } catch (reportingError) {
          console.error(`Extension menu item "${options.id}" error handler failed.`, reportingError);
        }
      } else {
        console.error(`Extension menu item "${options.id}" failed.`, error);
        toastr.error('扩展菜单操作失败，请查看控制台。', options.title ?? options.label);
      }
    } finally {
      pending = false;
      refresh();
    }
  };

  element.addEventListener('click', handleClick);
  mount();
  const Observer = doc.defaultView?.MutationObserver ?? MutationObserver;
  const observer = new Observer(() => {
    if (!destroyed && (!container.isConnected || container.parentElement !== doc.querySelector('#extensionsMenu')))
      mount();
  });
  observer.observe(doc.documentElement, { childList: true, subtree: true });

  const session: ExtensionMenuSession = {
    container,
    element,
    get mounted() {
      return mounted;
    },
    get pending() {
      return pending;
    },
    mount,
    refresh,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      element.removeEventListener('click', handleClick);
      container.remove();
      updateMounted(false);
    },
  };
  return session;
}
