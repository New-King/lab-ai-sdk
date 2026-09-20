# Agent 约定

## Lab 是什么

**lab-ai-sdk** = 对照学习站：左侧平铺项目 + 跟做步骤 / 知识点 / 代码 + 右侧官方文档。

- Lab 里展示的代码 = 学员应在 **自己的 Next.js 项目** 里实现的内容。
- 初始化：create next-app → 安装 AI SDK 依赖 → 配 Key → dev；数据在 `lib/projects.ts` 的 `INIT_STEPS`。
- 不要引入 json-render；Lab 本身不跑 AI API，无需 `@ai-sdk/*` 依赖。

## 信息架构

- **首页**（`/`）：AI SDK 基本介绍；点左上角进入，不在侧栏菜单。
- 左侧菜单 = **5 项**：初始化 → 单轮问答 → 流式回复 → 多轮对话 → 生成式 UI。
- 各课页 = 跟做步骤 + 知识点 + 文件 + 代码 + 右侧教学官方文档（`docLinks`）。
- **API 路径统一**：学员项目只用 `app/api/generate/route.ts`，第 2 课创建，第 3–5 课**覆盖**同文件；`app/page.tsx` 每课覆盖。禁止每课新建 `completion/`、`chat/` 等目录。
- 路由：`/` 首页，`/lab/[slug]` 各菜单项；数据在 `lib/projects.ts`。

## SDK 使用守则（改教程代码前必读，禁止重复造轮子）

改 `lib/projects.ts` 里的示例代码前，先对照 [AI SDK 文档](https://ai-sdk.dev/docs) 确认**官方是否已有 Core API 或 UI Hook**；有则必须用，禁止手写等价逻辑。

### Core 层 vs UI 层

| 层 | 包 | 典型 API |
|---|---|---|
| Core | `ai` | `generateText` / `streamText` / `generateObject` / `streamObject` |
| UI | `@ai-sdk/react` | `useCompletion` / `useChat` / `useObject` |

- **Core**：Route Handler、Server Action、脚本、Agent 内部调用。
- **UI Hook**：浏览器端消费**流式**响应；Hook 与流式 Route 成对出现。

### 各课该怎么用（固定分工，勿擅自改）

| 课 | 服务端 | 客户端 | 说明 |
|---|---|---|---|
| 单轮问答 | `generateText` → `Response.json({ text })` | 手写 `fetch` + 本地 state | **有意为之**：非流式 UI 没有 `useGenerateText`；Core 教 `generateText`，客户端自己接 HTTP |
| 流式回复 | `streamText` → `createUIMessageStreamResponse` + `toUIMessageStream` | `useCompletion` | 禁止手写 fetch 读流、禁止 `toTextStreamResponse()`（v7 已弃用） |
| 多轮对话 | `streamText` + `onEnd` → `saveChat`；GET 加载历史 | `useChat` + `id` / `chatId` + 挂载时 fetch 恢复 | 禁止 localStorage 存 messages；禁止 `toUIMessageStreamResponse()`（v7 已弃用） |
| 生成式 UI | 同上 + `tools` + `stopWhen: isStepCount(5)` | `useChat` + 渲染 `tool-*` parts → React 组件 | 禁止 json-render；tool 定义放 `lib/tools.ts` |

### Hook 选型（勿混用）

| 场景 | 用 | 不要用 |
|---|---|---|
| 单轮文本补全（流式 UI） | `useCompletion` + `streamText` | 手写 fetch 逐 chunk 解析 |
| 多轮聊天 | `useChat` | `useCompletion`、手写 messages 数组 |
| 结构化 JSON 流 | `useObject` + `streamObject` + zod | `useCompletion`、自己 JSON.parse 流 |
| 非流式一次性文本（脚本/API） | `generateText` | 为省事改成流式（除非课目标就是流式） |

### 禁止事项

- 不要引入 **json-render** / `useUIStream`（与本 Lab 无关）。
- 不要在流式/多轮课里用裸 `fetch` + `useState` 替代 `@ai-sdk/react` Hook。
- 不要在单轮课里强行改成 `useCompletion`（会和非流式 `generateText` 课目标冲突）。
- 改 Route 前先查 v7 响应 helper：`createUIMessageStreamResponse`、`createTextStreamResponse` 等，勿用 result 上的弃用方法。

### 新增或改课时的检查清单

1. 这类交互官方推荐哪个 Core API / UI Hook？
2. 服务端返回格式是否与 Hook 的 stream protocol 匹配？
3. 现有示例是否已在教同一能力？避免流式课与单轮课职责重叠。
4. 初始化 `INIT_STEPS` 已装 `@ai-sdk/react` 的课，客户端是否用上了对应 Hook？

## 开发约定

- **只改 lab-ai-sdk**；`demo/my-ai-app` 是学员练习项目，Agent **禁止**直接修改（包括「顺手优化」）。
- 改前先说明；改完列出文件清单。
- 不主动 commit / push。
