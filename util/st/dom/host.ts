/**
 * 脚本 iframe 的宿主 DOM 辅助工具。
 *
 * 适用范围：
 * - 面向需要访问宿主页面 DOM/window 的 SillyTavern 脚本 iframe。
 * - 仅提供安全兜底：当无法访问父窗口时，返回当前 iframe 的上下文。
 *
 * 不适用范围：
 * - 不用于挂载在自行创建的 iframe 中的隔离 UI。
 * - 不是跨域抽象；无法访问父窗口时会直接回退到当前 window/document。
 */

export type HostDomContext = {
  doc: Document;
  win: Window;
};

type MaybeHostWindow = Window & typeof globalThis & { jQuery?: JQueryStatic };

function resolveParentWindow(): MaybeHostWindow | null {
  try {
    if (window.parent && window.parent !== window) {
      return window.parent as MaybeHostWindow;
    }
  } catch (_error) {
    return null;
  }

  return null;
}

/**
 * 返回脚本 iframe 可使用的宿主页面 window/document 配对。
 *
 * 适用范围：
 * - 当脚本代码需要挂载到宿主页面 DOM，或监听宿主页面事件时使用。
 *
 * 不适用范围：
 * - 不要把它作为挂载在 `createScriptIdIframe()` 内内容的 DOM 来源。
 */
export function getHostDomContext(): HostDomContext {
  const parentWindow = resolveParentWindow();
  if (parentWindow) {
    return {
      doc: parentWindow.document,
      win: parentWindow,
    };
  }

  return {
    doc: document,
    win: window,
  };
}

/**
 * 返回宿主页面的 document；如果不可用，则回退到当前 iframe 的 document。
 */
export function getHostDocument(): Document {
  return getHostDomContext().doc;
}

/**
 * 返回宿主页面的 window；如果不可用，则回退到当前 iframe 的 window。
 */
export function getHostWindow(): Window {
  return getHostDomContext().win;
}

/**
 * 返回宿主页面的 jQuery 实例（如果可用），否则回退到当前 `$`。
 *
 * 适用范围：
 * - 当选择器或事件绑定必须作用于宿主页面节点时使用。
 */
export function getHostJQuery(): JQueryStatic {
  const hostWindow = getHostWindow() as MaybeHostWindow;
  return (hostWindow.jQuery ?? $) as JQueryStatic;
}

/**
 * 返回应被视为用户交互来源的 document 列表。
 *
 * 适用范围：
 * - 适用于手势解锁，或需要同时在 iframe 与宿主页面生效的点击/触摸监听。
 *
 * 不适用范围：
 * - 不用于作为通用的 document 枚举机制。
 */
export function getInteractionDocuments(
  options: {
    includeSelf?: boolean;
    includeHost?: boolean;
  } = {},
): Document[] {
  const { includeSelf = true, includeHost = true } = options;
  const docs: Document[] = [];

  if (includeSelf) {
    docs.push(document);
  }

  if (includeHost) {
    const hostDocument = getHostDocument();
    if (!docs.includes(hostDocument)) {
      docs.push(hostDocument);
    }
  }

  return docs;
}
