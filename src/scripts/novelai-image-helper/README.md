# NovelAI Image Helper

全新的结构化 NovelAI 图片脚本。它只使用 `imggen-novelai` 服务端插件，不兼容旧版 `ImgGenHelper` 的后端或 `|`
分隔提示词协议。

## 工作流

1. 从 `llm-requester` 选择 Provider、SillyTavern 已保存凭证和自动发现的模型，独立调用 OpenAI-compatible 提示词模型。
2. 根据生图模型选择指导模板：V4.5 使用 Danbooru 标签串（性别隔离、动态/NSFW 分级、构图标签），V5 使用以构图为中心的自然语言，标签只用于数量、专名与精确动作。两者都通过强制工具调用获得主提示词和逐角色提示词。
3. 先按正文规则选择正文，再执行清洗；清洗后的每个非空行生成 A1、A2 等候选锚点，模型通过 `anchor_id`
   选点。图片记录统一写入聊天变量，再向正文提交稳定图片引用。
4. 把图片块交给内部工作流队列，逐个执行 `validate → generate → upload → commit → associate` 五个阶段。
5. 上传返回的 PNG，在楼层中渲染图片卡片，并将新输出单向登记到 SillyTavern 的
   `chat_metadata.chat_backgrounds`，供聊天背景图库与 Data Maid 识别。图片块中的 `outputs[].url` 始终是事实来源。

## 队列与重试

NovelAI 生图有限流，因此队列是串行的，并且**任何两次 NovelAI 生成请求之间都要跨过一个节流窗口**：上一个任务结束后不会立即开始下一个，自动重试也不会立即重发。窗口基准由「请求间隔毫秒」控制（默认 4000），实际等待会在基准值上下浮动 25%，也就是默认的 3–5 秒。

- 阶段化重试：只重跑失败的阶段。生成成功但上传失败时，重试会复用已经生成好的图片，不会再次消耗 NovelAI 配额。
- 登记失败时，自动重试和之后的手动重试都只补写 `chat_backgrounds`，不会重新生成、上传或追加输出。
- 可重试：超时、网络错误、429 限流、5xx、上游返回异常。
- 不可重试：401/403 凭证问题、400 参数错误与内容审核拒绝、模型不支持、角色数超限。
- 后端未配置 `NOVELAI_TOKEN` 或凭证失效时，队列会直接失败掉剩余任务，不再逐个重复请求。

队列阶段和尝试次数只在内存中。刷新后，没有结果的图片回到草稿，有结果的图片恢复为可查看状态，不自动重启生成。已保存但尚未完成背景登记的输出保留
`pendingAssociation` 检查点，可通过「重试失败」只补做登记。

悬浮指示器（可拖拽）会显示当前任务、阶段、重试次数与节流倒计时，并提供暂停/恢复、取消当前、取消全部、重试失败四个操作。暂停只会阻止取出下一个任务，已经开始的那次生成会正常跑完。持续更新的实时进度 Toast 可在设置中关闭；成功与失败 Toast 始终展示。

配置保存在脚本变量 `novelaiImageHelper`，图片记录保存在聊天变量 `novelaiImageHelper.images`。设置 schema
v9 保存 Provider ID、凭证 ID、Custom Base
URL（仅 Custom 使用）、模型 ID，以及生成超时、上传超时、自动重试次数与请求间隔；真实 API
Key 不进入脚本设置。人物库内容只作为模型参考，并可绑定到角色卡、聊天和用户人设。

## 锚点与存储边界

- 正文块之间及末块之后提供候选标记 `[插图锚点 A1]`。候选标记仅出现在本次分析请求里，每个位置最多选择一次。
- 选中的位置写入永久引用 `[[NovelAIImage id="nai_…"]]`；图片 ID 不依赖楼层号或候选编号。
- 正文规则任意命中时，按原文顺序提取并合并所有非重叠匹配；全部未命中时使用完整文本。
- 正文选择完成后才执行清洗规则。空行直接忽略，每个非空换行段都得到独立候选锚点；正文标签内部也可直接插图。
- 正文匹配与清洗始终保留原文字符映射，永久图片引用写回所选行的原始结束位置。
- 设置 schema v9 不读取或迁移旧版正文清洗字段。
- 每份图片提示词和输出仅在聊天仓储保存一次。消息只通过正文引用图片，脚本完全不读取、迁移或清理旧消息变量。
- 开始提交时预存记录，失败时根据所有 swipe 中的实际引用恢复；正文已写入时不会删除对应记录。启动时清理无任何 swipe 引用的新仓储记录，不删除图片文件。
- 生图任务检查聊天、消息页、原文和提示词快照；目标变化后不再写回旧任务结果。

## 正文清洗

- 最新 AI 正文和历史消息使用同一组脚本内部规则；世界书条目不会经过这些规则处理。
- 正文规则支持 `<tag>`、`[tag]`、`前缀|后缀`；也支持每行一个 `regex:/pattern/flags`，默认提取第一个捕获组。
- 清洗规则每行一条：`block:<tag>`、`before:</tag>`、`after:<tag>`、`pair:前缀|后缀`、`text:字面量`。
- 清洗正则同样写在本设置中，例如 `regex:/<think\b[\s\S]*?<\/think>/gi`；可用 `=>替换文本` 指定不含换行的字面替换。
- 这些正则只属于本脚本的上下文清洗器，不会读取、调用或修改 SillyTavern 的正则设置。

每次 NovelAI 请求固定生成一张 PNG。再次生成会把新输出追加到同一个图片块，卡片会保留并显示所有历史输出的缩略图，可随时切换查看。不会迁移旧版
`ImgGenHelper` 的设置或消息变量。

## 前置条件

- SillyTavern 已开启服务端插件。
- 已部署 `llm-requester`，并在 SillyTavern 中保存目标 Provider 的凭证（无密钥 Custom 服务除外）。
- 已部署 `imggen-novelai`，并为服务端进程设置 `NOVELAI_TOKEN`。
- 在设置中依次选择 Provider、凭证和自动获取的模型；选择 Custom 时还需填写 Base URL。

## 跨脚本接口

加载完成后会注册 `NovelAIImageHelper`：

```ts
await waitGlobalInitialized('NovelAIImageHelper');

await NovelAIImageHelper.analyzeMessage(messageId, false);
NovelAIImageHelper.generateBlock(messageId, blockId);
const block = NovelAIImageHelper.getBlock(messageId, blockId);

const snapshot = NovelAIImageHelper.getQueueSnapshot();
NovelAIImageHelper.pauseQueue();
NovelAIImageHelper.resumeQueue();
NovelAIImageHelper.cancelQueue();
NovelAIImageHelper.retryFailedBlocks();
```

`analyzeMessage` 的第二个参数控制分析结束后是否立即加入生图队列。`generateBlock` 返回 `{ ok: true }` 或
`{ ok: false, reason: 'duplicate' | 'missing' | 'destroyed' }`； `retryFailedBlocks` 返回本次重新入队与跳过的数量。
