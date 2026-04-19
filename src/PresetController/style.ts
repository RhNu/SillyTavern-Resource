import { ROOT_ELEMENT_ID, SCRIPT_ID, STYLE_MARKER_ATTR, STYLE_MARKER_VALUE } from './constants';

const STYLE_TEXT = `
.preset-controller-root {
	position: fixed;
	z-index: 2147483642;
	width: min(380px, calc(100vw - 16px));
	color: color-mix(in srgb, var(--SmartThemeBodyColor, #f1f1f1) 94%, #fff);
	font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
	letter-spacing: 0.01em;
	user-select: none;
}

.preset-controller-root.is-dragging {
	transition: none;
}

.preset-controller-card {
	border-radius: 14px;
	border: 1px solid color-mix(in srgb, var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.14)) 68%, transparent);
	background:
		radial-gradient(circle at 10% -10%, rgba(84, 189, 255, 0.2), transparent 40%),
		radial-gradient(circle at 90% 120%, rgba(84, 255, 203, 0.15), transparent 45%),
		color-mix(in srgb, var(--SmartThemeBlurTintColor, rgba(10, 16, 24, 0.88)) 78%, rgba(5, 9, 14, 0.9));
	box-shadow:
		0 10px 34px rgba(0, 0, 0, 0.35),
		0 0 0 1px rgba(255, 255, 255, 0.03) inset;
	backdrop-filter: blur(14px);
	-webkit-backdrop-filter: blur(14px);
	overflow: hidden;
}

.preset-controller-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	min-height: 42px;
	padding: 10px 12px;
	cursor: grab;
	background: linear-gradient(
		120deg,
		color-mix(in srgb, var(--SmartThemeQuoteColor, #5da5ff) 26%, transparent),
		color-mix(in srgb, var(--SmartThemeQuoteColor, #5da5ff) 10%, transparent)
	);
}

.preset-controller-root.is-dragging .preset-controller-header {
	cursor: grabbing;
}

.preset-controller-title-wrap {
	min-width: 0;
}

.preset-controller-title {
	font-size: 14px;
	font-weight: 700;
	line-height: 1.2;
	margin: 0;
}

.preset-controller-subtitle {
	margin-top: 2px;
	font-size: 11px;
	opacity: 0.78;
}

.preset-controller-header-actions {
	display: inline-flex;
	align-items: center;
	gap: 6px;
}

.preset-controller-header-btn {
	min-width: 28px;
	height: 28px;
	border: 1px solid color-mix(in srgb, var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.16)) 70%, transparent);
	border-radius: 8px;
	background: color-mix(in srgb, var(--SmartThemeBlurTintColor, rgba(255, 255, 255, 0.08)) 35%, transparent);
	color: inherit;
	cursor: pointer;
}

.preset-controller-header-btn:hover {
	background: color-mix(in srgb, var(--SmartThemeQuoteColor, #5da5ff) 24%, transparent);
}

.preset-controller-body {
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 10px 12px 12px;
	max-height: min(72vh, 680px);
	overflow: auto;
}

.preset-controller-root.is-collapsed .preset-controller-body {
	display: none;
}

.preset-controller-status {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 7px 8px;
	border-radius: 9px;
	border: 1px solid color-mix(in srgb, var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.16)) 70%, transparent);
	font-size: 11px;
	background: color-mix(in srgb, var(--SmartThemeBlurTintColor, rgba(255, 255, 255, 0.07)) 30%, transparent);
}

.preset-controller-status-tag {
	padding: 0 6px;
	min-height: 20px;
	border-radius: 999px;
	display: inline-flex;
	align-items: center;
	font-weight: 700;
	font-size: 10px;
}

.preset-controller-status-tag.is-idle {
	background: color-mix(in srgb, #8f8f8f 30%, transparent);
}

.preset-controller-status-tag.is-working {
	background: color-mix(in srgb, #4aa6ff 38%, transparent);
}

.preset-controller-status-tag.is-success {
	background: color-mix(in srgb, #3bc989 40%, transparent);
}

.preset-controller-status-tag.is-warning {
	background: color-mix(in srgb, #f1ab4c 40%, transparent);
}

.preset-controller-status-tag.is-error {
	background: color-mix(in srgb, #dc5f5f 42%, transparent);
}

.preset-controller-status-text {
	min-width: 0;
	flex: 1;
	opacity: 0.9;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.preset-controller-group {
	border: 1px solid color-mix(in srgb, var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.16)) 70%, transparent);
	border-radius: 11px;
	overflow: hidden;
}

.preset-controller-group-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 8px 10px;
	background: color-mix(in srgb, var(--SmartThemeBlurTintColor, rgba(255, 255, 255, 0.08)) 28%, transparent);
}

.preset-controller-group-meta {
	min-width: 0;
}

.preset-controller-group-title {
	font-weight: 700;
	font-size: 12px;
}

.preset-controller-group-description {
	margin-top: 2px;
	font-size: 11px;
	opacity: 0.72;
}

.preset-controller-group-toggle {
	border: none;
	border-radius: 6px;
	height: 24px;
	min-width: 24px;
	background: color-mix(in srgb, var(--SmartThemeBlurTintColor, rgba(255, 255, 255, 0.08)) 40%, transparent);
	color: inherit;
	cursor: pointer;
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
	border-radius: 9px;
	border: 1px solid color-mix(in srgb, var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.16)) 68%, transparent);
	padding: 8px;
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.preset-controller-item-label {
	font-size: 12px;
	font-weight: 700;
}

.preset-controller-item-description {
	font-size: 11px;
	opacity: 0.78;
}

.preset-controller-control-stack {
	display: grid;
	gap: 6px;
}

.preset-controller-switch {
	display: inline-flex;
	align-items: center;
	gap: 7px;
	cursor: pointer;
	font-size: 12px;
}

.preset-controller-radio-group {
	border: 0;
	margin: 0;
	padding: 0;
	display: grid;
	gap: 5px;
}

.preset-controller-radio-label {
	font-size: 11px;
	opacity: 0.82;
}

.preset-controller-radio-option {
	display: inline-flex;
	align-items: center;
	gap: 7px;
	font-size: 12px;
	cursor: pointer;
}

.preset-controller-toolbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
}

.preset-controller-action-btn {
	height: 32px;
	border-radius: 9px;
	border: 1px solid color-mix(in srgb, var(--SmartThemeQuoteColor, #5da5ff) 56%, transparent);
	background: color-mix(in srgb, var(--SmartThemeQuoteColor, #5da5ff) 18%, transparent);
	color: inherit;
	font-size: 12px;
	font-weight: 700;
	padding: 0 10px;
	cursor: pointer;
}

.preset-controller-action-btn:disabled {
	opacity: 0.52;
	cursor: default;
}

.preset-controller-toggle-inline {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 11px;
	opacity: 0.9;
}

.preset-controller-import {
	border: 1px solid color-mix(in srgb, var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.16)) 68%, transparent);
	border-radius: 10px;
	overflow: hidden;
}

.preset-controller-import-summary {
	cursor: pointer;
	list-style: none;
	padding: 8px 10px;
	font-size: 12px;
	font-weight: 700;
	background: color-mix(in srgb, var(--SmartThemeBlurTintColor, rgba(255, 255, 255, 0.08)) 26%, transparent);
}

.preset-controller-import-body {
	display: grid;
	gap: 8px;
	padding: 8px;
}

.preset-controller-import-textarea {
	width: 100%;
	min-height: 96px;
	resize: vertical;
	border-radius: 8px;
	border: 1px solid color-mix(in srgb, var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.16)) 70%, transparent);
	background: color-mix(in srgb, var(--SmartThemeBlurTintColor, rgba(255, 255, 255, 0.08)) 25%, transparent);
	color: inherit;
	padding: 8px;
	font-size: 12px;
	line-height: 1.45;
}

.preset-controller-import-row {
	display: flex;
	align-items: center;
	gap: 8px;
}

.preset-controller-import-select {
	min-width: 96px;
	height: 32px;
	border-radius: 8px;
	border: 1px solid color-mix(in srgb, var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.16)) 70%, transparent);
	background: color-mix(in srgb, var(--SmartThemeBlurTintColor, rgba(255, 255, 255, 0.08)) 25%, transparent);
	color: inherit;
	padding: 0 8px;
}

.preset-controller-empty {
	font-size: 12px;
	opacity: 0.78;
	padding: 6px 4px;
}

@media (max-width: 768px) {
	.preset-controller-root {
		width: calc(100vw - 12px);
	}

	.preset-controller-body {
		max-height: min(74vh, 580px);
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
