/**
 * 单个样式调整条目。
 *
 * 每个条目对应一个独立的 `<style id="styletuner-{id}">` 标签，
 * 在酒馆全局窗口的 `<head>` 中注入或移除，互不影响。
 */
export type StyleTunerItem = {
  /** 唯一 id，同时作为注入的 `<style>` 标签 id 后缀 */
  id: string;
  /** 设置面板中显示的条目名称 */
  label: string;
  /** 设置面板中显示的说明文字 */
  description?: string;
  /** 要注入的 CSS 片段 */
  css: string;
};
