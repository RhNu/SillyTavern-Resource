# tavern_helper_template

酒馆助手编写前端界面或脚本的模板，从 [源模板](https://github.com/StageDog/tavern_helper_template)
更新而来，采用了 Vite 系工具链，采用 React 作为前端首选，支持后端插件构建，扩展了一些辅助功能。

## 使用方法

无论哪种方式, 请阅读[教程文档](https://stagedog.github.io/青空莉/工具经验/实时编写前端界面或脚本/)来了解如何使用.

### 仅本地使用

你可以点击网页右上角的绿色 `Code` 按钮-`Download ZIP` 下载本模板的压缩包来只在本地使用

### 作为 Github 仓库

你可以通过以下两种方式中的一种来创建仓库:

- 点击网页右上角绿色 `Use this template` 按钮;
- 或者点击网页右上角的 `fork` 按钮, 但需要手动去 fork 所得仓库的 `Actions` 页面启用自动工作流.

在创建好仓库后, 你需要配置工作流的权限: 前往仓库 `Settings -> Actions -> General` 中将 `Workflow permissions` 设置为
`Read and write permissions`, 并勾选 `Allow GitHub Actions to create and approve pull requests`

## 如果只在本地使用

这意味着:

- 你将不能利用 jsdelivr 实现前端界面或脚本的自动更新;
- 也不能享受本模板提供的自动打包、自动更新功能:
  - 上传代码后, 自动打包 `src/scripts` 和 `src/plugins` 到 `dist` 对应子目录;
  - 自动更新成最新的编写模板, 自动更新酒馆和酒馆助手的参考文件……

但你本地依旧能很方便地使用这个模板.

### 本地工具链

本模板要求 Node.js 24.12 或更新版本, 并通过 `packageManager` 固定 pnpm 12。常用命令:

```bash
pnpm install
pnpm build          # 构建浏览器端项目和服务端插件
pnpm build:scripts  # 仅构建浏览器端项目
pnpm build:plugins  # 仅构建服务端插件
pnpm watch          # 监听源码并按需重建
pnpm check          # 格式、lint、类型和构建契约测试
```

## 如果创建为新仓库

在创建好仓库后, 你可以把仓库网址发给 AI, 问 AI 该**怎么启用 `core.symlinks`**, 然后克隆到本地使用; 或者, 你可以游玩
[Learn Git Branching](https://learngitbranching.js.org/?locale=zh_CN) 来学习 git 分支和合并.

#### `.vscode/launch.json` 文件

由于 `.vscode/launch.json` 文件中填写了你的酒馆地址, 你可能需要运行命令来忽略这个更改, 避免你的云酒馆 ip 地址暴露:

```bash
git update-index --skip-worktree .vscode/launch.json
```

### 示例文件夹

`示例` 与 `初始模板` 已迁移为 React + Zustand 写法, 可直接作为参考复制.

当前自动构建的浏览器端项目发现范围限定在 `src/scripts/**/index.{ts,tsx,js,jsx}`, 因此这些目录默认不会被自动打包到
`dist/scripts`.

如需开发 SillyTavern 服务端插件, 使用 `src/plugins/<插件名>/index.ts` 目录约定, 并运行 `pnpm build:plugins` 生成
`dist/plugins/<插件名>/index.cjs`. 具体的插件类型、检查和部署约定见 [后端插件开发规则](agents/rules/后端插件.md).

#### 利用 jsdelivr 实现前端界面或脚本的自动更新

由于你所制作的前端界面或脚本将被打包在 github 仓库中, 你将能用 jsdelivr 链接来访问它们, 而这个链接可以在前端界面或脚本中直接使用.

由此你就可以为用户创建这样一个自动更新的前端界面:

```html
<body>
  <script>
    $('body').load('https://testingcf.jsdelivr.net/gh/lolo-desu/lolocard/dist/scripts/日记络络/界面/介绍页/index.html');
  </script>
</body>
```

或一个自动更新的脚本:

```typescript
import 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/酒馆助手/场景感/index.js';
```

脚本构建会将“裸包导入”自动改写为 jsdelivr 的 ESM URL (例如 `lodash` ->
`https://testingcf.jsdelivr.net/npm/lodash/+esm`), 本地相对导入和 `@scripts/`、`@util/` 导入仍会被打包进单文件产物.

更多请见于[文档](https://stagedog.github.io/青空莉/工具经验/实时编写前端界面或脚本/进阶技巧).

### 自动打包、自动更新功能

本仓库在 `.github/workflows` 文件夹中设置了几个 CI 工作流来为你带来自动打包、自动更新功能, 你也可以在网页上方的
`Actions` 中手动运行它们:

**`bundle.yaml`**

- 自动打包 `src/scripts` 中的浏览器端项目到 `dist/scripts`, 并打包 `src/plugins` 中的服务端插件到
  `dist/plugins`, 再自动递增版本号从而让 jsdelivr 更快更新缓存.
- 如果配置了 S3 兼容对象存储所需的仓库 Secrets 和变量, 会以 `dist/scripts/` 为根目录同步浏览器端产物, 不会上传
  `dist/plugins/`.

启用对象存储同步时, 需要在仓库 `Settings -> Secrets and variables -> Actions` 中添加以下 Secrets:

- `S3_ACCESS_KEY_ID`: 对象存储的 Access Key ID
- `S3_SECRET_ACCESS_KEY`: 对象存储的 Secret Access Key

并添加以下仓库 Variables:

- `S3_BUCKET`: 目标存储桶名称
- `S3_PREFIX`: 存储桶内的目标前缀, 例如 `my-resource/prod`
- `S3_REGION`: 对象存储使用的区域; Cloudflare R2 填写 `auto`, 其他服务按服务商要求填写
- `S3_ENDPOINT`: 自定义 S3 API 端点. 使用 Amazon S3 默认端点时可以留空, 使用 R2 等 S3 兼容服务时填写服务商提供的端点

例如, 使用 Cloudflare R2 时可以这样配置:

- `S3_ENDPOINT`: `https://<accountid>.r2.cloudflarestorage.com`
- `S3_BUCKET`: R2 存储桶名称
- `S3_PREFIX`: `my-resource/prod`
- `S3_REGION`: `auto`
- `S3_ACCESS_KEY_ID`: R2 API Token 对应的 Access Key ID
- `S3_SECRET_ACCESS_KEY`: R2 API Token 对应的 Secret Access Key

未配置完整对象存储信息时, 工作流会跳过上传而继续完成构建.

**`bump_deps.yaml`**

- 每三天一次, 自动更新第三方库依赖和酒馆助手 `@types` 文件夹.

**`sync_template.yaml`**

- 在你基于模板仓库创建新仓库后, 你的新仓库将不再和模板仓库有关联, 因此我设置了这个工作流用于同步模板仓库的更新 (如编程助手编写规则、MCP、slash_command.txt 文件等):
  - 发现模板仓库更新后, 这个工作流将会自动创建一个 pull request 来同步更新, 而**你需要手动批准 pull
    request, 因此建议你时常查看 github 的邮件通知;**
  - 如果模板仓库中有文件是你不想继续同步的, 可以在 `.github/.templatesyncignore` 中添加它.

### 打包冲突问题

为了自动更新和打包一些东西, 本项目直接打包源代码在 `dist/` 文件夹中并随仓库上传, 而这会让开发时经常出现分支冲突.

为了解决这一点, 仓库在 `.gitattribute` 中设置了对于 `dist/` 文件夹中的冲突总是使用当前版本. 这不会有什么问题: 在上传后,
ci 会将 `dist/` 文件夹重新打包成最新版本, 因而你上传的 `dist/` 文件夹内容如何无关紧要.

为了启用这个功能, 请执行一次以下命令:

```bash
git config --global merge.ours.driver true
```

## 许可证

[Aladdin](LICENSE)
