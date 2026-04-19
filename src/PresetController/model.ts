import { readVariablesPath, updateVariablesPath } from '@util/variables';
import { STORE_ROOT_PATH, variableOption } from './constants';
import {
  type ControlLocation,
  type ControllerControl,
  type ControllerConfig,
  type ControllerState,
  type ImportFormat,
  type PositionPercent,
  type StatusLevel,
  normalizeConfig,
  normalizeUiState,
} from './schema';

function loadInitialState(): ControllerState {
  const configRaw = readVariablesPath(variableOption, `${STORE_ROOT_PATH}.config`);
  const uiRaw = readVariablesPath(variableOption, `${STORE_ROOT_PATH}.ui`);

  return {
    config: normalizeConfig(configRaw),
    ui: normalizeUiState(uiRaw),
    dirty: false,
    applying: false,
    statusLevel: 'idle',
    statusText: '就绪',
  };
}

export class PresetControllerModel {
  private state: ControllerState;

  constructor(initialState: ControllerState = loadInitialState()) {
    this.state = initialState;
  }

  getState(): ControllerState {
    return this.state;
  }

  setStatus(level: StatusLevel, text: string) {
    this.state.statusLevel = level;
    this.state.statusText = text;
  }

  setApplying(applying: boolean) {
    this.state.applying = applying;
  }

  replaceConfig(config: ControllerConfig) {
    this.state.config = config;
    this.persistConfig();
  }

  markDirty(text = '有未同步改动') {
    this.state.dirty = true;
    this.setStatus('idle', text);
  }

  markClean() {
    this.state.dirty = false;
  }

  setCollapsed(collapsed: boolean) {
    this.state.ui.collapsed = collapsed;
    this.persistUi();
  }

  setAutoApply(autoApply: boolean) {
    this.state.ui.autoApply = autoApply;
    this.persistUi();
  }

  setGroupCollapsed(groupId: string, collapsed: boolean) {
    this.state.ui.groupCollapsed[groupId] = collapsed;
    this.persistUi();
  }

  setImportFormat(importFormat: ImportFormat) {
    this.state.ui.importFormat = importFormat;
    this.persistUi();
  }

  setPosition(position: PositionPercent) {
    this.state.ui.position = position;
    this.persistUi();
  }

  updateControl(location: ControlLocation, value: boolean | string): boolean {
    const control = this.getControl(location);
    if (!control) {
      return false;
    }

    if (control.type === 'switch' && typeof value === 'boolean') {
      if (control.value === value) {
        return false;
      }

      control.value = value;
      this.persistConfig();
      return true;
    }

    if (control.type === 'radio' && typeof value === 'string') {
      if (control.value === value || !control.options.some(option => option.value === value)) {
        return false;
      }

      control.value = value;
      this.persistConfig();
      return true;
    }

    return false;
  }

  private getControl(location: ControlLocation): ControllerControl | undefined {
    return this.state.config.groups[location.groupIndex]?.items[location.itemIndex]?.controls[location.controlIndex];
  }

  private persistConfig() {
    updateVariablesPath(variableOption, `${STORE_ROOT_PATH}.config`, this.state.config);
  }

  private persistUi() {
    updateVariablesPath(variableOption, `${STORE_ROOT_PATH}.ui`, this.state.ui);
  }
}
