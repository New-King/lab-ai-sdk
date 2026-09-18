# Agent 约定

## Lab 是什么

**lab-ai-sdk** = 对照学习站：左侧平铺项目 + 跟做步骤 / 知识点 / 代码 + 右侧官方文档。

- Lab 里展示的代码 = 学员应在 **自己的 Next.js 项目** 里实现的内容。
- 初始化：create next-app → 安装 AI SDK 依赖 → 配 Key → dev；数据在 `lib/projects.ts` 的 `INIT_STEPS`。
- 不要引入 json-render；Lab 本身不跑 AI API，无需 `@ai-sdk/*` 依赖。

## 信息架构

- **首页**（`/`）：AI SDK 基本介绍；点左上角进入，不在侧栏菜单。
- 左侧菜单 = **4 项**：初始化 → 单轮问答 → 流式回复 → 多轮对话。
- 各课页 = 跟做步骤 + 知识点 + 文件 + 代码 + 右侧教学官方文档（`docLinks`）。
- 路由：`/` 首页，`/lab/[slug]` 各菜单项；数据在 `lib/projects.ts`。

## 开发约定

- **只改 lab-ai-sdk**；`demo/my-ai-app` 是学员练习项目，Agent **禁止**直接修改（包括「顺手优化」）。
- 改前先说明；改完列出文件清单。
- 不主动 commit / push。
