import { SCRIPT_DISPLAY_NAME } from './constants';
import { getHostContext } from './host';
import { parseImportedConfig } from './importer';
import { PresetControllerModel } from './model';
import { clampPosition, fromPercentPosition, getDefaultPosition, toPercentPosition } from './position';
import { applyConfigToInUsePreset } from './preset-sync';
import { formatError, ImportFormatSchema, type Position } from './schema';
import { installStyle, removePreviousMount } from './style';
import { PresetControllerView } from './view';

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

export function createPresetControllerRuntime() {
  const { doc, win } = getHostContext();
  removePreviousMount(doc);

  const styleElement = installStyle(doc);
  const model = new PresetControllerModel();
  const view = new PresetControllerView(doc);

  let autoApplyTimer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;
  let dragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  const renderShell = () => view.renderShell(model.getState());
  const renderGroups = () => view.renderGroups(model.getState().config, model.getState().ui);
  const renderStatus = () => view.renderStatus(model.getState());

  const moveRootTo = (nextPosition: Position, persist = false) => {
    const clamped = clampPosition(nextPosition, win, view.root);
    view.setPosition(clamped.x, clamped.y);

    if (persist) {
      model.setPosition(toPercentPosition(clamped, win, view.root));
    }
  };

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
        const message = `已应用 ${result.touchedPromptCount} 项提示词开关`;
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

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) {
      return;
    }

    moveRootTo({
      x: event.clientX - dragOffsetX,
      y: event.clientY - dragOffsetY,
    });
  };

  const stopDragging = () => {
    if (!dragging) {
      return;
    }

    dragging = false;
    view.root.classList.remove('is-dragging');
    const rect = view.getRect();
    moveRootTo({ x: rect.left, y: rect.top }, true);
  };

  const onHeaderPointerDown = (event: PointerEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button,input,select,textarea,label,summary')) {
      return;
    }

    const rect = view.getRect();
    dragging = true;
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;
    view.root.classList.add('is-dragging');
    event.preventDefault();
  };

  const onResize = () => {
    const rect = view.getRect();
    moveRootTo({ x: rect.left, y: rect.top }, true);
  };

  const onCollapseClick = (event: MouseEvent) => {
    event.preventDefault();
    model.setCollapsed(!model.getState().ui.collapsed);
    view.renderCollapsed(model.getState().ui.collapsed);
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

    const changed = model.updateControl(location, controlType === 'switch' ? target.checked : target.value);
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

  const onAutoApplyChange = () => {
    model.setAutoApply(view.refs.autoApplyInput.checked);
    renderStatus();
    if (model.getState().ui.autoApply && model.getState().dirty) {
      scheduleAutoApply();
    }
  };

  const onImportFormatChange = () => {
    model.setImportFormat(ImportFormatSchema.parse(view.refs.importFormatSelect.value));
  };

  const onImportTextClick = (event: MouseEvent) => {
    event.preventDefault();
    void importConfig(view.getImportText());
  };

  const onImportFileClick = (event: MouseEvent) => {
    event.preventDefault();
    view.refs.importFileInput.click();
  };

  const onImportFileChange = () => {
    const file = view.refs.importFileInput.files?.[0];
    if (!file) {
      return;
    }

    void file
      .text()
      .then(content => importConfig(content, file.name))
      .finally(() => {
        view.clearFileInput();
      });
  };

  renderShell();
  renderGroups();

  win.requestAnimationFrame(() => {
    const state = model.getState();
    const initialPosition = state.ui.position
      ? fromPercentPosition(state.ui.position, win, view.root)
      : getDefaultPosition(win, view.root);
    moveRootTo(initialPosition);
  });

  view.refs.header.addEventListener('pointerdown', onHeaderPointerDown);
  doc.addEventListener('pointermove', onPointerMove);
  doc.addEventListener('pointerup', stopDragging);
  doc.addEventListener('pointercancel', stopDragging);
  win.addEventListener('resize', onResize);

  view.refs.collapseButton.addEventListener('click', onCollapseClick);
  view.refs.groupsNode.addEventListener('click', onGroupsClick);
  view.refs.groupsNode.addEventListener('change', onGroupsChange);
  view.refs.applyButton.addEventListener('click', onApplyClick);
  view.refs.autoApplyInput.addEventListener('change', onAutoApplyChange);
  view.refs.importFormatSelect.addEventListener('change', onImportFormatChange);
  view.refs.importTextButton.addEventListener('click', onImportTextClick);
  view.refs.importFileButton.addEventListener('click', onImportFileClick);
  view.refs.importFileInput.addEventListener('change', onImportFileChange);

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

    view.refs.header.removeEventListener('pointerdown', onHeaderPointerDown);
    doc.removeEventListener('pointermove', onPointerMove);
    doc.removeEventListener('pointerup', stopDragging);
    doc.removeEventListener('pointercancel', stopDragging);
    win.removeEventListener('resize', onResize);

    view.refs.collapseButton.removeEventListener('click', onCollapseClick);
    view.refs.groupsNode.removeEventListener('click', onGroupsClick);
    view.refs.groupsNode.removeEventListener('change', onGroupsChange);
    view.refs.applyButton.removeEventListener('click', onApplyClick);
    view.refs.autoApplyInput.removeEventListener('change', onAutoApplyChange);
    view.refs.importFormatSelect.removeEventListener('change', onImportFormatChange);
    view.refs.importTextButton.removeEventListener('click', onImportTextClick);
    view.refs.importFileButton.removeEventListener('click', onImportFileClick);
    view.refs.importFileInput.removeEventListener('change', onImportFileChange);

    view.destroy();
    styleElement.remove();
  };

  $(window).off('pagehide.preset-controller').on('pagehide.preset-controller', destroy);

  return { destroy };
}
