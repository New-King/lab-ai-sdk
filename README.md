# AI SDK Lab

> 项目目录名：`lab-ai-sdk`

Vercel AI SDK v7 **对照学习站**：左侧 5 个项目平铺，中间看跟做步骤 / 知识点 / 代码，右侧链本教学相关官方文档。

Lab 用于对照学习；代码在 `my-ai-app` 项目里跟着写（位于 `../../demo/my-ai-app`），本地跑通即可验证效果。

## 导航

- **首页**（`/`）：基本介绍，点左上角「AI SDK Lab」进入，不在左侧菜单显示。
- **左侧菜单**：1 初始化 → 2 单轮问答 → 3 流式回复 → 4 多轮对话 → 5 生成式 UI

## 初始化

```bash
pnpm create next-app@latest my-ai-app --typescript --tailwind --eslint --app --import-alias "@/*" --use-pnpm --yes
cd my-ai-app
pnpm add ai @ai-sdk/react @ai-sdk/deepseek zod
# 新建 .env.local：DEEPSEEK_API_KEY=sk-...
pnpm dev
```

若 `create-next-app` 仍弹出交互选项：TypeScript / ESLint / Tailwind / App Router 选 **Yes**，`src/` 目录选 **No**。

## 维护

改教程示例前读 `AGENTS.md` 的 **SDK 使用守则**（Core/UI 分工、Hook 选型、禁止重复造轮子）。

## 相关

- 练习项目：`../../demo/my-ai-app`
- [AI SDK 文档](https://ai-sdk.dev/docs)
