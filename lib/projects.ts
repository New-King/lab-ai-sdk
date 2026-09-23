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
      "needsApproval — 工具执行前先暂停，等用户批准（消息里出现 approval-requested 状态的 part）",
      "addToolApprovalResponse — useChat 返回的方法：批准或拒绝某个审批请求，然后继续生成",
      "lastAssistantMessageIsCompleteWithApprovalResponses — 审批响应齐全后自动接着生成",
      "isStepCount — 停止条件，配合 streamText 的 stopWhen 限制工具循环的步数",
      "useChat — 通过消息的 parts 渲染 tool-<toolName> 类型的工具调用与结果",
    ],
    docLinks: [
      {
        title: "Generative User Interfaces",
        href: "https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces",
      },
      {
        title: "tool()",
        href: "https://ai-sdk.dev/docs/reference/ai-sdk-core/tool",
      },
      {
        title: "Tool Approvals",
        href: "https://ai-sdk.dev/docs/agents/tool-approvals",
      },
      {
        title: "isStepCount",
        href: "https://ai-sdk.dev/docs/reference/ai-sdk-core/is-step-count",
      },
      {
        title: "useChat 参考",
        href: "https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat",
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

// 普通工具：模型一调用就执行，结果直接渲染成卡片
export const weatherTool = tool({
  description: "Display the weather for a location",
  // inputSchema 用 zod 描述参数，模型生成的参数会按这个结构校验
  inputSchema: z.object({
    location: z.string().describe("The location to get the weather for"),
  }),
  // execute 在服务端执行，返回值会变成消息 part 里的 output
  execute: async ({ location }) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { weather: "Sunny", temperature: 22, location };
  },
});

// 敏感工具：发送提醒是对外动作，所以要求用户先批准
export const weatherAlertTool = tool({
  description: "Send a weather alert to a user by email",
  inputSchema: z.object({
    email: z.string().describe("Recipient email address"),
    message: z.string().describe("Alert message to send"),
  }),
  // 加了 needsApproval 后，模型调用它时不会立刻执行：
  // 消息里先出现 state 为 approval-requested 的 part，等用户点批准
  needsApproval: true,
  execute: async ({ email, message }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { email, message, sentAt: new Date().toISOString() };
  },
});

// 这里的 key 就是前端看到的 part.type：displayWeather → tool-displayWeather
export const tools = {
  displayWeather: weatherTool,
  sendWeatherAlert: weatherAlertTool,
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

// 刷新页面时用 GET 把历史消息读回来
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
    // 系统提示（v7 里这个参数叫 instructions）：告诉模型什么时候该用工具
    instructions:
      "You are a friendly assistant. When the user asks about weather, call displayWeather. To send an alert, use sendWeatherAlert.",
    // UI 消息是 parts 结构，要先转成模型认识的 messages
    messages: await convertToModelMessages(messages),
    // 把工具交给模型，由它决定调不调、调几次
    tools,
    // 限制工具循环最多 5 步，避免模型反复调用停不下来
    stopWhen: isStepCount(5),
  });

  return createUIMessageStreamResponse({
    // toUIMessageStream 把生成结果转成 UI 消息流（工具调用也在里面），useChat 才能直接消费
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      // 流结束后拿到完整的 UIMessage[]，写入存储
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
        hint: "渲染 tool parts：天气卡片 + 工具审批按钮",
        code: `"use client";

import { Weather } from "@/components/weather";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { useEffect, useState } from "react";

const CHAT_ID = "default";

export default function Home() {
  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    error,
    // 审批用：批准 / 拒绝模型发起的工具调用
    addToolApprovalResponse,
  } = useChat({
    id: CHAT_ID,
    // 审批响应齐全后自动继续生成，不用再点一次发送
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
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

                      // 需要审批的工具：模型想调用，但要等用户点头才执行
                      // 每个状态直接显示状态名，方便看清这个工具调用的生命周期
                      if (part.type === "tool-sendWeatherAlert") {
                        switch (part.state) {
                          case "input-streaming":
                            return (
                              <p key={index} className="text-sm text-zinc-400">
                                input-streaming
                              </p>
                            );
                          case "input-available":
                            return (
                              <p key={index} className="text-sm text-zinc-400">
                                input-available
                              </p>
                            );
                          case "approval-requested":
                            return (
                              <div
                                key={index}
                                className="space-y-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2"
                              >
                                <p className="font-mono text-xs text-zinc-500">
                                  approval-requested
                                </p>
                                <p className="text-sm font-medium">
                                  需要你批准：发送天气提醒邮件
                                </p>
                                {/* 把模型打算传的参数摊开，用户才知道自己在批准什么 */}
                                <pre className="whitespace-pre-wrap text-xs text-zinc-600">
                                  {JSON.stringify(part.input, null, 2)}
                                </pre>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    className="rounded-md bg-zinc-900 px-3 py-1 text-sm text-white"
                                    onClick={() =>
                                      addToolApprovalResponse({
                                        id: part.approval.id,
                                        approved: true,
                                      })
                                    }
                                  >
                                    批准
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-md border border-zinc-300 px-3 py-1 text-sm"
                                    onClick={() =>
                                      addToolApprovalResponse({
                                        id: part.approval.id,
                                        approved: false,
                                      })
                                    }
                                  >
                                    拒绝
                                  </button>
                                </div>
                              </div>
                            );
                          case "approval-responded":
                            return (
                              <p key={index} className="text-sm text-zinc-500">
                                approval-responded ·{" "}
                                {part.approval.approved ? "已批准" : "已拒绝"}
                              </p>
                            );
                          case "output-available":
                            return (
                              <p key={index} className="text-sm text-zinc-600">
                                output-available · 提醒已发送
                              </p>
                            );
                          case "output-error":
                            return (
                              <p key={index} className="text-sm text-red-600">
                                output-error · {part.errorText}
                              </p>
                            );
                          default:
                            return null;
                        }
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
          {/* 示例按钮：点一下直接发送，不用自己打字 */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => sendMessage({ text: "旧金山天气怎么样？" })}
              className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
            >
              查天气
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                sendMessage({ text: "给 hi@example.com 发条天气提醒" })
              }
              className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
            >
              发提醒（需审批）
            </button>
          </div>

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
  {
    kind: "project",
    slug: "structured-output",
    title: "结构化输出",
    summary:
      "让模型返回对象而不是散文：服务端用 schema 约束输出，客户端 useObject 边收边渲染指标卡。",
    concepts: [
      "Output.object — 用 zod schema 约束模型输出的对象结构",
      "streamText — 配合 output 参数，按 schema 流式产出对象",
      "toTextStream — 把对象流转换成文本流",
      "createTextStreamResponse — 把文本流包成 HTTP 响应返回浏览器",
      "useObject — 结构化输出 Hook：object 边收边补全，配合 isLoading / error 渲染",
    ],
    docLinks: [
      {
        title: "Generating Structured Data",
        href: "https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data",
      },
      {
        title: "Object Generation",
        href: "https://ai-sdk.dev/docs/ai-sdk-ui/object-generation",
      },
      {
        title: "Output",
        href: "https://ai-sdk.dev/docs/reference/ai-sdk-core/output",
      },
      {
        title: "useObject",
        href: "https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-object",
      },
    ],
    files: [
      {
        path: "lib/dashboard.ts",
        order: 1,
        action: "create",
        hint: "服务端和客户端共用同一份 schema",
        code: `import { z } from "zod";

// schema 就是给模型的“表格”：字段名 + 类型，describe 里的说明会影响它的输出质量
export const dashboardSchema = z.object({
  title: z.string().describe("看板标题，例如 各渠道 GMV 对比"),
  metrics: z
    .array(
      z.object({
        label: z.string().describe("指标名，例如 天猫 GMV"),
        value: z.number().describe("指标数值"),
        unit: z.string().optional().describe("单位，例如 万元"),
        delta: z.number().optional().describe("同比变化百分比，可正可负"),
      }),
    )
    .describe("指标卡列表，3 到 4 个"),
  note: z.string().optional().describe("一句话结论"),
});

// 页面里也能复用这个类型
export type Dashboard = z.infer<typeof dashboardSchema>;`,
      },
      {
        path: "components/metric-card.tsx",
        order: 2,
        action: "create",
        hint: "一张指标卡",
        code: `type MetricCardProps = {
  label: string;
  value: number;
  unit?: string;
  delta?: number;
};

export function MetricCard({ label, value, unit, delta }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">
        {value}
        {unit ? <span className="ml-1 text-sm text-zinc-500">{unit}</span> : null}
      </p>
      {typeof delta === "number" && (
        <p
          className={
            delta >= 0 ? "text-xs text-emerald-600" : "text-xs text-red-600"
          }
        >
          {delta >= 0 ? "+" : ""}
          {delta}%
        </p>
      )}
    </div>
  );
}`,
      },
      {
        path: "app/api/generate/route.ts",
        order: 3,
        action: "replace",
        hint: "Output.object + 文本流响应",
        code: `import { dashboardSchema } from "@/lib/dashboard";
import { createTextStreamResponse, Output, streamText, toTextStream } from "ai";
import { deepSeek } from "@ai-sdk/deepseek";

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.DEEPSEEK_API_KEY) {
    return Response.json({ error: "请先完成初始化" }, { status: 503 });
  }

  // useObject 的 submit() 会把字符串当请求体发过来，这里兼容两种写法
  const body = await req.json();
  const prompt = typeof body === "string" ? body : (body.prompt ?? "");

  const result = streamText({
    model: deepSeek("deepseek-flash"),
    // output 让模型按 schema 产出对象，而不是自由文本
    output: Output.object({ schema: dashboardSchema }),
    prompt: "根据这段描述生成一个指标看板：" + prompt,
  });

  // 对象流要走文本流协议，前端 useObject 才能解析
  return createTextStreamResponse({
    stream: toTextStream({ stream: result.stream }),
  });
}`,
      },
      {
        path: "app/page.tsx",
        order: 4,
        action: "replace",
        hint: "useObject 边收边渲染",
        code: `"use client";

import { MetricCard } from "@/components/metric-card";
import { dashboardSchema } from "@/lib/dashboard";
import { useObject } from "@ai-sdk/react";
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("上月各渠道 GMV 对比，给 3 个指标");

  // object 会随流不断补全：先有 title，再有 metrics[0]、metrics[1]…
  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/generate",
    schema: dashboardSchema,
  });

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12 font-sans">
      <main className="w-full max-w-4xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">结构化输出</h1>
          <p className="text-sm text-zinc-500">
            描述你想要的看板，模型按 schema 返回对象，界面边收边渲染。
          </p>
        </header>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!prompt.trim() || isLoading) return;
            submit(prompt.trim());
          }}
        >
          <label className="block text-sm font-medium">
            描述
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isLoading ? "生成中…" : "生成看板"}
            </button>
            {isLoading && (
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

        {error && <p className="text-sm text-red-600">{error.message}</p>}

        {object && (
          <section className="space-y-4">
            <h2 className="text-lg font-medium">{object.title ?? "生成中…"}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {(object.metrics ?? []).map((metric, index) => (
                <MetricCard
                  key={index}
                  label={metric?.label ?? ""}
                  value={metric?.value ?? 0}
                  unit={metric?.unit}
                  delta={metric?.delta}
                />
              ))}
            </div>
            {object.note && (
              <p className="text-sm text-zinc-500">{object.note}</p>
            )}
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
    slug: "message-protocol",
    title: "UI 消息协议",
    summary:
      "让过程留在界面上：步骤卡、深度思考、token 用量都跟着消息走，用 createUIMessageStream 自己拼出这条流。",
    concepts: [
      "createUIMessageStream — 手写 UI 消息流：writer.write 写自定义数据、writer.merge 合并模型的流",
      "sendReasoning — 开启后把模型的推理内容作为 reasoning part 发给客户端",
      "messageMetadata — 在开始/结束事件上附加元数据（如 token 用量），前端从 message.metadata 读取",
      "onData — useChat 的回调，用来接收 data-* part（transient 的数据不会进入 message.parts）",
    ],
    docLinks: [
      {
        title: "Streaming Custom Data",
        href: "https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data",
      },
      {
        title: "Message Metadata",
        href: "https://ai-sdk.dev/docs/ai-sdk-ui/message-metadata",
      },
      {
        title: "Reasoning",
        href: "https://ai-sdk.dev/docs/ai-sdk-core/reasoning",
      },
      {
        title: "createUIMessageStream",
        href: "https://ai-sdk.dev/docs/reference/ai-sdk-ui/create-ui-message-stream",
      },
    ],
    files: [
      {
        path: "lib/message-meta.ts",
        order: 1,
        action: "create",
        hint: "元数据与自定义数据的类型，服务端客户端共用",
        code: `import { type UIMessage } from "ai";
import { z } from "zod";

// 元数据：服务端写、客户端读，schema 让两边都有类型
// 流开始时写 model，结束时补 totalTokens —— 所以两个字段都是可选的
export const messageMetadataSchema = z.object({
  model: z.string().optional(),
  totalTokens: z.number().optional(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

// 自定义数据类型：
// - step 会留在消息里（data-step part）
// - status 是 transient 的，只走 onData，不进消息历史
export type ChatDataTypes = {
  step: { label: string; status: "running" | "done" };
  status: { text: string };
};

// 带上元数据和自定义数据类型的消息
export type ChatMessage = UIMessage<MessageMetadata, ChatDataTypes>;`,
      },
      {
        path: "app/api/generate/route.ts",
        order: 2,
        action: "replace",
        hint: "createUIMessageStream + writer + sendReasoning + messageMetadata",
        code: `import { loadChat, saveChat } from "@/lib/chat-store";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { deepSeek } from "@ai-sdk/deepseek";

export const maxDuration = 30;

// 刷新时恢复历史（同第 4 课）
export async function GET(req: Request) {
  const chatId = new URL(req.url).searchParams.get("chatId") ?? "default";
  try {
    const messages = await loadChat(chatId);
    return Response.json({ messages });
  } catch {
    return Response.json({ messages: [] });
  }
}

// 清空记录：把存档覆盖成空数组
export async function DELETE(req: Request) {
  const chatId = new URL(req.url).searchParams.get("chatId") ?? "default";
  await saveChat({ chatId, messages: [] });
  return Response.json({ ok: true });
}

export async function POST(req: Request) {
  if (!process.env.DEEPSEEK_API_KEY) {
    return Response.json({ error: "请先完成初始化" }, { status: 503 });
  }

  const {
    messages,
    chatId = "default",
  }: { messages: UIMessage[]; chatId?: string } = await req.json();

  const stream = createUIMessageStream({
    async execute({ writer }) {
      // 官方要求：先写 start 开启这条 assistant 消息，再写任何 part
      writer.write({ type: "start" });

      // transient 的数据不进消息历史，只通过 onData 送到前端（用完就丢）
      writer.write({
        type: "data-status",
        data: { text: "正在思考…" },
        transient: true,
      });

      // 自定义数据：type 必须以 data- 开头，会作为 data-step part 留在消息里
      // 写一次 = 多一条步骤；用同一个 id 再写 = 原地更新那一条
      writer.write({
        type: "data-step",
        id: "step-receive",
        data: { label: "接收问题", status: "done" },
      });
      writer.write({
        type: "data-step",
        id: "step-answer",
        data: { label: "生成回复", status: "running" },
      });

      const result = streamText({
        model: deepSeek("deepseek-flash"),
        messages: await convertToModelMessages(messages),
        // 打开 DeepSeek 的思考模式：模型先想再答，思考过程作为 reasoning part 发出去
        providerOptions: { deepseek: { thinking: { type: "enabled" } } },
        onEnd() {
          // 模型这条流结束：用同一个 id 把上面那条步骤改成完成
          writer.write({
            type: "data-step",
            id: "step-answer",
            data: { label: "生成回复", status: "done" },
          });
        },
      });

      // 把模型的流转换成 UI 消息流，再合并进我们自己写的这条流
      writer.merge(
        toUIMessageStream({
          stream: result.stream,
          originalMessages: messages,
          // start 已经由外层写过了，这里不要再写一次
          sendStart: false,
          // 把推理内容也发给前端（默认不发送）
          sendReasoning: true,
          // 元数据写两次：开始时给模型名，结束时补 token 用量
          messageMetadata: ({ part }) => {
            if (part.type === "start") {
              return { model: "deepseek-flash" };
            }
            if (part.type === "finish") {
              return {
                model: "deepseek-flash",
                totalTokens: part.totalUsage.totalTokens,
              };
            }
          },
          onEnd: ({ messages: finalMessages }) => {
            void saveChat({ chatId, messages: finalMessages });
          },
        }),
      );
    },
  });

  return createUIMessageStreamResponse({ stream });
}`,
      },
      {
        path: "app/page.tsx",
        order: 3,
        action: "replace",
        hint: "渲染 steps 卡、reasoning、message.metadata",
        code: `"use client";

import type { ChatMessage } from "@/lib/message-meta";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useState } from "react";

const CHAT_ID = "default";

export default function Home() {
  const [liveStatus, setLiveStatus] = useState("");
  const [input, setInput] = useState("");

  // 泛型写上消息类型，message.metadata 与 data part 才有类型
  const { messages, setMessages, sendMessage, status, stop, error } =
    useChat<ChatMessage>({
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
      // 自定义数据（transient）只会走这里，不会进入 message.parts
      onData: (dataPart) => {
        if (dataPart.type === "data-status") {
          setLiveStatus(dataPart.data.text);
        }
      },
    });

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

  // 清空记录：服务端删掉存档，本地消息也清掉，界面立刻变空
  async function handleClear() {
    await fetch("/api/generate?chatId=" + CHAT_ID, { method: "DELETE" });
    setMessages([]);
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8 font-sans">
      <main className="flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-4">
        <header className="flex shrink-0 items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">UI 消息协议</h1>
            <p className="text-sm text-zinc-500">
              每条回复会留下：步骤卡、深度思考、模型与 token 用量。
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={messages.length === 0 || loading}
            className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
          >
            清空记录
          </button>
        </header>

        {/* 自定义数据：来自 onData 的实时状态 */}
        {loading && liveStatus && (
          <p className="shrink-0 text-xs text-zinc-500">{liveStatus}</p>
        )}

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
                    {/* 元数据：流一开始就有模型名，结束时补上 token 用量 */}
                    {message.role === "assistant" && message.metadata && (
                      <p className="font-mono text-[11px] text-zinc-400">
                        {message.metadata.model ?? "assistant"}
                        {message.metadata.totalTokens != null
                          ? " · " + message.metadata.totalTokens + " tokens"
                          : " · 生成中…"}
                      </p>
                    )}

                    {message.parts.map((part, index) => {
                      if (part.type === "text") {
                        return (
                          <span key={index} className="whitespace-pre-wrap">
                            {part.text}
                          </span>
                        );
                      }

                      // 推理内容：模型在想什么，折叠显示，会一直留在消息里
                      if (part.type === "reasoning") {
                        return (
                          <details
                            key={index}
                            className="rounded-md bg-white/70 px-2 py-1 text-xs text-zinc-500"
                          >
                            <summary>
                              {part.state === "streaming"
                                ? "深度思考中…（" + part.text.length + " 字）"
                                : "深度思考（" + part.text.length + " 字）"}
                            </summary>
                            <p className="mt-1 whitespace-pre-wrap">{part.text}</p>
                          </details>
                        );
                      }

                      // 自定义数据：一条步骤一行，同一 id 会被原地更新
                      if (part.type === "data-step") {
                        return (
                          <p
                            key={index}
                            className="flex items-center gap-2 font-mono text-[11px] text-zinc-500"
                          >
                            <span>{part.data.status === "done" ? "✓" : "…"}</span>
                            {part.data.label}
                          </p>
                        );
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
              placeholder="例如：帮我分析一下怎么学 AI SDK"
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
    slug: "error-handling",
    title: "错误处理",
    summary:
      "让聊天失败时也不崩：服务端把异常转成错误文本，前端提示、重试、中止。",
    concepts: [
      "onError — createUIMessageStream 的错误处理：把服务端异常转成前端能读到的错误文本",
      "error — useChat 返回的错误对象，status 变成 error 时展示提示",
      "regenerate — 失败后重新生成最后一条回复",
      "stop — 中止正在进行的流式回复",
    ],
    docLinks: [
      {
        title: "Error Handling（UI）",
        href: "https://ai-sdk.dev/docs/ai-sdk-ui/error-handling",
      },
      {
        title: "Error Handling（Core）",
        href: "https://ai-sdk.dev/docs/ai-sdk-core/error-handling",
      },
      {
        title: "createUIMessageStream",
        href: "https://ai-sdk.dev/docs/reference/ai-sdk-ui/create-ui-message-stream",
      },
      {
        title: "useChat 参考",
        href: "https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat",
      },
    ],
    files: [
      {
        path: "app/api/generate/route.ts",
        order: 1,
        action: "replace",
        hint: "createUIMessageStream + onError",
        code: `import { loadChat, saveChat } from "@/lib/chat-store";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { deepSeek } from "@ai-sdk/deepseek";

export const maxDuration = 30;

// 刷新时恢复历史（同第 4 课）
export async function GET(req: Request) {
  const chatId = new URL(req.url).searchParams.get("chatId") ?? "default";
  try {
    const messages = await loadChat(chatId);
    return Response.json({ messages });
  } catch {
    return Response.json({ messages: [] });
  }
}

// 清空记录：把存档覆盖成空数组
export async function DELETE(req: Request) {
  const chatId = new URL(req.url).searchParams.get("chatId") ?? "default";
  await saveChat({ chatId, messages: [] });
  return Response.json({ ok: true });
}

export async function POST(req: Request) {
  if (!process.env.DEEPSEEK_API_KEY) {
    return Response.json({ error: "请先完成初始化" }, { status: 503 });
  }

  const {
    messages,
    chatId = "default",
    // 前端勾选「模拟错误」时会带上这个标记，方便演示失败情况
    simulateError = false,
  }: { messages: UIMessage[]; chatId?: string; simulateError?: boolean } =
    await req.json();

  const stream = createUIMessageStream({
    async execute({ writer }) {
      if (simulateError) {
        // 流里抛出的错误会交给下面的 onError 处理
        throw new Error("模拟的服务端错误：模型调用失败");
      }

      const result = streamText({
        model: deepSeek("deepseek-flash"),
        messages: await convertToModelMessages(messages),
      });

      writer.merge(
        toUIMessageStream({
          stream: result.stream,
          originalMessages: messages,
          onEnd: ({ messages: finalMessages }) => {
            void saveChat({ chatId, messages: finalMessages });
          },
        }),
      );
    },
    // 决定错误以什么文案传给前端（前端从 useChat 的 error 里读）
    onError: (error) =>
      error instanceof Error ? error.message : "生成失败，请稍后重试",
  });

  return createUIMessageStreamResponse({ stream });
}`,
      },
      {
        path: "app/page.tsx",
        order: 2,
        action: "replace",
        hint: "错误提示 + 重试 + 模拟失败开关",
        code: `"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useState } from "react";

const CHAT_ID = "default";

export default function Home() {
  const [simulateError, setSimulateError] = useState(false);
  const [input, setInput] = useState("");

  const { messages, setMessages, sendMessage, status, stop, error, regenerate } =
    useChat({
      id: CHAT_ID,
      transport: new DefaultChatTransport({
        api: "/api/generate",
        // body 写成函数：每次请求都读取最新的开关状态
        body: () => ({ chatId: CHAT_ID, simulateError }),
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

  // 清空记录：服务端删掉存档，本地消息也清掉，界面立刻变空
  async function handleClear() {
    await fetch("/api/generate?chatId=" + CHAT_ID, { method: "DELETE" });
    setMessages([]);
    setSimulateError(false);
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8 font-sans">
      <main className="flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-4">
        <header className="flex shrink-0 items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">错误处理</h1>
            <p className="text-sm text-zinc-500">
              勾选下面的开关制造一次失败，再点重试。
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={messages.length === 0 || loading}
            className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
          >
            清空记录
          </button>
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
          <div className="flex shrink-0 items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-sm text-red-700">{error.message}</p>
            {/* 失败后用 regenerate 重新生成最后一条回复 */}
            <button
              type="button"
              onClick={() => regenerate()}
              disabled={!(status === "ready" || status === "error")}
              className="shrink-0 rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 disabled:opacity-50"
            >
              重试
            </button>
          </div>
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

          <label className="flex items-center gap-2 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={simulateError}
              onChange={(event) => setSimulateError(event.target.checked)}
            />
            模拟服务端错误
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
