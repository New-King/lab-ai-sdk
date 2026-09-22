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
  code?: string;
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
    ],
    files: [
      {
        path: "终端",
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
      "generateText — 非流式生成文本，等模型出完整结果后再使用",
      "deepSeek — DeepSeek 的模型提供方，用 deepSeek('deepseek-flash') 指定模型",
    ],
    docLinks: [
      {
        title: "generateText",
        href: "https://ai-sdk.dev/docs/ai-sdk-core/generating-text",
      },
      {
        title: "generateText 参考",
        href: "https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text",
      },
      {
        title: "Providers 与模型",
        href: "https://ai-sdk.dev/docs/foundations/providers-and-models",
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
                if (event.nativeEvent.isComposing) return;
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
      "streamText — 流式生成文本，返回结果对象，result.stream 是逐块事件流",
      "toUIMessageStream — 把生成结果转成 UI 消息流，供前端 Hook 消费",
      "createUIMessageStreamResponse — 把 UI 消息流包成 HTTP 响应返回浏览器",
      "useCompletion — 文本补全 Hook：发请求、边收边渲染回复、管理加载与错误",
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
                if (event.nativeEvent.isComposing) return;
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
    summary: "标准聊天界面 + useChat；消息存服务端（.chats/），刷新后从 API 加载。",
    concepts: [
      "useChat — 聊天 Hook：维护多轮消息、发送消息、流式渲染回复、支持中止",
      "DefaultChatTransport — useChat 的传输层，指定请求地址并随请求带上会话标识",
      "convertToModelMessages — 把 UI 消息转成模型能接收的 messages",
      "toUIMessageStream — 转 UI 消息流，用 originalMessages 与 onEnd 在流结束时拿到完整消息",
    ],
    docLinks: [
      { title: "useChat", href: "https://ai-sdk.dev/docs/ai-sdk-ui/chatbot" },
      {
        title: "Chatbot Message Persistence",
        href: "https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence",
      },
      {
        title: "createUIMessageStream",
        href: "https://ai-sdk.dev/docs/reference/ai-sdk-ui/create-ui-message-stream",
      },
      {
        title: "convertToModelMessages",
        href: "https://ai-sdk.dev/docs/reference/ai-sdk-ui/convert-to-model-messages",
      },
      {
        title: "DeepSeek Provider",
        href: "https://ai-sdk.dev/providers/ai-sdk-providers/deepseek",
      },
    ],
    files: [
      {
        path: "lib/chat-store.ts",
        order: 1,
        action: "create",
        hint: "文件版 chat store（官方 persistence 示例同款思路）",
        code: `import { type UIMessage } from "ai";
import { existsSync, mkdirSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const chatIdRegex = /^[A-Za-z0-9_-]+$/;

function getChatFile(id: string): string {
  if (!chatIdRegex.test(id)) {
    throw new Error("Invalid chat ID");
  }
  const chatDir = path.resolve(process.cwd(), ".chats");
  const chatFile = path.resolve(chatDir, \`\${id}.json\`);
  if (!chatFile.startsWith(\`\${chatDir}\${path.sep}\`)) {
    throw new Error("Invalid chat ID");
  }
  if (!existsSync(chatDir)) mkdirSync(chatDir, { recursive: true });
  return chatFile;
}

export async function loadChat(id: string): Promise<UIMessage[]> {
  const file = getChatFile(id);
  if (!existsSync(file)) return [];
  return JSON.parse(await readFile(file, "utf8"));
}

export async function saveChat({
  chatId,
  messages,
}: {
  chatId: string;
  messages: UIMessage[];
}): Promise<void> {
  await writeFile(getChatFile(chatId), JSON.stringify(messages, null, 2));
}`,
      },
      {
        path: "app/api/generate/route.ts",
        order: 2,
        action: "replace",
        hint: "GET 加载 + POST stream + onEnd saveChat",
        code: `import { loadChat, saveChat } from "@/lib/chat-store";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { deepSeek } from "@ai-sdk/deepseek";

export const maxDuration = 30;

export async function GET(req: Request) {
  const chatId = new URL(req.url).searchParams.get("chatId") ?? "default";
  try {
    const messages = await loadChat(chatId);
    return Response.json({ messages });
  } catch {
    return Response.json({ messages: [] });
  }
}

export async function POST(req: Request) {
  if (!process.env.DEEPSEEK_API_KEY) {
    return Response.json({ error: "请先完成初始化" }, { status: 503 });
  }

  const {
    messages,
    chatId = "default",
  }: { messages: UIMessage[]; chatId?: string } = await req.json();

  const result = streamText({
    model: deepSeek("deepseek-flash"),
    messages: await convertToModelMessages(messages),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      onEnd: ({ messages: finalMessages }) => {
        void saveChat({ chatId, messages: finalMessages });
      },
    }),
  });
}`,
      },
      {
        path: "app/page.tsx",
        order: 3,
        action: "replace",
        hint: "useChat + chatId + 挂载时 GET 恢复",
        code: `"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useState } from "react";

const CHAT_ID = "default";

export default function Home() {
  const { messages, setMessages, sendMessage, status, stop, error } = useChat({
    id: CHAT_ID,
    transport: new DefaultChatTransport({
      api: "/api/generate",
      body: { chatId: CHAT_ID },
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
    fetch(\`/api/generate?chatId=\${CHAT_ID}\`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch(() => {});
  }, [setMessages]);

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8 font-sans">
      <main className="flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-4">
        <header className="shrink-0 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">多轮对话</h1>
          <p className="text-sm text-zinc-500">
            连续聊天；消息保存在服务端 .chats/，刷新后自动恢复。
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
                if (event.nativeEvent.isComposing) return;
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
      "综合实战：tool 调用 + message.parts 渲染 React 组件（天气卡片），延续服务端持久化。",
    concepts: [
      "tool — 定义模型可调用的工具：description 说明用途、inputSchema 约束参数、execute 返回结果",
      "isStepCount — 停止条件，配合 streamText 的 stopWhen 限制工具循环的步数",
      "useChat — 通过消息的 parts 渲染 tool-<toolName> 类型的工具调用与结果",
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
      {
        title: "tool()",
        href: "https://ai-sdk.dev/docs/reference/ai-sdk-core/tool",
      },
      {
        title: "isStepCount",
        href: "https://ai-sdk.dev/docs/reference/ai-sdk-core/is-step-count",
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
        hint: "tools + onEnd saveChat（保留 GET）",
        code: `import { loadChat, saveChat } from "@/lib/chat-store";
import {
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

export async function GET(req: Request) {
  const chatId = new URL(req.url).searchParams.get("chatId") ?? "default";
  try {
    const messages = await loadChat(chatId);
    return Response.json({ messages });
  } catch {
    return Response.json({ messages: [] });
  }
}

export async function POST(req: Request) {
  if (!process.env.DEEPSEEK_API_KEY) {
    return Response.json({ error: "请先完成初始化" }, { status: 503 });
  }

  const {
    messages,
    chatId = "default",
  }: { messages: UIMessage[]; chatId?: string } = await req.json();

  const result = streamText({
    model: deepSeek("deepseek-flash"),
    instructions:
      "You are a friendly assistant. When the user asks about weather, call displayWeather.",
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: isStepCount(5),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      onEnd: ({ messages: finalMessages }) => {
        void saveChat({ chatId, messages: finalMessages });
      },
    }),
  });
}`,
      },
      {
        path: "app/page.tsx",
        order: 4,
        action: "replace",
        hint: "渲染 tool-displayWeather + 服务端持久化",
        code: `"use client";

import { Weather } from "@/components/weather";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useState } from "react";

const CHAT_ID = "default";

export default function Home() {
  const { messages, setMessages, sendMessage, status, stop, error } = useChat({
    id: CHAT_ID,
    transport: new DefaultChatTransport({
      api: "/api/generate",
      body: { chatId: CHAT_ID },
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
    fetch(\`/api/generate?chatId=\${CHAT_ID}\`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch(() => {});
  }, [setMessages]);

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
                if (event.nativeEvent.isComposing) return;
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
