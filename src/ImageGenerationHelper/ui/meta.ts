import { PROMPT_TEMPLATE_CHARACTER_LIST_TOKEN } from '../prompt-generation/placeholders';

export const SETTINGS_TABS = [
  { key: 'basic', label: '通用', description: '这里控制脚本总开关，以及自动提示词生成和自动图片生成的开关。' },
  { key: 'official', label: '图片生成', description: 'NovelAI 图片参数、上传保存策略，以及请求队列和超时控制。' },
  { key: 'independent', label: '提示词生成', description: '提示词生成分析、上下文过滤和内置 ordered prompts。' },
  { key: 'prompt', label: '提示词模板', description: '前后缀预设、模板编辑和模板说明。' },
  { key: 'characters', label: '人物库', description: '人物条目及其角色卡、聊天、用户人设绑定。' },
] as const;

export type SettingsTabKey = (typeof SETTINGS_TABS)[number]['key'];

export const HELP_TEXT = {
  scriptEnabled:
    '关闭后会停止脚本的全部功能，包括图片锚点处理、图片卡片渲染、自动图片生成和自动提示词生成；正文里的锚点文本会保留。',
  autoSend: '识别到没有结果图的图片锚点时，自动调用脚本内置的 NovelAI 图片请求；关闭后仍可在楼层卡片里手动生成。',
  independentAutoRequest:
    '收到新的 AI 消息并识别到可插入段落时，自动发起提示词生成请求；关闭后仅保留手动“生成提示词”。',
  sequential: '将同一条消息中的多个图片锚点串行排队，避免同时请求 NovelAI 接口。',
  intervalSeconds: '多个图片生成请求之间的等待时间。顺序模式和普通排队都会使用它。',
  retryCount: '图片生成失败后的最大重试次数，不含第一次请求。',
  retryDelaySeconds: '图片生成重试前的等待时间。',
  timeoutEnabled: '为图片生成请求增加真正的超时保护；超时会中断当前请求并按重试策略处理。',
  timeoutSeconds: '图片生成请求超时时间，单位秒。',
  renderLatestRefMessagesEnabled:
    '开启后，只在当前已加载聊天里为最近 N 条包含图片锚点的 AI 楼层挂载图片卡片，旧楼层恢复普通文本显示。',
  renderLatestRefMessagesCount: '开启渲染范围限制后，实际保留图片卡片的最近楼层数量。',
  imageModel: '脚本内置 NovelAI 生图模型，不再读取官方 stable-diffusion 插件当前模型。',
  imageSampler: 'NovelAI sampler 参数。',
  imageScheduler: 'NovelAI scheduler 参数。若旧配置无效，会自动回退到 karras。',
  imageSteps: 'NovelAI 步数。启用 Avoid spending Anlas 时，请求阶段还会进一步压到免费上限。',
  imageScale: 'NovelAI guidance / scale 参数。',
  imageWidth: '输出宽度，单位像素。会自动按 64 的倍数归一化。',
  imageHeight: '输出高度，单位像素。会自动按 64 的倍数归一化。',
  imageSeed: '随机种子。填 -1 表示每次随机。',
  imageUpscaleRatio: 'NovelAI upscale_ratio 参数。',
  imageAnlasGuard: '开启后，自动压缩超限尺寸和步数，尽量避免触发 NovelAI Anlas 消耗。',
  imageSm: 'SMEA 开关。部分 sampler / model 组合会自动强制关闭。',
  imageSmDyn: 'SMEA Dynamic 开关，仅在启用 SMEA 且当前组合支持时生效。',
  imageDecrisper: '降低高 guidance 下的伪影。',
  imageVarietyBoost: '提高输出变化幅度。',
  independentMinFloor: '只有消息楼层号达到该值时，才会触发提示词生成分析。',
  independentHistoryCount: '发送给提示词生成的历史消息条数，只统计当前消息之前的聊天记录。',
  independentParagraphMinLength: '长度低于该值的段落会被忽略，不参与插入提示词原文识别与插入定位，可减少短句误命中。',
  independentDebounceMs: '收到 AI 消息后等待多久再发起提示词生成，用于避开连续刷新。',
  independentRetryCount: '提示词生成失败后的最大重试次数，不含第一次请求。',
  independentRetryDelaySeconds: '提示词生成重试前的等待时间。',
  independentApiUrl: '提示词生成所用接口的基础地址。',
  independentApiKey: '提示词生成接口的访问密钥，仅存储在脚本配置中。',
  independentModel: '提示词生成请求时使用的模型名称。',
  independentMaxTokens: '传给提示词生成接口的 max_tokens。',
  independentTemperature: '传给提示词生成接口的 temperature。',
  independentTopP: '传给提示词生成接口的 top_p。',
  independentFrequencyPenalty: '传给提示词生成接口的 frequency_penalty。',
  independentPresencePenalty: '传给提示词生成接口的 presence_penalty。',
  filterTags:
    '每行一条过滤规则，按顺序执行。block:<small> 删除包裹块；before:</think> 删除右标签前全部内容；after:[analysis] 删除左标签后全部内容；pair:前缀|后缀 删除自定义包裹；text:字面量 删除纯文本。',
  extractTags: '若匹配到这些标签，只保留标签中的内容作为精简上下文。',
  promptPreset: '图片生成时会读取当前预设的前缀、后缀、负面词和注入模式，拼成最终请求。',
  promptNegative: '图片生成请求使用的负面词。',
  promptInjectionMode:
    '开启 NAI 适配后，若提示词中使用 | 分隔多段内容，后缀只注入第一段；关闭时始终按普通逗号拼接。',
  promptTemplate:
    '提示词生成消息会引用这里的模板文本来约束最终绘图提示词内容；模板不需要输出锚点、包裹标签或 JSON 外壳。',
  characterLibrary: `人物库条目会填入模板中的 ${PROMPT_TEMPLATE_CHARACTER_LIST_TOKEN} 占位符。`,
  characterBinding: '绑定后，条目只有在当前角色卡、聊天和用户人设命中时才会生效；未绑定条目始终生效。',
  personaBinding: '用户人设绑定使用当前 persona 名称作为键。若当前无法读到 persona 名称，则该绑定暂不可用。',
} as const;

export const PROMPT_TEMPLATE_GUIDE = {
  summary:
    '模板用于告诉提示词生成如何组织最终绘图提示词内容。脚本会在正文插入 [[ImageGenRef id="..."]] 锚点，把 prompt 存到楼层消息变量，并在聊天显示里把锚点替换成图片卡片；模板本身只负责提示词正文。',
  placeholders: [
    {
      token: PROMPT_TEMPLATE_CHARACTER_LIST_TOKEN,
      description: '插入当前生效的人物库条目。未绑定条目始终插入，绑定条目需要命中当前角色卡、聊天和用户人设。',
    },
  ],
  recommendedOrder: '主体, 固定特征, 表情, 服装, 动作, 镜头, 场景, 光照, 质量词',
} as const;
