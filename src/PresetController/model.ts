import { readVariablesRecord } from '@util/variables';
import { variableOption } from './constants';
import {
  CONFIG_SCHEMA_VERSION,
  ControllerConfigSchema,
  UiStateSchema,
  normalizeConfig,
  normalizeUiState,
  type ControlLocation,
  type ControllerConfig,
  type ControllerControl,
  type ControllerState,
  type ImportFormat,
  type PositionPercent,
  type StatusLevel,
  type UiState,
} from './schema';

const StoredStateSchema = z.object({
  schema: z.literal(CONFIG_SCHEMA_VERSION),
  config: ControllerConfigSchema.prefault({}),
  ui: UiStateSchema.prefault({}),
});

function parseStoredState(raw: unknown): { config: ControllerConfig; ui: UiState } {
  const parsed = StoredStateSchema.parse(raw);
  return {
    config: parsed.config,
    ui: parsed.ui,
  };
}

function persistStateRoot(config: ControllerConfig, ui: UiState) {
  replaceVariables(
    {
      schema: CONFIG_SCHEMA_VERSION,
      config,
      ui,
    },
    variableOption,
  );
}

function loadInitialState(): ControllerState {
  const raw = readVariablesRecord(variableOption);

  let config = normalizeConfig(undefined);
  let ui = normalizeUiState(undefined);
  let shouldPersist = true;

  try {
    const parsed = parseStoredState(raw);
    config = parsed.config;
    ui = parsed.ui;
    shouldPersist = false;
  } catch {
    // Invalid root payload: reset to defaults under current root schema.
  }

  if (shouldPersist) {
    persistStateRoot(config, ui);
  }

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
    persistStateRoot(this.state.config, this.state.ui);
  }

  private persistUi() {
    persistStateRoot(this.state.config, this.state.ui);
  }
}
