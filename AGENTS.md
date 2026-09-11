# AGENTS 文档入口

本仓库所有与 Agent 相关的约束、上下文和操作指南，统一收束在 `agents` 目录。

使用 `pnpm build` 生产构建所有浏览器端项目和服务端插件；只构建其中一类时使用 `pnpm build:scripts` 或
`pnpm build:plugins`。

即使是在开发环境，也使用生产构建为主。

## 1. 总索引

- [agents/INDEX.md](agents/INDEX.md)

## 2. 基础规则（优先阅读）

- [agents/rules/项目基本概念.md](agents/rules/项目基本概念.md)
- [agents/rules/酒馆助手接口.md](agents/rules/酒馆助手接口.md)
- [agents/rules/酒馆变量.md](agents/rules/酒馆变量.md)

## 3. 按任务类型补充

- 前端界面任务: [agents/rules/前端界面.md](agents/rules/前端界面.md)
- 脚本任务: [agents/rules/脚本.md](agents/rules/脚本.md)
- 测试任务: [agents/rules/测试.md](agents/rules/测试.md)
- MVU 变量: [agents/rules/mvu变量框架.md](agents/rules/mvu变量框架.md)
- MVU 角色卡: [agents/rules/mvu角色卡.md](agents/rules/mvu角色卡.md)

## 4. MCP 说明

- [agents/rules/mcp.md](agents/rules/mcp.md)

## 5. 维护约定

- 新增或更新规则文档请直接放在 `agents` 目录。
- 每次完成工作前，必须完成 `pnpm check` 以及 `pnpm build` 的检查，并修复潜在问题。

## 6. 代码可读性

- 模块应按领域职责拆分；界面组件只负责布局、展示和派发用户动作，配置归一化、业务校验、持久化与外部请求不得大段耦合在 React/Vue 组件中。
- 名称应表达领域含义，避免含糊缩写和超长控制器；一个文件同时承担协议、状态、UI 与平台调用时，应先拆出稳定边界。
- 对协议转换、状态恢复、事务顺序、模型差异和其他“为什么必须这样做”的关键点补充简洁注释；不要为逐行复述代码添加低价值注释。
- 新增配置应先在独立 schema/领域层完成默认值、约束和错误表达，再接入界面。
- 即时错误禁止通过编辑已有界面元素专门划分 pending/error 展示区域；优先使用 popup 或 toast 呈现错误，持续状态说明使用紧凑的状态标记与 HelpMarker。

## 7. 源码核对

SillyTavern 的本地源代码位于 `../SillyTavern` 内，对应 1.18.0 版本，当任务涉及相关内容时，需要去其中查询。
