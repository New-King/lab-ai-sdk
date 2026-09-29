# 待办：给 AI SDK 官方文档提 PR（生成式 UI 示例在 strict TS 下类型报错）

> 记录时间：2026-09-28。当时已完成排查与本地验证，**尚未向上游提交**，等有空再做。
> 相关人：本地课程 `lab-ai-sdk` 第 5 课已经用「方案 A」修好，可直接对照。

---

## 一、问题是什么

- **仓库**：`vercel/ai`（AI SDK 文档与代码同仓）
- **文件**：`content/docs/04-ai-sdk-ui/04-generative-user-interfaces.mdx`
- **线上页面**：https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces
- **章节**：`Render the Weather Component`（约第 196–262 行）

原文示例的关键几行：

```tsx
import { useChat } from '@ai-sdk/react';

const { messages, sendMessage } = useChat();   // ← 没有带工具类型

// ...

if (part.type === 'tool-displayWeather') {
  switch (part.state) {
    case 'output-available':
      return (
        <div key={index}>
          <Weather {...part.output} />         {/* ← part.output 被推断为 unknown */}
        </div>
      );
  }
}
```

**问题**：`useChat()` 不传泛型时，消息类型是默认的 `UIMessage`，工具 part 只知道「是某个工具」，不知道是哪个，于是 `part.output` 是 `unknown`。把 `unknown` 展开成组件 props，在 **strict 模式**（`create-next-app` 的默认 `tsconfig`）下直接编译失败。

这不是 SDK 的运行时 bug，是**文档示例的可复制性问题**：照抄官方示例 → 项目 `next build` / `tsc` 报错。

---

## 二、复现步骤

1. 建一个新项目（默认 `strict: true`）：

   ```bash
   pnpm create next-app@latest repro --typescript --tailwind --eslint --app --import-alias "@/*" --use-pnpm
   ```

2. 按文档补齐三个文件：`lib/tools.ts`（weatherTool）、`components/weather.tsx`、`app/page.tsx`（上面的示例）。

3. 跑类型检查：

   ```bash
   npx tsc --noEmit
   ```

   预期报错：

   ```
   error TS2698: Spread types may only be created from object types.
   error TS2739: Type '{ key: number; }' is missing the following properties
                  from type 'WeatherProps': temperature, weather, location
   ```

### 本地最小复现记录（2026-09-28，ai@7.0.107 + react 19 + strict）

在临时工程里用真实依赖跑过：

```
修之前:  repro.tsx(18,51): error TS2698: Spread types may only be created from object types.
         repro.tsx(18,27): error TS2739: Type '{ key: number; }' is missing ... from type 'WeatherProps'
加类型后: 0 错误
```

> 注：本地行号与线上示例不同很正常（示例文件更长），报错码与原因一致。

---

## 三、怎么修

### 方案 A（推荐）：给示例带上工具类型

在 `app/page.tsx` 里从工具定义推导消息类型，再传给 `useChat`：

```tsx
import { useChat } from '@ai-sdk/react';
import { tools } from '@/lib/tools';
import type { InferUITools, UIMessage } from 'ai';

// 用工具定义推导消息类型，tool part 的 input / output 才有类型
type MyUIMessage = UIMessage<unknown, never, InferUITools<typeof tools>>;

export default function Page() {
  const { messages, sendMessage } = useChat<MyUIMessage>();
  // ...
}
```

同时把 md 里的 `highlight` 属性一起改（现在标了 `4,9,14-15,19-46`，加两行 import 后要重算）。

这个写法是官方自己的推荐：`UIMessage` 参考页里就是 `type MyTools = InferUITools<typeof tools>` + `UIMessage<MyMetadata, MyDataPart, MyTools>`（见 `/docs/reference/ai-sdk-core/ui-message`）。

### 方案 B（最小 diff）：只加一段提示

不改示例代码，只在示例下方加一句：

> 若你的项目启用了 `strict`（`create-next-app` 默认），需要给 `useChat` 带上工具类型，否则 `part.output` 是 `unknown`：
> `type MyUIMessage = UIMessage<unknown, never, InferUITools<typeof tools>>` → `useChat<MyUIMessage>()`
> 参见 `UIMessage` 与 `InferUITools` 参考页。

**建议**：A 为主，B 可作补充（一行说明 + 链接），两者不冲突。

---

## 四、提交前的检查（都做过）

- **是否已有人提过**：搜过 upstream issue/PR 的 `part.output`、`Spread types may only be created`、`generative user interfaces type`、`InferUITools docs` —— **没有同类**，不会重复。
- **影响面**：同一页的 `### Adding More Tools` 小节（约第 279 行起）还有两处同样的写法 —— `Weather {...part.output}`（约 361 行）和 `Stock {...part.output}`（约 378 行），改的时候**一并检查**是否需要同样处理。

---

## 五、提交流程

1. fork `vercel/ai`，建分支：

   ```bash
   git checkout -b docs/generative-ui-tool-part-types
   ```

2. 只改 `content/docs/04-ai-sdk-ui/04-generative-user-interfaces.mdx`（一个文件，保持 diff 小）。

3. 环境要求（见 CONTRIBUTING）：

   - pnpm **v11**、Node **22.13 / 24 / 26**
   - `pnpm install`（会装 husky；提交时自动跑 prettier）
   - 若 prettier 报格式问题：`pnpm prettier --write content/docs/04-ai-sdk-ui/04-generative-user-interfaces.mdx`

4. **docs 改动不需要 changeset**（原文：You don't need to create changesets for docs or any of the `examples/*` packages）。

5. Push 并开 PR，描述用下面模板。

---

## 六、PR 描述模板（英文，可直接用）

```markdown
### What changed

Type the `useChat` call in the "Render the Weather Component" example so that
`part.output` is no longer `unknown`.

### Why

Copying the example into a project created by `create-next-app` (which enables
`strict` in tsconfig) fails to typecheck:

    error TS2698: Spread types may only be created from object types.
    error TS2739: Type '{ key: number; }' is missing the following properties
                   from type 'WeatherProps': temperature, weather, location

Repro: create a Next.js app, add the `weatherTool` / `Weather` component / page
code from this page, then run `npx tsc --noEmit`.

### Fix

Derive the message type from the tool set and pass it to `useChat`, matching the
pattern already documented on the `UIMessage` reference page:

    type MyUIMessage = UIMessage<unknown, never, InferUITools<typeof tools>>;
    const { messages, sendMessage } = useChat<MyUIMessage>();

Also updated the `highlight` prop to account for the new import lines.

Docs-only change, so no changeset is included.
```

---

## 七、参考

- 文档源文件：`content/docs/04-ai-sdk-ui/04-generative-user-interfaces.mdx`
- 官方写法出处：`/docs/reference/ai-sdk-core/ui-message`（含 `InferUITools` 示例）、`/docs/reference/ai-sdk-ui/infer-ui-tools`
- 贡献规范：`vercel/ai` 的 `CONTRIBUTING.md`（docs 不需要 changeset；pnpm v11 / Node 22.13+；小改直接 PR）
- 本仓库对照实现：`lab-ai-sdk` 第 5 课 —— `lib/tools.ts` 末尾导出 `ChatTools = InferUITools<typeof tools>`，`app/page.tsx` 用 `useChat<ChatMessage>`（同方案 A，已通过 `tsc` 验证）
