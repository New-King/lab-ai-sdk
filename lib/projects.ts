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

/** 生成 mkdir + touch 脚手架命令（仅包含 action: create 的文件） */
export function buildScaffoldCommand(files: ProjectFile[]): string | null {
  const sorted = [...files]
    .filter((file) => file.order != null && file.action != null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const createFiles = sorted.filter((file) => file.action === "create");
  if (createFiles.length === 0) return null;

  const dirs = new Set<string>();
  const paths: string[] = [];

  for (const file of createFiles) {
    paths.push(file.path);
    const slash = file.path.lastIndexOf("/");
    if (slash > 0) dirs.add(file.path.slice(0, slash));
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
      description: `在 ${PROJECT_DIR} 目录执行，创建本课需要新建的文件夹和空文件。`,
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
        hint: "打开 .env.local，填入 DEEPSEEK_API_KEY：",
        steps: [
          {
            description: `先进入 ${PROJECT_DIR} 项目目录，再创建 .env.local。`,
            command: "touch .env.local",
          },
        ],
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
      "Route Handler — app/api/generate/route.ts，后续课在同文件上覆盖演进",
      "fetch — 非流式 UI 无官方 Hook，客户端自己接 HTTP（下一课起用 @ai-sdk/react）",
    ],
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
        path: "app/api/generate/route.ts",
        order: 1,
        action: "create",
        hint: "POST 接口 + DeepSeek（后续课覆盖此文件，不换路径）",
        code: `import { generateText } from "ai";
import { deepSeek } from "@ai-sdk/deepseek";

export async function POST(req: Request) {
  if (!process.env.DEEPSEEK_API_KEY) {
    return Response.json({ error: "请先完成初始化" }, { status: 503 });
  }

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
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "出错了，请重试");
        setText("");
        return;
      }
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
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
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

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

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
      "complete(prompt) — 提交 prompt 并启动流式请求；await 等本次流结束",
      "completion — 已收到的回复文本（string），流式过程中逐字变长",
    ],
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
        path: "app/api/generate/route.ts",
        order: 1,
        action: "replace",
        hint: "streamText + createUIMessageStreamResponse",
        code: `import {
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from "ai";
import { deepSeek } from "@ai-sdk/deepseek";

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.DEEPSEEK_API_KEY) {
    return Response.json({ error: "请先完成初始化" }, { status: 503 });
  }

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
    api: "/api/generate",
    fetch: async (input, init) => {
      const res = await fetch(input, init);
      if (res.status === 503) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string" ? data.error : "请先完成初始化",
        );
      }
      return res;
    },
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
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
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
          <p className="text-sm text-red-600">{error.message}</p>
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
    summary: "标准聊天界面：消息列表 + useChat；刷新后 messages 仍保留（localStorage）。",
    concepts: [
      "useChat + DefaultChatTransport — 多轮消息状态、发送与流式渲染",
      "message.parts — 按 part 渲染 assistant 流式文本",
      "convertToModelMessages — 把 UI messages 转成模型 messages",
      "createUIMessageStreamResponse + toUIMessageStream — 与 useChat 配对的 UI 消息流",
      "localStorage — 把 messages 序列化存本地，刷新后 setMessages 恢复",
    ],
    docLinks: [
      { title: "Chatbot（useChat）", href: "https://ai-sdk.dev/docs/ai-sdk-ui/chatbot" },
      {
        title: "Chatbot Message Persistence",
        href: "https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence",
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
        title: "convertToModelMessages",
        href: "https://ai-sdk.dev/docs/reference/ai-sdk-core/convert-to-model-messages",
      },
      {
        title: "DeepSeek Provider",
        href: "https://ai-sdk.dev/providers/ai-sdk-providers/deepseek",
      },
    ],
    files: [
      {
        path: "app/api/generate/route.ts",
        order: 1,
        action: "replace",
        hint: "streamText + convertToModelMessages",
        code: `import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { deepSeek } from "@ai-sdk/deepseek";

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.DEEPSEEK_API_KEY) {
    return Response.json({ error: "请先完成初始化" }, { status: 503 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: deepSeek("deepseek-flash"),
    messages: await convertToModelMessages(messages),
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
        hint: "聊天 UI + useChat + localStorage 持久化",
        code: `"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useState } from "react";

const STORAGE_KEY = "my-ai-app-messages";

export default function Home() {
  const { messages, setMessages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/generate",
      fetch: async (input, init) => {
        const res = await fetch(input, init);
        if (res.status === 503) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            typeof data.error === "string" ? data.error : "请先完成初始化",
          );
        }
        return res;
      },
    }),
  });
  const [input, setInput] = useState("");
  const loading = status === "streaming" || status === "submitted";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch {
      // ignore invalid stored data
    }
  }, [setMessages]);

  useEffect(() => {
    if (messages.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8 font-sans">
      <main className="flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-4">
        <header className="shrink-0 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">多轮对话</h1>
          <p className="text-sm text-zinc-500">
            连续聊天，刷新页面后仍保留记录（localStorage）。
          </p>
        </header>

        <div className="min-h-[240px] flex-1 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-zinc-400">发送第一条消息开始对话</p>
          ) : (
            <ul className="space-y-4">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={
                    message.role === "user" ? "flex justify-end" : "flex justify-start"
                  }
                >
                  <div
                    className={
                      message.role === "user"
                        ? "max-w-[85%] rounded-lg bg-zinc-900 px-3 py-2 text-sm leading-6 text-white"
                        : "max-w-[85%] rounded-lg bg-zinc-100 px-3 py-2 text-sm leading-6 text-zinc-900"
                    }
                  >
                    {message.parts.map((part, index) =>
                      part.type === "text" ? (
                        <span key={index} className="whitespace-pre-wrap">
                          {part.text}
                        </span>
                      ) : null,
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <p className="shrink-0 text-sm text-red-600">{error.message}</p>
        )}

        <form
          className="shrink-0 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!input.trim() || loading) return;
            sendMessage({ text: input.trim() });
            setInput("");
          }}
        >
          <label className="block text-sm font-medium">
            消息
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={2}
              placeholder="输入消息…"
              className="mt-1 w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "回复中…" : "发送"}
            </button>
            {loading && (
              <button
                type="button"
                onClick={() => stop()}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                停止
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}`,
      },
    ],
  },
  {
    kind: "project",
    slug: "generative-ui",
    title: "生成式 UI",
    summary:
      "综合实战：tool 调用 + message.parts 渲染 React 组件（天气卡片），延续多轮聊天与 localStorage。",
    concepts: [
      "tool() + inputSchema — 定义模型可调用的工具（zod 约束参数）",
      "streamText({ tools, stopWhen }) — 服务端执行 tool 并把结果流回客户端",
      "tool-${name} parts — useChat 消息里按 state 渲染 loading / 组件 / 错误",
      "Generative UI — tool 结果交给 React 组件，而不只是文本",
    ],
    docLinks: [
      {
        title: "Generative User Interfaces",
        href: "https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces",
      },
      {
        title: "Chatbot Tool Usage",
        href: "https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage",
      },
      { title: "Tool Calling（Core）", href: "https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling" },
      {
        title: "Chatbot Message Persistence",
        href: "https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence",
      },
      {
        title: "DeepSeek Provider",
        href: "https://ai-sdk.dev/providers/ai-sdk-providers/deepseek",
      },
    ],
    files: [
      {
        path: "lib/tools.ts",
        order: 1,
        action: "create",
        hint: "weather tool + tools 导出",
        code: `import { tool } from "ai";
import { z } from "zod";

export const weatherTool = tool({
  description: "Display the weather for a location",
  inputSchema: z.object({
    location: z.string().describe("The location to get the weather for"),
  }),
  execute: async ({ location }) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { weather: "Sunny", temperature: 22, location };
  },
});

export const tools = {
  displayWeather: weatherTool,
};`,
      },
      {
        path: "components/weather.tsx",
        order: 2,
        action: "create",
        hint: "tool 结果对应的 UI 组件",
        code: `type WeatherProps = {
  temperature: number;
  weather: string;
  location: string;
};

export function Weather({ temperature, weather, location }: WeatherProps) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm">
      <p className="font-medium">{location}</p>
      <p className="text-zinc-600">
        {weather} · {temperature}°C
      </p>
    </div>
  );
}`,
      },
      {
        path: "app/api/generate/route.ts",
        order: 3,
        action: "replace",
        hint: "streamText + tools + isStepCount",
        code: `import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { deepSeek } from "@ai-sdk/deepseek";
import { tools } from "@/lib/tools";

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.DEEPSEEK_API_KEY) {
    return Response.json({ error: "请先完成初始化" }, { status: 503 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: deepSeek("deepseek-flash"),
    system:
      "You are a friendly assistant. When the user asks about weather, call displayWeather.",
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: isStepCount(5),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}`,
      },
      {
        path: "app/page.tsx",
        order: 4,
        action: "replace",
        hint: "渲染 tool-displayWeather + 持久化",
        code: `"use client";

import { Weather } from "@/components/weather";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useState } from "react";

const STORAGE_KEY = "my-ai-app-messages";

export default function Home() {
  const { messages, setMessages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/generate",
      fetch: async (input, init) => {
        const res = await fetch(input, init);
        if (res.status === 503) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            typeof data.error === "string" ? data.error : "请先完成初始化",
          );
        }
        return res;
      },
    }),
  });
  const [input, setInput] = useState("");
  const loading = status === "streaming" || status === "submitted";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch {
      // ignore invalid stored data
    }
  }, [setMessages]);

  useEffect(() => {
    if (messages.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8 font-sans">
      <main className="flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-4">
        <header className="shrink-0 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">生成式 UI</h1>
          <p className="text-sm text-zinc-500">
            问「旧金山天气怎么样」— 模型调 tool，回复里出现天气卡片而不只是文字。
          </p>
        </header>

        <div className="min-h-[240px] flex-1 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-zinc-400">发送第一条消息开始对话</p>
          ) : (
            <ul className="space-y-4">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={
                    message.role === "user" ? "flex justify-end" : "flex justify-start"
                  }
                >
                  <div
                    className={
                      message.role === "user"
                        ? "max-w-[85%] rounded-lg bg-zinc-900 px-3 py-2 text-sm leading-6 text-white"
                        : "max-w-[85%] space-y-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm leading-6 text-zinc-900"
                    }
                  >
                    {message.parts.map((part, index) => {
                      if (part.type === "text") {
                        return (
                          <span key={index} className="whitespace-pre-wrap">
                            {part.text}
                          </span>
                        );
                      }

                      if (part.type === "tool-displayWeather") {
                        switch (part.state) {
                          case "input-available":
                            return (
                              <p key={index} className="text-sm text-zinc-500">
                                正在查询天气…
                              </p>
                            );
                          case "output-available":
                            return (
                              <div key={index}>
                                <Weather {...part.output} />
                              </div>
                            );
                          case "output-error":
                            return (
                              <p key={index} className="text-sm text-red-600">
                                {part.errorText}
                              </p>
                            );
                          default:
                            return null;
                        }
                      }

                      return null;
                    })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <p className="shrink-0 text-sm text-red-600">{error.message}</p>
        )}

        <form
          className="shrink-0 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!input.trim() || loading) return;
            sendMessage({ text: input.trim() });
            setInput("");
          }}
        >
          <label className="block text-sm font-medium">
            消息
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={2}
              placeholder="例如：旧金山天气怎么样？"
              className="mt-1 w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "回复中…" : "发送"}
            </button>
            {loading && (
              <button
                type="button"
                onClick={() => stop()}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                停止
              </button>
            )}
          </div>
        </form>
      </main>
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
