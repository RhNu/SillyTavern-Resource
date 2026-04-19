import { readVariablesPath, updateVariablesPath } from '@util/variables';
import { CONFIG_VARIABLE_PATH, UI_VARIABLE_PATH, variableOption } from './constants';
import {
  normalizeConfig,
  type ControlLocation,
  type ControllerConfig,
  type ControllerControl,
} from './schema';
import {
  normalizeUiState,
  type ControllerState,
  type ImportFormat,
  type PositionPercent,
  type StatusLevel,
} from './state';

function loadInitialState(): ControllerState {
  const config = normalizeConfig(readVariablesPath(variableOption, CONFIG_VARIABLE_PATH));
  const ui = normalizeUiState(readVariablesPath(variableOption, UI_VARIABLE_PATH));

  return {
    config,
    ui,
    dirty: false,
    applying: false,
    statusLevel: 'idle',
    statusText: '就绪',
  };
}

export class PresetControllerModel {
  private state: ControllerState;
  private readonly listeners = new Set<() => void>();

  constructor(initialState: ControllerState = loadInitialState()) {
    this.state = initialState;
  }

  getState(): ControllerState {
    return this.state;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setStatus(level: StatusLevel, text: string) {
    this.state.statusLevel = level;
    this.state.statusText = text;
    this.emitChange();
  }

  setApplying(applying: boolean) {
    this.state.applying = applying;
    this.emitChange();
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
    this.emitChange();
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

    if (control.type === 'toggle' && typeof value === 'boolean') {
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
    return this.state.config.groups[location.groupIndex]?.controls[location.controlIndex];
  }

  private persistConfig() {
    updateVariablesPath(variableOption, CONFIG_VARIABLE_PATH, this.state.config);
    this.emitChange();
  }

  private persistUi() {
    updateVariablesPath(variableOption, UI_VARIABLE_PATH, this.state.ui);
    this.emitChange();
  }

  private emitChange() {
    this.listeners.forEach(listener => {
      listener();
    });
  }
}
