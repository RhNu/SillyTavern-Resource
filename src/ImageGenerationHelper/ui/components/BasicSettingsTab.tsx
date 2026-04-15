import { useImageGenerationStore } from '../../core/store';
import { HELP_TEXT } from '../meta';
import HelpMarker from './HelpMarker';

export default function BasicSettingsTab() {
  const config = useImageGenerationStore(state => state.config);
  const updateConfig = useImageGenerationStore(state => state.updateConfig);

  return (
    <section className="imggen-section">
      <div className="imggen-section-header">
        <h4 className="imggen-section-title">通用设置</h4>
      </div>
      <div className="imggen-toggle-list">
        <label className="imggen-check">
          <input
            checked={config.enabled}
            type="checkbox"
            onChange={event => {
              const checked = event.currentTarget.checked;
              updateConfig(draft => {
                draft.enabled = checked;
              });
            }}
          />
          <span className="imggen-check-label">
            <span>启用图片生成脚本</span>
            <HelpMarker text={HELP_TEXT.scriptEnabled} />
          </span>
        </label>
        <label className="imggen-check">
          <input
            checked={config.independentApi.autoRequest}
            type="checkbox"
            onChange={event => {
              const checked = event.currentTarget.checked;
              updateConfig(draft => {
                draft.independentApi.autoRequest = checked;
              });
            }}
          />
          <span className="imggen-check-label">
            <span>自动请求提示词生成</span>
            <HelpMarker text={HELP_TEXT.independentAutoRequest} />
          </span>
        </label>
        <label className="imggen-check">
          <input
            checked={config.generation.autoSend}
            type="checkbox"
            onChange={event => {
              const checked = event.currentTarget.checked;
              updateConfig(draft => {
                draft.generation.autoSend = checked;
              });
            }}
          />
          <span className="imggen-check-label">
            <span>自动图片生成</span>
            <HelpMarker text={HELP_TEXT.autoSend} />
          </span>
        </label>
      </div>
    </section>
  );
}
