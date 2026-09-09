import { ROOT_ELEMENT_ID, SCRIPT_ID, STYLE_MARKER_ATTR, STYLE_MARKER_VALUE } from './constants';

const STYLE_TEXT = `
.preset-controller-root {
	position: fixed;
	z-index: 2147483642;
	width: min(360px, calc(100vw - 16px));
	color: var(--SmartThemeBodyColor, #f1f1f1);
	font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.preset-controller-root.is-dragging {
	transition: none;
}

.preset-controller-root.is-collapsed {
	width: 40px;
}

.preset-controller-card {
	display: block;
}

.preset-controller-launcher {
	display: none;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.18));
	border-radius: 8px;
	background: var(--SmartThemeBlurTintColor, rgba(28, 28, 28, 0.95));
	box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
	cursor: grab;
	font-size: 15px;
}

.preset-controller-root.is-dragging .preset-controller-launcher,
.preset-controller-root.is-dragging .preset-controller-header {
	cursor: grabbing;
}

.preset-controller-root.is-collapsed .preset-controller-launcher {
	display: flex;
}

.preset-controller-panel {
	border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.16));
	border-radius: 10px;
	background: var(--SmartThemeBlurTintColor, rgba(26, 26, 26, 0.96));
	box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
	overflow: hidden;
}

.preset-controller-root.is-collapsed .preset-controller-panel {
	display: none;
}

.preset-controller-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 10px 12px;
	border-bottom: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.14));
	cursor: grab;
}

.preset-controller-title-row,
.preset-controller-label-row,
.preset-controller-settings-title-row {
	display: flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
}

.preset-controller-title {
	margin: 0;
	font-size: 14px;
	font-weight: 700;
	line-height: 1.2;
}

.preset-controller-header-actions {
	display: inline-flex;
	align-items: center;
}

.preset-controller-header-btn,
.preset-controller-group-toggle,
.preset-controller-action-btn {
	border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.18));
	border-radius: 8px;
	background: var(--SmartThemeBlurTintColor, rgba(255, 255, 255, 0.06));
	color: inherit;
	cursor: pointer;
}

.preset-controller-header-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
}

.preset-controller-body {
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 10px 12px 12px;
	max-height: min(70vh, 640px);
	overflow: auto;
}

.preset-controller-status {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px;
	border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.14));
	border-radius: 8px;
	font-size: 12px;
}

.preset-controller-status-tag {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 52px;
	min-height: 22px;
	padding: 0 8px;
	border-radius: 999px;
	font-size: 10px;
	font-weight: 700;
}

.preset-controller-status-tag.is-idle {
	background: rgba(148, 148, 148, 0.2);
}

.preset-controller-status-tag.is-working {
	background: rgba(86, 158, 255, 0.24);
}

.preset-controller-status-tag.is-success {
	background: rgba(78, 186, 109, 0.24);
}

.preset-controller-status-tag.is-warning {
	background: rgba(225, 168, 73, 0.24);
}

.preset-controller-status-tag.is-error {
	background: rgba(213, 91, 91, 0.24);
}

.preset-controller-status-text {
	min-width: 0;
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.preset-controller-group {
	border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.14));
	border-radius: 8px;
	overflow: hidden;
}

.preset-controller-group-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 8px 10px;
	background: rgba(255, 255, 255, 0.03);
}

.preset-controller-group-meta {
	min-width: 0;
}

.preset-controller-group-title {
	font-size: 12px;
	font-weight: 700;
}

.preset-controller-group-toggle {
	min-width: 50px;
	height: 26px;
	padding: 0 8px;
	font-size: 12px;
}

.preset-controller-group-body {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 8px;
}

.preset-controller-group.is-collapsed .preset-controller-group-body {
	display: none;
}

.preset-controller-item {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 8px;
	border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.12));
	border-radius: 8px;
}

.preset-controller-item-label {
	font-size: 12px;
	font-weight: 600;
}

.preset-controller-control-stack {
	display: grid;
	gap: 6px;
}

.preset-controller-toggle,
.preset-controller-radio-option {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-size: 12px;
	cursor: pointer;
}

.preset-controller-radio-group {
	display: grid;
	gap: 6px;
	margin: 0;
	padding: 0;
	border: 0;
}

.preset-controller-radio-label {
	font-size: 11px;
	opacity: 0.78;
}

.preset-controller-toolbar {
	display: flex;
	justify-content: flex-end;
}

.preset-controller-action-btn {
	height: 32px;
	padding: 0 12px;
	font-size: 12px;
	font-weight: 600;
}

.preset-controller-action-btn:disabled {
	opacity: 0.55;
	cursor: default;
}

.preset-controller-empty {
	padding: 8px 4px;
	font-size: 12px;
	opacity: 0.82;
}

.th-help-marker.preset-controller-help-marker,
.th-help-marker.preset-controller-settings-help {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 18px;
	height: 18px;
	padding: 0;
	border: 0;
	border-radius: 999px;
	background: transparent;
	color: inherit;
	cursor: pointer;
	opacity: 0.72;
}

.th-help-marker.preset-controller-help-marker:hover,
.th-help-marker.preset-controller-help-marker:focus-visible,
.th-help-marker.preset-controller-settings-help:hover,
.th-help-marker.preset-controller-settings-help:focus-visible {
	opacity: 1;
	background: rgba(255, 255, 255, 0.08);
}

.preset-controller-settings {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 12px 0 2px;
}

.preset-controller-settings-panel {
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 12px;
	border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.14));
	border-radius: 10px;
	background: rgba(255, 255, 255, 0.03);
}

.preset-controller-settings-title {
	font-size: 14px;
	font-weight: 700;
}

.preset-controller-settings-row,
.preset-controller-settings-field {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.preset-controller-settings-switch {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-size: 13px;
}

.preset-controller-settings-status {
	font-size: 12px;
	opacity: 0.8;
}

.preset-controller-settings-textarea {
	min-height: 124px;
	resize: vertical;
}

.preset-controller-settings-select {
	max-width: 180px;
}

.preset-controller-settings-actions {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
	gap: 8px;
}

.preset-controller-settings-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	min-width: 0;
	white-space: nowrap;
	writing-mode: horizontal-tb;
	text-orientation: mixed;
	text-align: center;
}

@media (max-width: 768px) {
	.preset-controller-root {
		width: calc(100vw - 12px);
	}

	.preset-controller-root.is-collapsed {
		width: 40px;
	}

	.preset-controller-body {
		max-height: min(72vh, 560px);
	}
}
`;

export function removePreviousMount(doc: Document) {
  doc.getElementById(ROOT_ELEMENT_ID)?.remove();
  doc
    .querySelectorAll(`style[${STYLE_MARKER_ATTR}="${STYLE_MARKER_VALUE}"]`)
    .forEach(node => node.parentNode?.removeChild(node));
}

export function installStyle(doc: Document): HTMLStyleElement {
  const style = doc.createElement('style');
  style.setAttribute(STYLE_MARKER_ATTR, STYLE_MARKER_VALUE);
  style.setAttribute('script_id', SCRIPT_ID);
  style.textContent = STYLE_TEXT;
  (doc.head ?? doc.documentElement).append(style);
  return style;
}
