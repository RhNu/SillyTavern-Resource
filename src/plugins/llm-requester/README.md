# LLM Requester

基于 Vercel AI SDK 的 SillyTavern 服务端请求器。v1 仅支持非流式 OpenAI-compatible Chat
Completions，使用当前 SillyTavern 用户密码管理器中的 `Custom API Key`，不会接收或保存前端传来的 API Key。

## 端点

| 方法 | 路径                                         | 说明                         |
| ---- | -------------------------------------------- | ---------------------------- |
| GET  | `/api/plugins/llm-requester/v1/capabilities` | 查询运行时、凭证和能力状态   |
| POST | `/api/plugins/llm-requester/v1/generate`     | 非流式文本或工具调用生成请求 |

请求协议的 Zod schema 和浏览器客户端位于 `util/llm-requester/`。消息数组允许最后一条消息为
`assistant`，用于支持 OpenAI-compatible 服务提供的 assistant prefill。工具没有服务端
`execute`，调用方负责处理返回的 tool call。

## 部署

1. 执行 `pnpm build:plugins`。
2. 将 `dist/plugins/llm-requester/` 复制到 SillyTavern 的 `plugins/`。
3. 在 SillyTavern `config.yaml` 中启用 `enableServerPlugins`。
4. 在 SillyTavern API Connections 中配置 Custom API Key。

插件会读取 SillyTavern 内部的 secrets、constants 和 additional-headers 模块。若对应内部接口发生变化，capabilities 会返回
`runtimeCompatible: false`，生成端点返回明确的兼容性错误。
