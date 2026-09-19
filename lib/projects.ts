import type { DocLink } from "@/lib/doc-link";

export type CommandStep = {
  description: string;
  command: string;
  /** 交互式 create-next-app 时的推荐选项 */
  choices?: string[];
};

export type FileAction = "create" | "replace";

export type ProjectFile = {
  path: string;
  code: string;
  hint?: string;
  steps?: CommandStep[];
  /** 项目课：跟做顺序 */
  order?: number;
  /** 项目课：新建或覆盖已有文件 */
  action?: FileAction;
};

export type FollowStep = {
  description: string;
  command: string;
};

export type LabOperation =
  | {
      kind: "scaffold";
      id: "scaffold";
      order: number;
      label: string;
      description: string;
      command: string;
    }
  | {
      kind: "file";
      id: string;
      order: number;
      label: string;
      file: ProjectFile;
    };

/** 生成 mkdir + touch 脚手架命令 */
export function buildScaffoldCommand(files: ProjectFile[]): string | null {
  const sorted = [...files]
    .filter((file) => file.order != null && file.action != null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (sorted.length === 0) return null;

  const dirs = new Set<string>();
  const paths: string[] = [];

  for (const file of sorted) {
    paths.push(file.path);
    if (file.action === "create") {
      const slash = file.path.lastIndexOf("/");
      if (slash > 0) dirs.add(file.path.slice(0, slash));
    }
  }

  const parts: string[] = [];
  if (dirs.size > 0) {
    parts.push(`mkdir -p ${[...dirs].sort().join(" ")}`);
  }
  parts.push(`touch ${paths.join(" ")}`);
  return parts.join(" && ");
}

/** 操作列表：创建文件 → 逐文件粘贴代码 */
export function getLabOperations(files: ProjectFile[]): LabOperation[] {
  const sorted = [...files]
    .filter((file) => file.order != null && file.action != null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const operations: LabOperation[] = [];
  let order = 1;

  const command = buildScaffoldCommand(sorted);
  if (command) {
    operations.push({
      kind: "scaffold",
      id: "scaffold",
      order: order++,
      label: "创建文件",
      description: `在 ${PROJECT_DIR} 目录执行，创建文件夹和空文件。`,
      command,
    });
  }

  for (const file of sorted) {
    operations.push({
      kind: "file",
      id: file.path,
      order: order++,
      label: getFileName(file.path),
      file,
    });
  }

  return operations;
}

export type GuideProject = {
  kind: "guide";
  slug: string;
  title: string;
  files: ProjectFile[];
  docLinks: DocLink[];
};

export type LabProject = {
  kind: "project";
  slug: string;
  title: string;
  summary: string;
  /** 跟做前的前置条件 */
  prerequisite?: string;
  concepts: string[];
  files: ProjectFile[];
  docLinks: DocLink[];
};

const ORDER_LABELS = ["①", "②", "③", "④", "⑤", "⑥"] as const;

export function getOrderLabel(order: number) {
  return ORDER_LABELS[order - 1] ?? String(order);
}

export function getFileActionLabel(action: FileAction) {
  return action === "replace" ? "覆盖" : "新建";
}

export function getFileName(path: string) {
  return path.split("/").pop() ?? path;
}

export type NavItem = GuideProject | LabProject;

export const PROJECT_DIR = "my-ai-app";

export const INIT_STEPS: CommandStep[] = [
  {
    description:
      "创建 Next.js 项目。推荐直接用下面这条带参数的命令，跳过交互提问；若仍出现选项，按下方对照选。",
    command: `pnpm create next-app@latest ${PROJECT_DIR} --typescript --tailwind --eslint --app --import-alias "@/*" --use-pnpm --yes`,
    choices: [
      "TypeScript → Yes",
      "ESLint → Yes",
      "Tailwind CSS → Yes",
      "App Router → Yes",
      "src/ directory → No",
      "Turbopack → 随意（Yes / No 均可）",
    ],
  },
  {
    description: "进入刚创建的项目目录。",
    command: `cd ${PROJECT_DIR}`,
  },
  {
    description: "安装本教程用到的 AI SDK 与 DeepSeek Provider。",
    command: "pnpm add ai @ai-sdk/react @ai-sdk/deepseek zod",
  },
  {
    description: "启动开发服务器，浏览器打开 localhost:3000。",
    command: "pnpm dev",
  },
];

export const INIT_COMMANDS = INIT_STEPS.map((step) => step.command).join("\n");

export const NAV_ITEMS: NavItem[] = [
  {
    kind: "guide",
    slug: "getting-started",
    title: "初始化",
    docLinks: [
      {
        title: "create-next-app",
        href: "https://nextjs.org/docs/app/api-reference/cli/create-next-app",
      },
      { title: "Next.js App Router", href: "https://nextjs.org/docs/app" },
      {
        title: "DeepSeek Provider",
        href: "https://ai-sdk.dev/providers/ai-sdk-providers/deepseek",
      },
      {
        title: "Providers 与模型",
        href: "https://ai-sdk.dev/docs/foundations/providers-and-models",
      },
    ],
    files: [
      {
        path: "终端",
        code: INIT_COMMANDS,
        steps: INIT_STEPS,
      },
      {
        path: ".env.local",
        hint: "新建 .env.local，填入 DEEPSEEK_API_KEY",
        code: `DEEPSEEK_API_KEY=sk-...`,
      },
    ],
  },
  {
    kind: "project",
    slug: "single-turn",
    title: "单轮问答",
    summary: "先跑通最小闭环：发一个问题，等服务端一次性返回完整文本。",
    concepts: [
      "generateText — Core 层非流式文本生成",
      "Route Handler — app/api/.../route.ts 暴露 POST 接口",
      "fetch — 非流式 UI 无官方 Hook，客户端自己接 HTTP（下一课起用 @ai-sdk/react）",
    ],
    prerequisite: "确认 my-ai-app 里 .env.local 已配置 DEEPSEEK_API_KEY。",
    docLinks: [
      {
        title: "generateText",
        href: "https://ai-sdk.dev/docs/ai-sdk-core/generating-text",
      },
      {
        title: "Next.js Route Handlers",
        href: "https://nextjs.org/docs/app/building-your-application/routing/route-handlers",
      },
      {
        title: "DeepSeek Provider",
        href: "https://ai-sdk.dev/providers/ai-sdk-providers/deepseek",
      },
    ],
    files: [
      {
        path: "app/api/generate-text/route.ts",
        order: 1,
        action: "create",
        hint: "POST 接口 + DeepSeek",
        code: `import { generateText } from "ai";
import { deepSeek } from "@ai-sdk/deepseek";

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const { text } = await generateText({
    model: deepSeek("deepseek-flash"),
    prompt,
  });
  return Response.json({ text });
}`,
      },
      {
        path: "app/page.tsx",
        order: 2,
        action: "replace",
        hint: "首页表单 + 展示结果",
        code: `"use client";

import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("用一句话介绍你自己");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      setText(data.text ?? "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12 font-sans">
      <main className="w-full max-w-4xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">单轮问答</h1>
          <p className="text-sm text-zinc-500">
            输入问题，等服务端一次性返回完整回复。
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm font-medium">
            问题
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </label>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "生成中…" : "发送"}
          </button>
        </form>

        {text && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-zinc-500">回复</h2>
            <p className="whitespace-pre-wrap text-sm leading-7">{text}</p>
          </section>
        )}
      </main>
    </div>
  );
}`,
      },
    ],
  },
  {
    kind: "project",
    slug: "stream",
    title: "流式回复",
    summary: "把等待改成「边生成边显示」：服务端 streamText，客户端 useCompletion 消费流。",
    concepts: [
      "streamText — token 级流式输出",
      "createUIMessageStreamResponse + toUIMessageStream — UI 消息流，useCompletion 默认协议",
      "createTextStreamResponse + toTextStream — 纯文本流，客户端需 streamProtocol: 'text'",
      "useCompletion — @ai-sdk/react 内置 hook，边收边渲染",
    ],
    prerequisite: "确认已完成「单轮问答」。",
    docLinks: [
      {
        title: "streamText",
        href: "https://ai-sdk.dev/docs/ai-sdk-core/generating-text#streamtext",
      },
      {
        title: "useCompletion",
        href: "https://ai-sdk.dev/docs/ai-sdk-ui/completion",
      },
      {
        title: "Stream Protocols",
        href: "https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol",
      },
      {
        title: "createUIMessageStreamResponse",
        href: "https://ai-sdk.dev/docs/reference/ai-sdk-ui/create-ui-message-stream-response",
      },
      {
        title: "Text Stream（createTextStreamResponse）",
        href: "https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol#text-stream-protocol",
      },
      {
        title: "DeepSeek Provider",
        href: "https://ai-sdk.dev/providers/ai-sdk-providers/deepseek",
      },
    ],
    files: [
      {
        path: "app/api/completion/route.ts",
        order: 1,
        action: "create",
        hint: "streamText + createUIMessageStreamResponse",
        code: `import {
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from "ai";
import { deepSeek } from "@ai-sdk/deepseek";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamText({
    model: deepSeek("deepseek-flash"),
    prompt,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}`,
      },
      {
        path: "app/page.tsx",
        order: 2,
        action: "replace",
        hint: "useCompletion 消费流式回复",
        code: `"use client";

import { useCompletion } from "@ai-sdk/react";
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("用三句话介绍 TypeScript");
  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/completion",
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || isLoading) return;
    await complete(prompt.trim());
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12 font-sans">
      <main className="w-full max-w-4xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">流式回复</h1>
          <p className="text-sm text-zinc-500">
            发送后 token 逐步返回，useCompletion 自动更新 completion。
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm font-medium">
            问题
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </label>

          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isLoading ? "生成中…" : "发送"}
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-600">出错了，请重试。</p>
        )}

        {completion && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-zinc-500">回复</h2>
            <p className="whitespace-pre-wrap text-sm leading-7">{completion}</p>
          </section>
        )}
      </main>
    </div>
  );
}`,
      },
    ],
  },
  {
    kind: "project",
    slug: "multi-turn",
    title: "多轮对话",
    summary: "消息列表 + 上下文，搭出可用的聊天机器人页面。",
    concepts: [
      "useChat — 多轮消息状态与发送",
      "convertToModelMessages — UIMessage 转模型消息",
      "toUIMessageStreamResponse — 流式 UI 消息协议",
    ],
    prerequisite: "确认已完成「流式回复」。",
    docLinks: [
      { title: "useChat", href: "https://ai-sdk.dev/docs/ai-sdk-ui/chatbot" },
      {
        title: "streamText",
        href: "https://ai-sdk.dev/docs/ai-sdk-core/generating-text#streamtext",
      },
      {
        title: "convertToModelMessages",
        href: "https://ai-sdk.dev/docs/reference/ai-sdk-core/convert-to-model-messages",
      },
    ],
    files: [
      {
        path: "app/api/chat/route.ts",
        order: 1,
        action: "create",
        hint: "多轮 chat 接口",
        code: `import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { deepSeek } from "@ai-sdk/deepseek";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: deepSeek("deepseek-flash"),
    messages: await convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}`,
      },
      {
        path: "components/chat-panel.tsx",
        order: 2,
        action: "create",
        hint: "useChat 组件",
        code: `"use client";

import { useChat } from "@ai-sdk/react";

export function ChatPanel() {
  const { messages, sendMessage, status } = useChat();
  const loading = status === "streaming" || status === "submitted";

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>{m.role}: {/* 渲染 parts */}</div>
      ))}
      <button
        disabled={loading}
        onClick={() => sendMessage({ text: "你好" })}
      >
        发送
      </button>
    </div>
  );
}`,
      },
    ],
  },
];

export function getNavItem(slug: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.slug === slug);
}

export const LAB_PROJECTS = NAV_ITEMS.filter(
  (item): item is LabProject => item.kind === "project",
);
