# 前端设计中的酒馆原生 CSS 变量

在本项目里做前端界面时，**应优先使用酒馆原生 CSS 变量，而不是写死一套独立配色。**

## 为什么重要

- 酒馆用户经常会切换主题、皮肤、字体和明暗风格。直接引用原生变量，界面才能自然融入宿主，而不是像“外挂面板”。
- 同一个脚本可能运行在不同角色卡、不同设备、不同自定义主题下。写死颜色通常只在作者自己的主题里好看。
- 原生变量已经表达了酒馆对正文、弱化文本、边框、模糊层、强调色的语义。复用这些语义，比重新发明一套视觉系统更稳定。
- 后续维护成本更低。酒馆主题变化时，界面通常不需要再额外重配色。

## 完整酒馆原生主题变量列表

在开发时，你可以基于以下酒馆原生 CSS 变量进行颜色配置与混色：

```
--SmartThemeBodyColor
--SmartThemeCheckboxBgColorR
--SmartThemeCheckboxBgColorG
--SmartThemeCheckboxBgColorB
--SmartThemeCheckboxBgColorA
--SmartThemeEmColor
--SmartThemeUnderlineColor
--SmartThemeQuoteColor
--SmartThemeBlurTintColor
--SmartThemeChatTintColor
--SmartThemeUserMesBlurTintColor
--SmartThemeBotMesBlurTintColor
--SmartThemeShadowColor
--SmartThemeBorderColor
```

## 推荐做法

- 文本主色优先使用 `var(--SmartThemeBodyColor, inherit)`。
- 次级文本优先基于正文色做弱化，例如：

```css
color: color-mix(in srgb, var(--SmartThemeBodyColor, #d8d8d8) 76%, transparent);
```

- 边框优先使用 `var(--SmartThemeBorderColor)`，再用 `color-mix()` 调整强弱。
- 面板背景优先使用 `var(--SmartThemeBlurTintColor)`，避免写死纯黑、纯白或固定品牌色。
- 强调态、选中态优先从 `var(--SmartThemeQuoteColor)` 取色，而不是自己指定蓝绿紫。
- 已有酒馆控件类名如 `menu_button`、`text_pole` 能复用时，优先复用。

## 常见反例

- 用固定渐变把整个面板刷成一套品牌色。
- 大面积使用 `#fff`、`#111`、`#6b7cff` 之类硬编码颜色作为常态色。
- 只在深色主题里测试，导致浅色主题下对比度失衡。
- 自己实现一套按钮、输入框、标签风格，和酒馆原生控件完全脱节。

## 一个简单判断标准

如果把酒馆主题从深色切到浅色，或者换成用户自定义主题后，你的界面：

- 还能正常阅读
- 层级仍然清楚
- 不显得突兀

那通常说明变量使用方向是对的。

## 建议优先级

1. 先用酒馆原生变量把基础层级做对。
2. 再用少量 `color-mix()` 做细节强化。
3. 最后才考虑很轻的个性化装饰。

默认目标不是“做出一套新品牌”，而是“让界面像酒馆自己长出来的一部分”。
