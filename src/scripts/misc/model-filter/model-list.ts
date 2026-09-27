import { createLogger } from '@util/core/logger';
import { getHostJQuery } from '@util/st/dom/host';
import { readCurrentBinding, readSelectedModelId } from './binding';
import type { ModelFilterSettings, ModelFilterRule } from './rules';
import { sameBinding, shouldDisplayModel } from './rules';

const logger = createLogger('模型列表过滤');

/** SillyTavern 1.18.0 chat-completion controls. Text-completion controls live outside #openai_api. */
const MODEL_CONTROL_IDS: Record<string, readonly string[]> = {
  openai: ['model_openai_select'],
  claude: ['model_claude_select'],
  openrouter: ['model_openrouter_select'],
  ai21: ['model_ai21_select'],
  makersuite: ['model_google_select'],
  vertexai: ['model_vertexai_select'],
  mistralai: ['model_mistralai_select'],
  groq: ['model_groq_select'],
  siliconflow: ['model_siliconflow_select'],
  minimax: ['model_minimax_select'],
  electronhub: ['model_electronhub_select'],
  chutes: ['model_chutes_select'],
  nanogpt: ['model_nanogpt_select'],
  workers_ai: ['model_workers_ai_select'],
  deepseek: ['model_deepseek_select'],
  fireworks: ['model_fireworks_select'],
  cometapi: ['model_cometapi_select'],
  perplexity: ['model_perplexity_select'],
  cohere: ['model_cohere_select'],
  custom: ['model_custom_select', 'model_custom_select_fill'],
  xai: ['model_xai_select'],
  aimlapi: ['model_aimlapi_select'],
  pollinations: ['model_pollinations_select'],
  moonshot: ['model_moonshot_select'],
  zai: ['model_zai_select'],
  azure_openai: ['azure_openai_model'],
};

type ModelControl = HTMLSelectElement | HTMLDataListElement;
type NativeOptionState = { hidden: boolean; disabled: boolean };
type ModelListState = {
  control: ModelControl;
  source: string;
  detached: boolean;
  originalChildren: Node[];
  appliedRuleKey: string | null;
  appliedSelectedValue: string;
};

const CONTROL_SOURCES = new Map(
  Object.entries(MODEL_CONTROL_IDS).flatMap(([source, ids]) => ids.map(id => [id, source] as const)),
);
const SELECT2_CONTROL_IDS = new Set([
  'model_openrouter_select',
  'model_aimlapi_select',
  'model_electronhub_select',
  'model_chutes_select',
  'model_nanogpt_select',
]);

function isModelControl(element: Element): element is ModelControl {
  return (element.tagName === 'SELECT' || element.tagName === 'DATALIST') && CONTROL_SOURCES.has(element.id);
}

function isSelect2Control(control: ModelControl): boolean {
  return control.tagName === 'DATALIST' || SELECT2_CONTROL_IDS.has(control.id);
}

function cloneChildren(control: ModelControl): Node[] {
  return [...control.childNodes].map(node => node.cloneNode(true));
}

function ruleKey(rule: ModelFilterRule | undefined): string | null {
  return rule ? JSON.stringify(rule) : null;
}

/** Keep group labels only when at least one of their options remains visible. */
function filteredClone(node: Node, rule: ModelFilterRule, selectedValue: string): Node | null {
  const element = node.nodeType === 1 ? (node as Element) : null;
  if (element?.tagName === 'OPTION') {
    const option = element as HTMLOptionElement;
    if (option.value && option.value !== selectedValue && !shouldDisplayModel(rule, option.value)) return null;
    return node.cloneNode(true);
  }
  if (element?.tagName === 'OPTGROUP') {
    const group = node.cloneNode(false);
    for (const child of node.childNodes) {
      const option = filteredClone(child, rule, selectedValue);
      if (option) group.appendChild(option);
    }
    return (group as Element).querySelector('option') ? group : null;
  }
  return node.cloneNode(true);
}

/** Filter UI nodes after SillyTavern renders them, leaving its model_list and request settings intact. */
export function createModelListFilter(
  doc: Document,
  getSettings: () => ModelFilterSettings,
  onUpdate: () => void,
): { apply: () => void; destroy: () => void } {
  const root = doc.querySelector('#openai_api');
  if (!root) throw new Error('未找到聊天补全设置区域 #openai_api');

  const controlStates = new Map<ModelControl, ModelListState>();
  const nativeOptions = new WeakMap<HTMLOptionElement, NativeOptionState>();
  const nativeGroups = new WeakMap<HTMLOptGroupElement, boolean>();
  let scheduled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;
  let lastBindingKey = '';

  const findControls = () => {
    for (const [id, source] of CONTROL_SOURCES) {
      const element = doc.getElementById(id);
      if (!element || !root.contains(element) || !isModelControl(element)) continue;
      if (!controlStates.has(element)) {
        controlStates.set(element, {
          control: element,
          source,
          detached: isSelect2Control(element),
          originalChildren: cloneChildren(element),
          appliedRuleKey: null,
          appliedSelectedValue: '',
        });
      }
    }
  };

  const applyNative = (state: ModelListState, rule: ModelFilterRule | undefined) => {
    const select = state.control as HTMLSelectElement;
    const selectedValue = readSelectedModelId(state.source) || select.value;
    let hiddenCount = 0;
    for (const option of select.querySelectorAll('option')) {
      let original = nativeOptions.get(option);
      if (!original) {
        original = { hidden: Boolean(option.hidden), disabled: option.disabled };
        nativeOptions.set(option, original);
      }
      const hide = Boolean(
        rule && option.value && option.value !== selectedValue && !shouldDisplayModel(rule, option.value),
      );
      option.hidden = original.hidden || hide;
      option.disabled = original.disabled || hide;
      if (hide) hiddenCount += 1;
    }
    for (const group of select.querySelectorAll('optgroup')) {
      if (!nativeGroups.has(group)) nativeGroups.set(group, Boolean(group.hidden));
      group.hidden = nativeGroups.get(group)! || [...group.querySelectorAll('option')].every(option => option.hidden);
    }
    if (state.appliedRuleKey !== ruleKey(rule)) {
      logger.info(`${state.source} 原生模型列表已更新，隐藏 ${hiddenCount} 项。`);
    }
    state.appliedRuleKey = ruleKey(rule);
    state.appliedSelectedValue = selectedValue;
  };

  const applyDetached = (state: ModelListState, rule: ModelFilterRule | undefined) => {
    const nextKey = ruleKey(rule);
    const control = state.control;
    const selectedValue =
      control.tagName === 'SELECT' ? readSelectedModelId(state.source) || (control as HTMLSelectElement).value : '';
    if (nextKey === null && state.appliedRuleKey === null) return;
    if (nextKey === state.appliedRuleKey && selectedValue === state.appliedSelectedValue) return;
    const nodes = rule
      ? state.originalChildren
          .map(node => filteredClone(node, rule, selectedValue))
          .filter((node): node is Node => node !== null)
      : state.originalChildren.map(node => node.cloneNode(true));
    control.replaceChildren(...nodes);
    if (control.tagName === 'SELECT') {
      (control as HTMLSelectElement).value = selectedValue;
      if (control.classList.contains('select2-hidden-accessible')) {
        getHostJQuery()(control).trigger('change.select2');
      }
    }
    state.appliedRuleKey = nextKey;
    state.appliedSelectedValue = selectedValue;
    logger.info(`${state.source} 模型候选列表已更新，显示 ${control.querySelectorAll('option').length} 项。`);
  };

  const apply = () => {
    if (destroyed) return;
    observer.disconnect();
    try {
      findControls();
      const binding = readCurrentBinding();
      const settings = getSettings();
      const rule = binding && settings.enabled ? settings.rules.find(item => sameBinding(item, binding)) : undefined;
      const bindingKey = binding ? `${binding.source}\u0000${binding.endpoint}` : '';
      if (lastBindingKey !== bindingKey) {
        logger.info(`当前连接已切换：${binding?.source ?? '未设置'}，${binding?.endpoint ? '指定端点' : '默认端点'}。`);
        lastBindingKey = bindingKey;
      }
      for (const state of controlStates.values()) {
        if (!state.control.isConnected) {
          controlStates.delete(state.control);
          continue;
        }
        const activeRule = state.source === binding?.source ? rule : undefined;
        if (state.detached) applyDetached(state, activeRule);
        else applyNative(state, activeRule);
      }
      onUpdate();
    } finally {
      observer.observe(root, { childList: true, subtree: true });
    }
  };

  const schedule = () => {
    if (scheduled || destroyed) return;
    scheduled = true;
    timer = setTimeout(() => {
      scheduled = false;
      timer = undefined;
      apply();
    }, 0);
  };

  const observer = new MutationObserver(records => {
    let changed = false;
    for (const record of records) {
      const target = record.target.nodeType === 1 ? (record.target as Element) : record.target.parentElement;
      const control = target?.closest('select, datalist');
      if (!control || !isModelControl(control)) continue;
      const state = controlStates.get(control);
      if (state?.detached) {
        // SillyTavern replaces these lists when new models arrive. Capture the new original list.
        state.originalChildren = cloneChildren(control);
        state.appliedRuleKey = null;
        state.appliedSelectedValue = '';
      }
      changed = true;
    }
    if (changed) schedule();
  });

  apply();
  return {
    apply: schedule,
    destroy() {
      if (destroyed) return;
      observer.disconnect();
      if (timer) clearTimeout(timer);
      for (const state of controlStates.values()) {
        if (state.detached) applyDetached(state, undefined);
        else applyNative(state, undefined);
      }
      controlStates.clear();
      destroyed = true;
      logger.info('已恢复模型列表并停止监听。');
    },
  };
}
