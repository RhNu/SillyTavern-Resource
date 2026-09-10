import { useMemo } from 'react';
import { HelpMarker } from '@util/components/HelpMarker';
import { diagnoseCleanupRules } from '../prompt-analysis/context-cleaner';
import type { ContextCleanup } from '../settings/schema';

function splitRules(value: string, commaSeparated = false): string[] {
  return value
    .split(/\r?\n/)
    .flatMap(line => {
      if (commaSeparated && !line.trimStart().toLowerCase().startsWith('regex:')) return line.split(',');
      return [line];
    })
    .filter(rule => rule.trim().length > 0);
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
  const extractCount = props.value.extractRules.filter(rule => rule.trim()).length;
  const filterCount = props.value.filterRules.filter(rule => rule.trim()).length;

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
        每行一条规则 · 当前提取 {extractCount} 条，过滤 {filterCount} 条
        {diagnostics.length > 0 ? ` · ${diagnostics.length} 条无效规则将被忽略` : ''}
      </p>
      <div className="nai-settings__grid nai-settings__cleanup-grid">
        <RuleField
          label="提取规则"
          help="匹配后只保留标记内部内容。支持 <tag>、[tag]、前缀|后缀；每行也可以用逗号分隔多个普通规则。还支持 regex:/pattern/flags，使用第一个捕获组（没有捕获组时使用整个匹配）。"
          value={props.value.extractRules}
          rows={6}
          commaSeparated
          placeholder={'<thinking>\n[visible]\n<scene>|</scene>\nregex:/<keep>([\\s\\S]*?)<\\/keep>/i'}
          onChange={extractRules => props.onChange({ ...props.value, extractRules })}
        />
        <RuleField
          label="过滤规则"
          help="按填写顺序执行。支持 block:<tag>、before:</tag>、after:<tag>、pair:前缀|后缀、text:文字；正则写作 regex:/pattern/flags，可在末尾追加 =>字面替换文本。"
          value={props.value.filterRules}
          rows={6}
          placeholder={'block:<think>\nbefore:</analysis>\ntext:旁白\nregex:/\\[debug\\][\\s\\S]*?\\[\\/debug\\]/gi'}
          onChange={filterRules => props.onChange({ ...props.value, filterRules })}
        />
      </div>
      {diagnostics.length > 0 && (
        <div className="nai-settings__cleanup-errors" role="status">
          {diagnostics.map((diagnostic, index) => (
            <div key={`${diagnostic.phase}:${diagnostic.rule}:${index}`}>
              {diagnostic.phase === 'extract' ? '提取' : '过滤'}：{diagnostic.rule}（{diagnostic.message}）
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
