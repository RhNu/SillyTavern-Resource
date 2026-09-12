import { getHostDocument } from '@util/st/dom/host';
import type {
  ExtensionSettingsHostOptions,
  ExtensionSettingsHostSession,
  ResolvedExtensionSettingsSection,
} from './types';

const SECTION_SELECTORS = {
  primary: '#extensions_settings',
  secondary: '#extensions_settings2',
} as const satisfies Record<ResolvedExtensionSettingsSection, string>;

function countTopLevelDrawers(container: Element | null): number {
  if (!container) return Number.POSITIVE_INFINITY;
  return [...container.querySelectorAll('div.inline-drawer')].filter(drawer => {
    const ancestorDrawer = drawer.parentElement?.closest('div.inline-drawer');
    return !ancestorDrawer || !container.contains(ancestorDrawer);
  }).length;
}

export function resolveExtensionSettingsSection(
  doc: Document,
  section: ExtensionSettingsHostOptions['section'] = 'auto',
): ResolvedExtensionSettingsSection {
  if (section !== 'auto') return section;
  const primaryCount = countTopLevelDrawers(doc.querySelector(SECTION_SELECTORS.primary));
  const secondaryCount = countTopLevelDrawers(doc.querySelector(SECTION_SELECTORS.secondary));
  return primaryCount <= secondaryCount ? 'primary' : 'secondary';
}

export function mountExtensionSettingsHost(options: ExtensionSettingsHostOptions = {}): ExtensionSettingsHostSession {
  const doc = options.document ?? getHostDocument();
  const section = resolveExtensionSettingsSection(doc, options.section);
  const element = doc.createElement('div');
  element.setAttribute('script_id', options.scriptId ?? getScriptId());
  if (options.id) element.id = options.id;
  if (options.className) element.className = options.className;
  for (const [name, value] of Object.entries(options.attributes ?? {})) element.setAttribute(name, value);

  let destroyed = false;
  let mounted = false;
  const updateMounted = (nextMounted: boolean) => {
    if (mounted === nextMounted) return;
    mounted = nextMounted;
    options.onMountChange?.(mounted);
  };
  const mount = (): boolean => {
    if (destroyed) return false;
    const target = doc.querySelector(SECTION_SELECTORS[section]);
    if (!target) {
      updateMounted(false);
      return false;
    }
    if (element.parentElement !== target) target.append(element);
    updateMounted(element.isConnected);
    return mounted;
  };

  mount();
  const Observer = doc.defaultView?.MutationObserver ?? MutationObserver;
  const observer = new Observer(() => {
    if (!destroyed) mount();
  });
  observer.observe(doc.documentElement, { childList: true, subtree: true });

  return {
    element,
    section,
    get mounted() {
      return mounted;
    },
    mount,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      element.remove();
      updateMounted(false);
    },
  };
}
