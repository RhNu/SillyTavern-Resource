import { STYLE_ELEMENT_PREFIX } from './constants';
import type { StyleTunerItem } from './types';

/**
 * 内置的 id-样式片段表。
 *
 * 每个条目对应一个独立注入的 `<style id="styletuner-{id}">` 标签，
 * 开关开启时注入到酒馆全局窗口的 `<head>`，关闭时隐藏。
 *
 * 需要增删样式时，直接修改此表即可：新增条目会自动出现在设置面板中，
 * 并拥有独立的样式标签 id 方便管理与排查。
 */
export const STYLE_TUNER_ITEMS: StyleTunerItem[] = [
  {
    id: 'rm-welcome-shortcuts',
    label: '隐藏快捷方式按钮',
    description: '隐藏酒馆欢迎页面的文档/GitHub/Discord快捷方式按钮。',
    css: `
.welcomeShortcuts > :not(button:last-of-type) {
  display: none !important;
}
.welcomeShortcuts > button:last-of-type {
  display: inline-flex !important;
}
`,
  },
  {
    id: 'rm-reverse-proxy-warnings',
    label: '隐藏反向代理警告',
    description: '隐藏连接配置页面的反向代理警告信息。',
    css: `
#ReverseProxyWarningMessage,
#ReverseProxyWarningMessage2 {
  display: none !important;
}
`,
  },
  {
    id: 'rm-cc-invalid-notice',
    label: '隐藏聊天补全无效设置',
    description: '隐藏高级设置中的聊天补全无效设置。',
    css: `
#advanced-formatting-cc-notice,
[data-cc-null] {
  display: none !important;
}
`,
  },
  {
    id: 'rm-deprecated-extension-settings',
    label: '隐藏已弃用的扩展设置',
    description: '隐藏扩展页面中的已弃用扩展设置。',
    css: `
#extensions_settings2 + hr,
#extensions_settings2 + hr + div,
#extensions_settings2 + hr + div + div {
  display: none !important;
}
`,
  },
  {
    id: 'rm-logit-bias',
    label: '隐藏 Logit 偏置',
    description: '隐藏 OpenAI 系提供商设置中的 Logit 偏置（Logit Bias）区块。',
    css: `
/* 用区块内部稳定 id 回溯容器，避免依赖会随酒馆版本变化的 data-source 属性值 */
.range-block:has(#logit_bias_openai) {
  display: none !important;
}
`,
  },
  {
    id: 'rm-seed',
    label: '隐藏种子设置',
    description: '隐藏 OpenAI 系提供商设置中的种子（Seed）设置区块。',
    css: `
.range-block:has(#seed_openai) {
  display: none !important;
}
`,
  },
  {
    id: 'rm-adv-formatting-drawers',
    label: '隐藏高级格式化杂项折叠区块',
    description: '隐藏高级设置中的快速提示词编辑、实用提示词、角色名称行为、续写后缀四个折叠区块。',
    css: `
/* 四个折叠区块均无稳定容器 id，用各自内部专属表单 id 作锚点回溯容器 */
.inline-drawer:has(#main_prompt_quick_edit_textarea),
.inline-drawer:has(#impersonation_prompt_textarea),
.inline-drawer:has(#character_names_display),
.inline-drawer:has(#continue_postfix_display) {
  display: none !important;
}
`,
  },
  {
    id: 'rm-spreset-button',
    label: '隐藏 SPreset 按钮',
    description: '隐藏预设编辑页面的 SPreset 预设编辑器按钮。',
    css: `
.spreset-button-container {
  display: none !important;
}
`,
  },
];

/** 生成某个条目对应的 `<style>` 标签 id */
export function getStyleElementId(itemId: string): string {
  return `${STYLE_ELEMENT_PREFIX}${itemId}`;
}

/** 将条目样式注入酒馆全局窗口的 `<head>`（幂等，已存在时同步最新内容） */
export function injectStyleTunerItem(item: StyleTunerItem): void {
  const elementId = getStyleElementId(item.id);
  const $style = $(`style#${CSS.escape(elementId)}`);
  if ($style.length) {
    if ($style.text() !== item.css) {
      $style.text(item.css);
    }
    return;
  }

  $('<style>').attr('id', elementId).attr('script_id', getScriptId()).text(item.css).appendTo('head');
}

/** 从酒馆全局窗口隐藏某个条目的样式 */
export function removeStyleTunerItem(itemId: string): void {
  $(`style#${CSS.escape(getStyleElementId(itemId))}`).remove();
}

/** 隐藏本脚本注入的全部样式标签 */
export function removeAllStyleTuners(): void {
  $(`style[id^="${STYLE_ELEMENT_PREFIX}"]`).remove();
}

/** 按开关表应用整个样式条目表：开启的注入，关闭的隐藏 */
export function applyStyleTuners(enabled: Record<string, boolean>): void {
  for (const item of STYLE_TUNER_ITEMS) {
    if (enabled[item.id]) {
      injectStyleTunerItem(item);
    } else {
      removeStyleTunerItem(item.id);
    }
  }
}
