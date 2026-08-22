export const SCRIPT_DISPLAY_NAME = '样式微调器';

/** 注入到酒馆全局窗口的 `<style>` 标签 id 前缀 */
export const STYLE_ELEMENT_PREFIX = 'styletuner-';

/** 脚本变量中的存储键（类型为 `type: 'script'` 的脚本变量） */
export const STORE_KEY = 'styletuner';

export const STYLE_TUNER_IDS = {
  /** 魔法棒扩展菜单中按钮的容器 id */
  buttonContainer: 'styletuner-button-container',
  /** 魔法棒扩展菜单中按钮的 id */
  button: 'styletuner-button',
  /** 设置弹窗内容的挂载点 id */
  popupContent: 'styletuner-popup-content',
} as const;
