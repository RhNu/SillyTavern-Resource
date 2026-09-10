# NovelAI Image Helper

全新的结构化 NovelAI 图片脚本。它只使用 `imggen-novelai` 服务端插件，不兼容旧版 `ImgGenHelper` 的后端或 `|`
分隔提示词协议。

## 工作流

1. 从 `llm-requester` 选择 Provider、SillyTavern 已保存凭证和自动发现的模型，独立调用 OpenAI-compatible 提示词模型。
2. 根据生图模型选择 V4.5 Danbooru 或 V5 自然语言模板，通过强制工具调用获得主提示词和逐角色提示词。
3. 将完整结构写入消息变量，再向消息正文提交稳定锚点。
4. 以单消费者队列调用 `/api/plugins/imggen-novelai/v1/generate`。
5. 上传返回的 PNG，并在楼层中渲染图片卡片。

配置保存在脚本变量 `novelaiImageHelper.settings`，图片块保存在消息变量 `novelaiImageHelper`。设置 schema
v6 保存 Provider ID、凭证 ID、Custom Base URL（仅 Custom 使用）和模型 ID；真实 API Key 不进入脚本设置。v4 中已填写 Base
URL 的配置会迁移为 Custom Provider，旧版前端 API
Key 不会被迁移。人物库内容只作为模型参考，并可绑定到角色卡、聊天和用户人设。

## 正文清洗

- 最新 AI 正文和历史消息使用同一组脚本内部规则；世界书条目不会经过这些规则处理。
- 过滤规则每行一条：`block:<tag>`、`before:</tag>`、`after:<tag>`、`pair:前缀|后缀`、`text:字面量`。
- 提取规则支持 `<tag>`、`[tag]`、`前缀|后缀`；也支持每行一个 `regex:/pattern/flags`，默认提取第一个捕获组。
- 过滤正则同样写在本设置中，例如 `regex:/<think\b[\s\S]*?<\/think>/gi`；可用 `=>替换文本` 指定字面替换。
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
```

`analyzeMessage` 的第二个参数控制分析结束后是否立即加入生图队列。
