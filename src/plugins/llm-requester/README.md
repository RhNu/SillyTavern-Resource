# LLM Requester

基于 Vercel AI SDK 的 SillyTavern 服务端请求器。v1 支持非流式 OpenAI-compatible Chat
Completions。Provider、凭证和模型是独立的连接维度：插件公开可用 Provider 和凭证标签，由调用方选择后再发起模型发现或生成请求；真实 API
Key 始终留在服务端。

## 端点

| 方法 | 路径                                         | 说明                                      |
| ---- | -------------------------------------------- | ----------------------------------------- |
| GET  | `/api/plugins/llm-requester/v1/capabilities` | 查询 Provider、凭证标签和请求器能力       |
| POST | `/api/plugins/llm-requester/v1/models`       | 使用所选连接从 Provider 获取模型列表      |
| POST | `/api/plugins/llm-requester/v1/generate`     | 使用所选 Provider、凭证和模型执行生成请求 |

内置 Provider 包括 OpenAI、OpenRouter、Mistral AI、Groq、DeepSeek、xAI、Chutes、Electron Hub、NanoGPT、AI/ML
API、Moonshot AI、Fireworks AI、Z.AI、SiliconFlow 和 Custom。固定 Provider 的 Base
URL 由后端注册表管理；只有 Custom 由调用方提供 Base URL，并允许不选择密钥。

凭证列表来自当前 SillyTavern 用户的 `SecretManager`，响应只包含
`id`、标签和 active 状态。后续请求携带凭证 ID，插件在服务端按 ID 读取对应值，因此同一种 Provider 下保存的多份密钥都可以独立选择。模型列表通过 OpenAI
Node SDK 的 `models.list()` 获取，生成通过 Vercel AI SDK 的 `generateText()` 完成。

请求协议的 Zod schema 和浏览器客户端位于 `util/llm-requester/`。消息数组允许最后一条消息为
`assistant`，用于支持 OpenAI-compatible 服务提供的 assistant prefill。工具没有服务端
`execute`，调用方负责处理返回的 tool call。

## 部署

1. 执行 `pnpm build:plugins`。
2. 将 `dist/plugins/llm-requester/` 复制到 SillyTavern 的 `plugins/`。
3. 在 SillyTavern `config.yaml` 中启用 `enableServerPlugins`。
4. 在 SillyTavern API Connections 中为需要使用的 Provider 保存至少一个密钥；Custom 也可使用无密钥服务。

插件会读取 SillyTavern 内部的 secrets、constants 和 additional-headers 模块。若对应内部接口发生变化，capabilities 会返回
`runtimeCompatible: false`，生成端点返回明确的兼容性错误。
