# NovelAI Image Helper

全新的结构化 NovelAI 图片脚本。它只使用 `imggen-novelai` 服务端插件，不兼容旧版 `ImgGenHelper` 的后端或 `|`
分隔提示词协议。

## 工作流

1. 使用 `llm-requester` 服务端插件和 SillyTavern Custom API Key 独立调用 OpenAI-compatible 提示词模型。
2. 根据生图模型选择 V4.5 Danbooru 或 V5 自然语言模板，通过强制工具调用获得主提示词和逐角色提示词。
3. 将完整结构写入消息变量，再向消息正文提交稳定锚点。
4. 以单消费者队列调用 `/api/plugins/imggen-novelai/v1/generate`。
5. 上传返回的 PNG，并在楼层中渲染图片卡片。

配置保存在脚本变量 `novelaiImageHelper.settings`，图片块保存在消息变量 `novelaiImageHelper`。设置 schema
v4 使用独立的 OpenAI-compatible Base URL，并从 SillyTavern 密码管理器读取 Custom API Key；旧版前端 API
Key 不会被迁移。人物库内容只作为模型参考，并可绑定到角色卡、聊天和用户人设。

## 前置条件

- SillyTavern 已开启服务端插件。
- 已部署 `llm-requester`，并在 SillyTavern 中配置 Custom API Key。
- 已部署 `imggen-novelai`，并为服务端进程设置 `NOVELAI_TOKEN`。
- 设置中填写 OpenAI-compatible Base URL 和模型名称。

## 跨脚本接口

加载完成后会注册 `NovelAIImageHelper`：

```ts
await waitGlobalInitialized('NovelAIImageHelper');

await NovelAIImageHelper.analyzeMessage(messageId, false);
NovelAIImageHelper.generateBlock(messageId, blockId);
const block = NovelAIImageHelper.getBlock(messageId, blockId);
```

`analyzeMessage` 的第二个参数控制分析结束后是否立即加入生图队列。
