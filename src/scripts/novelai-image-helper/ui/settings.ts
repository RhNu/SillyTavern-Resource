import type { NovelAiImageService } from '../app/service';
import { SettingsSchema } from '../settings/schema';

function field(label: string, $input: JQuery): JQuery {
  return $('<label class="nai-settings__field">').append($('<span>').text(label), $input);
}

function checkbox(label: string, checked: boolean): JQuery<HTMLInputElement> {
  return $('<input type="checkbox">').prop('checked', checked).attr('aria-label', label) as JQuery<HTMLInputElement>;
}

export function openSettings(service: NovelAiImageService): void {
  const settings = service.settings.get();
  const $host = $('<div class="nai-settings">');
  const $enabled = checkbox('启用脚本', settings.enabled);
  const $auto = checkbox('自动分析新消息', settings.analysis.auto);
  const $autoGenerate = checkbox('分析后自动生图', settings.analysis.autoGenerate);
  const $proxyPreset = $('<input class="text_pole" type="text">').val(settings.analysis.proxyPreset);
  const $apiUrl = $('<input class="text_pole" type="text">').val(settings.analysis.apiUrl);
  const $apiKey = $('<input class="text_pole" type="password">').val(settings.analysis.apiKey);
  const $analysisModel = $('<input class="text_pole" type="text">').val(settings.analysis.model);
  const $historyCount = $('<input class="text_pole" type="number" min="0" max="100">').val(
    settings.analysis.historyCount,
  );
  const $minimumFloor = $('<input class="text_pole" type="number" min="0">').val(settings.analysis.minimumFloor);
  const $debounceMs = $('<input class="text_pole" type="number" min="0" max="60000">').val(
    settings.analysis.debounceMs,
  );
  const $maxTokens = $('<input class="text_pole" type="number" min="256" max="32000">').val(
    settings.analysis.maxTokens,
  );
  const $paragraphLength = $('<input class="text_pole" type="number" min="1" max="2000">').val(
    settings.analysis.minimumParagraphLength,
  );
  const $template = $('<textarea class="text_pole" rows="8">').val(settings.analysis.template);
  const $imageModel = $('<select class="text_pole">');
  $imageModel.append($('<option>').val(settings.generation.model).text(settings.generation.model));
  $imageModel.val(settings.generation.model);
  const $width = $('<input class="text_pole" type="number" step="64" min="64" max="1600">').val(
    settings.generation.width,
  );
  const $height = $('<input class="text_pole" type="number" step="64" min="64" max="1600">').val(
    settings.generation.height,
  );
  const $steps = $('<input class="text_pole" type="number" min="1" max="50">').val(settings.generation.steps);
  const $scale = $('<input class="text_pole" type="number" min="0" max="10" step="0.1">').val(
    settings.generation.scale,
  );
  const $sampler = $('<select class="text_pole">');
  [
    'k_euler',
    'k_euler_ancestral',
    'k_dpm_2',
    'k_dpm_2_ancestral',
    'k_dpmpp_2m',
    'k_dpmpp_2m_sde',
    'k_dpmpp_2s_ancestral',
    'k_dpmpp_sde',
    'ddim',
    'ddim_v3',
  ].forEach(sampler => $sampler.append($('<option>').val(sampler).text(sampler)));
  $sampler.val(settings.generation.sampler);
  const $schedule = $('<select class="text_pole">');
  ['karras', 'exponential', 'polyexponential'].forEach(schedule =>
    $schedule.append($('<option>').val(schedule).text(schedule)),
  );
  $schedule.val(settings.generation.schedule);
  const $seed = $('<input class="text_pole" type="number" min="1" placeholder="留空则随机">').val(
    settings.generation.seed ?? '',
  );
  const $timeoutMs = $('<input class="text_pole" type="number" min="10000" max="180000" step="1000">').val(
    settings.generation.timeoutMs,
  );
  const $prefix = $('<textarea class="text_pole" rows="2">').val(settings.generation.prefix);
  const $suffix = $('<textarea class="text_pole" rows="2">').val(settings.generation.suffix);
  const $negative = $('<textarea class="text_pole" rows="3">').val(settings.generation.negative);
  const $characters = $('<textarea class="text_pole" rows="10">').val(JSON.stringify(settings.characters, null, 2));
  const $status = $('<div class="nai-settings__status">').text('正在检查 imggen-novelai...');
  const $save = $('<button type="button" class="menu_button">').text('保存');
  const $cancel = $('<button type="button" class="menu_button menu_button_cancel">').text('取消');

  $host
    .append($('<h3>').text('NovelAI 图片助手'))
    .append(
      $('<section>').append(
        $('<h4>').text('工作流'),
        field('启用脚本', $enabled),
        field('自动分析新消息', $auto),
        field('分析后自动生图', $autoGenerate),
        field('最低消息楼层', $minimumFloor),
        field('历史消息条数', $historyCount),
        field('最短段落长度', $paragraphLength),
        field('自动分析防抖（毫秒）', $debounceMs),
      ),
      $('<section>').append(
        $('<h4>').text('独立提示词模型'),
        $('<p class="nai-settings__hint">').text('优先使用代理预设；未填写时使用 OpenAI 兼容 API。'),
        field('代理预设', $proxyPreset),
        field('API 地址', $apiUrl),
        field('API Key', $apiKey),
        field('模型', $analysisModel),
        field('最大输出 Tokens', $maxTokens),
        field('分析模板', $template),
      ),
      $('<section>').append(
        $('<h4>').text('imggen-novelai'),
        $status,
        field('模型', $imageModel),
        field('宽度', $width),
        field('高度', $height),
        field('步数', $steps),
        field('CFG Scale', $scale),
        field('采样器', $sampler),
        field('噪声调度', $schedule),
        field('Seed', $seed),
        field('请求超时（毫秒）', $timeoutMs),
        field('主提示词前缀', $prefix),
        field('主提示词后缀', $suffix),
        field('全局负面提示词', $negative),
      ),
      $('<section>').append(
        $('<h4>').text('人物库 JSON'),
        $('<p class="nai-settings__hint">').text('每项字段：id、name、prompt、negative、enabled。'),
        $characters,
      ),
      $('<div class="nai-settings__actions">').append($cancel, $save),
    );

  void service.backend
    .capabilities()
    .then(capabilities => {
      $imageModel.empty();
      capabilities.models.forEach(model => $imageModel.append($('<option>').val(model.id).text(model.id)));
      $imageModel.val(settings.generation.model);
      $status
        .toggleClass('is-error', !capabilities.configured)
        .text(`插件 ${capabilities.version} · ${capabilities.configured ? 'Token 已配置' : 'Token 未配置'}`);
    })
    .catch(error => $status.addClass('is-error').text(error instanceof Error ? error.message : String(error)));

  const popup = new SillyTavern.Popup($host[0], SillyTavern.POPUP_TYPE.DISPLAY, '', {
    wide: true,
    wider: true,
    okButton: false,
    cancelButton: false,
  });
  $cancel.on('click', () => void popup.completeCancelled());
  $save.on('click', () => {
    try {
      const characters = JSON.parse(String($characters.val() ?? '[]')) as unknown;
      const next = SettingsSchema.parse({
        ...settings,
        enabled: $enabled.prop('checked'),
        analysis: {
          ...settings.analysis,
          auto: $auto.prop('checked'),
          autoGenerate: $autoGenerate.prop('checked'),
          minimumFloor: Number($minimumFloor.val()),
          proxyPreset: String($proxyPreset.val() ?? ''),
          apiUrl: String($apiUrl.val() ?? ''),
          apiKey: String($apiKey.val() ?? ''),
          model: String($analysisModel.val() ?? ''),
          historyCount: Number($historyCount.val()),
          minimumParagraphLength: Number($paragraphLength.val()),
          debounceMs: Number($debounceMs.val()),
          maxTokens: Number($maxTokens.val()),
          template: String($template.val() ?? ''),
        },
        generation: {
          ...settings.generation,
          model: String($imageModel.val()),
          width: Number($width.val()),
          height: Number($height.val()),
          steps: Number($steps.val()),
          scale: Number($scale.val()),
          sampler: String($sampler.val()),
          schedule: String($schedule.val()),
          seed: String($seed.val() ?? '').trim() ? Number($seed.val()) : null,
          timeoutMs: Number($timeoutMs.val()),
          prefix: String($prefix.val() ?? ''),
          suffix: String($suffix.val() ?? ''),
          negative: String($negative.val() ?? ''),
        },
        characters,
      });
      service.settings.update(draft => Object.assign(draft, next));
      toastr.success('设置已保存', 'NovelAI 图片助手');
      void popup.completeAffirmative();
    } catch (error) {
      toastr.error(error instanceof Error ? error.message : String(error), '设置格式错误');
    }
  });
  void popup.show().finally(() => $host.remove());
}
