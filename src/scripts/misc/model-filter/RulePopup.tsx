import { createLogger } from '@util/core/logger';
import { openReactPopup, type ReactPopupSession } from '@util/ui/popup/react';
import { useState } from 'react';
import { z } from 'zod';
import type { ModelFilterRuntime } from './runtime';
import type { ModelFilterBinding, ModelFilterRule } from './rules';

type RuleDraft = Pick<ModelFilterRule, 'mode' | 'match' | 'pattern' | 'ignoreCase'>;
type Props = {
  runtime: ModelFilterRuntime;
  binding: ModelFilterBinding;
  existingRule?: ModelFilterRule;
  session: ReactPopupSession;
};

const logger = createLogger('模型列表过滤');

function RuleEditor({ runtime, binding, existingRule, session }: Props) {
  const [draft, setDraft] = useState<RuleDraft>(() => ({
    mode: existingRule?.mode ?? 'exclude',
    match: existingRule?.match ?? 'exact',
    pattern: existingRule?.pattern ?? '',
    ignoreCase: existingRule?.ignoreCase ?? false,
  }));

  const updateDraft = (patch: Partial<RuleDraft>) => setDraft(previous => ({ ...previous, ...patch }));
  const saveRule = () => {
    try {
      runtime.saveRule({ ...binding, ...draft });
    } catch (error) {
      const message =
        error instanceof z.ZodError ? error.issues[0]?.message : error instanceof Error ? error.message : String(error);
      toastr.error(message || '规则无效', '无法保存模型过滤规则');
      return;
    }
    toastr.success(existingRule ? '模型过滤规则已更新。' : '模型过滤规则已创建。');
    void session.cancel().catch(error => logger.error('保存后关闭规则弹窗失败。', error));
  };

  return (
    <div className="model-filter-editor">
      <div className="model-filter-editor-context">
        <strong>{binding.source}</strong>
        <span>{binding.endpoint || '默认端点'}</span>
      </div>
      <div className="model-filter-row">
        <label>
          过滤方式
          <select
            className="text_pole"
            value={draft.mode}
            onChange={event => updateDraft({ mode: event.currentTarget.value as RuleDraft['mode'] })}
          >
            <option value="exclude">隐藏匹配项</option>
            <option value="include">只显示匹配项</option>
          </select>
        </label>
        <label>
          匹配方式
          <select
            className="text_pole"
            value={draft.match}
            onChange={event => updateDraft({ match: event.currentTarget.value as RuleDraft['match'] })}
          >
            <option value="exact">精确模型 ID</option>
            <option value="regex">正则表达式</option>
          </select>
        </label>
      </div>
      <label className="model-filter-pattern">
        {draft.match === 'regex' ? '正则表达式' : '模型 ID（每行一个）'}
        <textarea
          className="text_pole"
          value={draft.pattern}
          onChange={event => updateDraft({ pattern: event.currentTarget.value })}
          placeholder={draft.match === 'regex' ? '^(?:gpt-4o|claude-.*)$' : 'provider/model-one\nprovider/model-two'}
          rows={4}
        />
      </label>
      <label className="model-filter-check">
        <input
          type="checkbox"
          checked={draft.ignoreCase}
          onChange={event => updateDraft({ ignoreCase: event.currentTarget.checked })}
        />
        忽略大小写
      </label>
      <div className="model-filter-editor-actions">
        <button
          type="button"
          className="menu_button"
          onClick={() => void session.cancel().catch(error => logger.error('关闭规则弹窗失败。', error))}
        >
          取消
        </button>
        <button type="button" className="menu_button" onClick={saveRule}>
          保存规则
        </button>
      </div>
    </div>
  );
}

/** Open a fresh editor for either the current connection or an existing saved rule. */
export function openRulePopup(
  runtime: ModelFilterRuntime,
  binding: ModelFilterBinding,
  existingRule?: ModelFilterRule,
) {
  return openReactPopup({
    title: existingRule ? '编辑模型过滤规则' : '新建模型过滤规则',
    className: 'model-filter-rule-popup',
    popup: {
      allowVerticalScrolling: true,
      leftAlign: true,
      okButton: false,
      cancelButton: false,
    },
    render: session => <RuleEditor runtime={runtime} binding={binding} existingRule={existingRule} session={session} />,
  });
}
