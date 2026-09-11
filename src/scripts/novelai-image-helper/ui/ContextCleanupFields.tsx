import { useMemo } from 'react';
import { HelpMarker } from '@util/react/components/HelpMarker';
import { diagnoseCleanupRules } from '../prompt-analysis/context-cleaner';
import type { ContextCleanup } from '../settings/schema';

function splitRules(value: string, commaSeparated = false): string[] {
  return value.split(/\r?\n/).flatMap(line => {
    if (commaSeparated && !line.trimStart().toLowerCase().startsWith('regex:')) return line.split(',');
    return [line];
  });
}

function RuleField(props: {
  label: string;
  help: string;
  value: readonly string[];
  rows: number;
  placeholder: string;
  commaSeparated?: boolean;
  onChange: (value: string[]) => void;
}) {
  return (
    <label className="nai-settings__field">
      <span className="nai-settings__field-label">
        <span>{props.label}</span>
        <HelpMarker title={props.label} text={props.help} />
      </span>
      <textarea
        className="text_pole"
        rows={props.rows}
        value={props.value.join('\n')}
        placeholder={props.placeholder}
        spellCheck={false}
        onChange={event => props.onChange(splitRules(event.currentTarget.value, props.commaSeparated))}
      />
    </label>
  );
}

export function ContextCleanupFields(props: { value: ContextCleanup; onChange: (value: ContextCleanup) => void }) {
  const diagnostics = useMemo(() => diagnoseCleanupRules(props.value), [props.value]);
  const storyCount = props.value.storyRules.filter(rule => rule.trim()).length;
  const cleanupCount = props.value.cleanupRules.filter(rule => rule.trim()).length;

  return (
    <section className="nai-settings__cleanup">
      <div className="nai-settings__title-with-help">
        <h4>正文清洗</h4>
        <HelpMarker
          title="正文清洗范围"
          text="这些规则只由 NovelAI 图片助手在构造分析上下文时执行，不会读取、调用或修改 SillyTavern 的正则设置。最新 AI 正文和历史消息使用相同规则；世界书原样保留。"
        />
      </div>
      <p className="nai-settings__empty">
        每行一条规则 · 当前正文 {storyCount} 条，清洗 {cleanupCount} 条
        {diagnostics.length > 0 ? ` · ${diagnostics.length} 条无效规则将被忽略` : ''}
      </p>
      <div className="nai-settings__grid nai-settings__cleanup-grid">
        <RuleField
          label="正文规则"
          help="任一规则命中时，按原文顺序提取并合并全部匹配区域；全部未命中时使用完整文本。支持 <tag>、[tag]、前缀|后缀；正则使用第一个捕获组，没有捕获组时使用完整匹配。"
          value={props.value.storyRules}
          rows={6}
          commaSeparated
          placeholder={'<thinking>\n[visible]\n<scene>|</scene>\nregex:/<keep>([\\s\\S]*?)<\\/keep>/i'}
          onChange={storyRules => props.onChange({ ...props.value, storyRules })}
        />
        <RuleField
          label="清洗规则"
          help="按填写顺序执行。支持 block:<tag>、before:</tag>、after:<tag>、pair:前缀|后缀、text:文字；正则写作 regex:/pattern/flags，可在末尾追加不含换行的 =>字面替换文本。"
          value={props.value.cleanupRules}
          rows={6}
          placeholder={'block:<think>\nbefore:</analysis>\ntext:旁白\nregex:/\\[debug\\][\\s\\S]*?\\[\\/debug\\]/gi'}
          onChange={cleanupRules => props.onChange({ ...props.value, cleanupRules })}
        />
      </div>
      {diagnostics.length > 0 && (
        <div className="nai-settings__cleanup-errors" role="status">
          {diagnostics.map((diagnostic, index) => (
            <div key={`${diagnostic.phase}:${diagnostic.rule}:${index}`}>
              {diagnostic.phase === 'story' ? '正文' : '清洗'}：{diagnostic.rule}（{diagnostic.message}）
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
