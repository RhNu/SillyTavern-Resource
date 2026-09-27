import { createLogger } from '@util/core/logger';
import { getHostDocument } from '@util/st/dom/host';
import { createScriptSettingsSync } from '@util/tavern-helper/state/script-settings';
import { readCurrentBinding } from './binding';
import { createModelListFilter } from './model-list';
import {
  ModelFilterRuleSchema,
  ModelFilterSettingsSchema,
  sameBinding,
  type ModelFilterBinding,
  type ModelFilterRule,
  type ModelFilterSettings,
} from './rules';

const logger = createLogger('模型列表过滤');
const ENDPOINT_INPUT_IDS = new Set([
  'custom_api_url_text',
  'azure_base_url',
  'openai_reverse_proxy',
  'siliconflow_endpoint',
  'minimax_endpoint',
  'zai_endpoint',
  'workers_ai_account_id',
]);

export type ModelFilterRuntime = ReturnType<typeof createModelFilterRuntime>;

/** Own persistent rules and react to SillyTavern connection/list changes. */
export function createModelFilterRuntime() {
  const doc = getHostDocument();
  const listeners = new Set<() => void>();
  const sync = createScriptSettingsSync<ModelFilterSettings>({
    key: 'modelFilter',
    parse: value => ModelFilterSettingsSchema.parse(value),
    defaultValue: { enabled: true, rules: [] },
  });
  let settings = sync.load();
  let destroyed = false;
  const emit = () => listeners.forEach(listener => listener());
  const filter = createModelListFilter(doc, () => settings, emit);

  const refresh = () => filter.apply();
  const hostInput = (event: Event) => {
    const target = event.target;
    if (target && typeof target === 'object' && 'id' in target && ENDPOINT_INPUT_IDS.has(String(target.id))) refresh();
  };
  const hostChange = (event: Event) => {
    const target = event.target;
    if (!target || typeof target !== 'object' || !('id' in target)) return;
    const id = String(target.id);
    if (id === 'chat_completion_source' || ENDPOINT_INPUT_IDS.has(id) || id.startsWith('model_')) refresh();
  };
  doc.addEventListener('input', hostInput);
  doc.addEventListener('change', hostChange);
  const eventListeners = [
    eventOn(tavern_events.CHATCOMPLETION_SOURCE_CHANGED, refresh),
    eventOn(tavern_events.CHATCOMPLETION_MODEL_CHANGED, refresh),
    eventOn(tavern_events.OAI_PRESET_CHANGED_AFTER, refresh),
    eventOn(tavern_events.CONNECTION_PROFILE_LOADED, refresh),
  ];
  logger.info(`已加载 ${settings.rules.length} 条过滤规则。`);

  const save = (next: ModelFilterSettings) => {
    settings = sync.save(next);
    logger.info(`已保存过滤设置：${settings.rules.length} 条规则，${settings.enabled ? '启用' : '停用'}。`);
    refresh();
    emit();
  };

  return {
    getSettings: () => settings,
    getBinding: readCurrentBinding,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setEnabled(enabled: boolean) {
      save({ ...settings, enabled });
    },
    saveRule(input: ModelFilterRule) {
      const rule = ModelFilterRuleSchema.parse(input);
      const rules = settings.rules.filter(item => !sameBinding(item, rule));
      save({ ...settings, rules: [...rules, rule] });
      logger.info(`已更新 ${rule.source} 的模型过滤规则。`);
    },
    removeRule(binding: ModelFilterBinding) {
      const rules = settings.rules.filter(item => !sameBinding(item, binding));
      if (rules.length === settings.rules.length) return;
      save({ ...settings, rules });
      logger.info(`已删除 ${binding.source} 的模型过滤规则。`);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      doc.removeEventListener('input', hostInput);
      doc.removeEventListener('change', hostChange);
      eventListeners.forEach(listener => listener.stop());
      filter.destroy();
      sync.destroy();
      listeners.clear();
      logger.info('脚本运行时已卸载。');
    },
  };
}
