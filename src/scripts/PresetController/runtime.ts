import { mountExtensionSetting } from '@util/ui';
import {
  DEFAULT_PANEL_HEIGHT,
  DEFAULT_PANEL_WIDTH,
  ROOT_ELEMENT_ID,
  SCRIPT_DISPLAY_NAME,
  VIEWPORT_PADDING,
} from './constants';
import { parseImportedConfig } from './importer';
import { PresetControllerModel } from './model';
import { applyConfigToInUsePreset } from './preset-sync';
import SettingsPanel from './SettingsPanel';
import { formatError, stringifyControllerConfigJsonSchema } from './schema';
import { ImportFormatSchema, type ControllerState, type ImportFormat } from './state';
import { installStyle, removePreviousMount } from './style';
import { PresetControllerView } from './view';
import { mountDraggableFloatingSurface, type FloatingPercentPosition, toFloatingPercentPosition } from '@util/floating';
import { getHostDomContext } from '@util/host';
import { createScriptIdDiv } from '@util/script';
import { createElement } from 'react';

function notify(level: 'success' | 'info' | 'warning' | 'error', message: string) {
  if (typeof toastr !== 'undefined') {
    if (level === 'success') {
      toastr.success(message, SCRIPT_DISPLAY_NAME);
      return;
    }

    if (level === 'warning') {
      toastr.warning(message, SCRIPT_DISPLAY_NAME);
      return;
    }

    if (level === 'error') {
      toastr.error(message, SCRIPT_DISPLAY_NAME);
      return;
    }

    toastr.info(message, SCRIPT_DISPLAY_NAME);
    return;
  }

  if (level === 'error') {
    console.error(`[${SCRIPT_DISPLAY_NAME}] ${message}`);
    return;
  }

  if (level === 'warning') {
    console.warn(`[${SCRIPT_DISPLAY_NAME}] ${message}`);
    return;
  }

  console.info(`[${SCRIPT_DISPLAY_NAME}] ${message}`);
}

function downloadTextFile(doc: Document, win: Window, filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const urlApi = (win as Window & { URL: typeof URL }).URL;
  const url = urlApi.createObjectURL(blob);
  const link = doc.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  (doc.body ?? doc.documentElement).append(link);
  link.click();
  link.remove();
  win.setTimeout(() => {
    urlApi.revokeObjectURL(url);
  }, 0);
}

export type PresetControllerRuntimeApi = {
  getState: () => ControllerState;
  subscribe: (listener: () => void) => () => void;
  setAutoApply: (autoApply: boolean) => void;
  setImportFormat: (format: ImportFormat) => void;
  importConfig: (raw: string, sourceName?: string) => Promise<void>;
  exportJsonSchema: () => void;
};

export function createPresetControllerRuntime() {
  const { doc, win } = getHostDomContext();
  removePreviousMount(doc);

  const styleElement = installStyle(doc);
  const model = new PresetControllerModel();
  const root = createScriptIdDiv()
    .attr('id', ROOT_ELEMENT_ID)
    .attr('data-preset-controller-root', 'true')
    .addClass('preset-controller-root')[0];
  if (!root) {
    throw new Error('悬浮窗挂载失败。');
  }

  const view = new PresetControllerView(doc, root);
  root.classList.toggle('is-collapsed', model.getState().ui.collapsed);

  let autoApplyTimer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;

  const renderShell = () => view.renderShell(model.getState());
  const renderGroups = () => view.renderGroups(model.getState().config, model.getState().ui);
  const renderStatus = () => view.renderStatus(model.getState());

  const floating = mountDraggableFloatingSurface({
    doc,
    win,
    root,
    padding: VIEWPORT_PADDING,
    fallbackWidth: DEFAULT_PANEL_WIDTH,
    fallbackHeight: DEFAULT_PANEL_HEIGHT,
    dragHandle: '.preset-controller-drag-handle',
    ignoreDragWithin: 'button,input,select,textarea,label,summary,[data-pc-no-drag="true"]',
    loadPosition: () => model.getState().ui.position,
    getDefaultPosition: () => ({
      x: win.innerWidth - DEFAULT_PANEL_WIDTH - 18,
      y: Math.max(64, Math.round(win.innerHeight * 0.18)),
    }),
    savePosition: (position: FloatingPercentPosition) => {
      model.setPosition(position);
    },
  });

  const applyNow = async (reason: string) => {
    if (model.getState().applying) {
      return;
    }

    model.setApplying(true);
    model.setStatus('working', `${reason}中...`);
    renderStatus();

    try {
      const result = await applyConfigToInUsePreset(model.getState().config);
      model.markClean();

      if (result.missingTargets.length > 0) {
        const message = `已应用 ${result.touchedPromptCount} 项，${result.missingTargets.length} 个目标未命中`;
        model.setStatus('warning', message);
        notify('warning', `${message}。可在控制台查看未命中名称。`);
        console.warn('[PresetController] Missing targets:', result.missingTargets);
      } else {
        const message = `已应用 ${result.touchedPromptCount} 项提示词操作`;
        model.setStatus('success', message);
        notify('success', message);
      }
    } catch (error) {
      const message = `应用失败: ${formatError(error)}`;
      model.setStatus('error', message);
      notify('error', message);
      console.error('[PresetController] Failed to apply preset config.', error);
    } finally {
      model.setApplying(false);
      renderStatus();
    }
  };

  const scheduleAutoApply = () => {
    if (!model.getState().ui.autoApply) {
      return;
    }

    if (autoApplyTimer) {
      clearTimeout(autoApplyTimer);
    }

    autoApplyTimer = setTimeout(() => {
      void applyNow('自动同步');
    }, 220);
  };

  const importConfig = async (raw: string, sourceName?: string) => {
    try {
      const imported = parseImportedConfig(raw, model.getState().ui.importFormat, sourceName);
      model.replaceConfig(imported);
      model.markDirty('规则已导入，正在应用...');
      view.renderHeader(model.getState().config);
      renderGroups();
      renderStatus();
      notify('success', '规则导入成功，开始应用到 in_use。');
      await applyNow('导入后同步');
    } catch (error) {
      const message = `导入失败: ${formatError(error)}`;
      model.setStatus('error', message);
      renderStatus();
      notify('error', message);
    }
  };

  const runtimeApi: PresetControllerRuntimeApi = {
    getState: () => model.getState(),
    subscribe: listener => model.subscribe(listener),
    setAutoApply: autoApply => {
      model.setAutoApply(autoApply);
      renderStatus();
      if (autoApply && model.getState().dirty) {
        scheduleAutoApply();
      }
    },
    setImportFormat: format => {
      model.setImportFormat(ImportFormatSchema.parse(format));
    },
    importConfig,
    exportJsonSchema: () => {
      downloadTextFile(
        doc,
        win,
        'preset-controller.schema.json',
        stringifyControllerConfigJsonSchema(),
        'application/schema+json;charset=utf-8',
      );
      notify('success', '已导出 preset-controller.schema.json');
    },
  };

  const settingsPanel = mountExtensionSetting(createElement(SettingsPanel, { runtime: runtimeApi }));

  const onLauncherActivate = () => {
    if (floating.consumeClickSuppression() || !model.getState().ui.collapsed) {
      return;
    }

    model.setCollapsed(false);
    view.renderCollapsed(false);
    floating.recalculatePosition(true);
  };

  const onLauncherKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    onLauncherActivate();
  };

  const onCollapseClick = (event: MouseEvent) => {
    event.preventDefault();
    model.setCollapsed(true);
    view.renderCollapsed(true);
    floating.recalculatePosition(true);
  };

  const onGroupsClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    const groupToggle = target?.closest<HTMLButtonElement>('[data-pc-action="toggle-group"]');
    if (!groupToggle?.dataset.groupId) {
      return;
    }

    const groupId = groupToggle.dataset.groupId;
    model.setGroupCollapsed(groupId, !model.getState().ui.groupCollapsed[groupId]);
    renderGroups();
  };

  const onGroupsChange = (event: Event) => {
    const target = event.target as HTMLInputElement | null;
    const controlId = target?.dataset.controlId;
    const controlType = target?.dataset.controlType;
    if (!target || !controlId || !controlType) {
      return;
    }

    const location = view.getControlLocation(controlId);
    if (!location) {
      return;
    }

    const changed = model.updateControl(location, controlType === 'toggle' ? target.checked : target.value);
    if (!changed) {
      return;
    }

    model.markDirty();
    renderStatus();
    scheduleAutoApply();
  };

  const onApplyClick = (event: MouseEvent) => {
    event.preventDefault();
    void applyNow('手动同步');
  };

  renderShell();
  renderGroups();

  win.requestAnimationFrame(() => {
    const position = floating.recalculatePosition(false);
    const positionPercent = toFloatingPercentPosition(position, {
      win,
      element: view.root,
      padding: VIEWPORT_PADDING,
      fallbackWidth: DEFAULT_PANEL_WIDTH,
      fallbackHeight: DEFAULT_PANEL_HEIGHT,
    });

    if (!model.getState().ui.position) {
      model.setPosition(positionPercent);
    }
  });

  view.refs.launcher.addEventListener('click', onLauncherActivate);
  view.refs.launcher.addEventListener('keydown', onLauncherKeydown);
  view.refs.collapseButton.addEventListener('click', onCollapseClick);
  view.refs.groupsNode.addEventListener('click', onGroupsClick);
  view.refs.groupsNode.addEventListener('change', onGroupsChange);
  view.refs.applyButton.addEventListener('click', onApplyClick);

  if (model.getState().ui.autoApply && model.getState().config.groups.length > 0) {
    void applyNow('初始化同步');
  }

  const destroy = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    $(window).off('pagehide.preset-controller');

    if (autoApplyTimer) {
      clearTimeout(autoApplyTimer);
      autoApplyTimer = undefined;
    }

    view.refs.launcher.removeEventListener('click', onLauncherActivate);
    view.refs.launcher.removeEventListener('keydown', onLauncherKeydown);
    view.refs.collapseButton.removeEventListener('click', onCollapseClick);
    view.refs.groupsNode.removeEventListener('click', onGroupsClick);
    view.refs.groupsNode.removeEventListener('change', onGroupsChange);
    view.refs.applyButton.removeEventListener('click', onApplyClick);

    settingsPanel.destroy();
    floating.destroy();
    view.destroy();
    styleElement.remove();
  };

  $(window).off('pagehide.preset-controller').on('pagehide.preset-controller', destroy);

  return { destroy };
}
