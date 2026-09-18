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
  command?: string;
  copyText?: string;
  copyLabel?: string;
};

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

/** 从文件列表生成跟做步骤（mkdir → 逐文件粘贴 → pnpm dev） */
export function getFollowSteps(files: ProjectFile[]): FollowStep[] {
  const sorted = [...files]
    .filter((file) => file.order != null && file.action != null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const dirs = new Set<string>();
  for (const file of sorted) {
    const slash = file.path.lastIndexOf("/");
    if (slash > 0) dirs.add(file.path.slice(0, slash));
  }

  const steps: FollowStep[] = [];

  if (dirs.size > 0) {
    steps.push({
      description: `在 ${PROJECT_DIR} 目录创建本课需要的文件夹。`,
      command: `mkdir -p ${[...dirs].join(" ")}`,
    });
  }

  for (const file of sorted) {
    const verb = getFileActionLabel(file.action!);
    steps.push({
      description: `${verb} ${file.path}${file.hint ? `（${file.hint}）` : ""}，粘贴代码。`,
      copyText: file.code,
      copyLabel: file.path,
    });
  }

  steps.push({
    description: "保存后启动开发服务器，在浏览器打开 localhost:3000 验证本课效果。",
    command: "pnpm dev",
  });

  return steps;
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
      "fetch — 客户端调用自己的 API",
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
        path: "lib/model.ts",
        order: 1,
        action: "create",
        hint: "共享模型",
        code: `import { deepSeek } from "@ai-sdk/deepseek";

export const model = deepSeek("deepseek-flash");`,
      },
      {
        path: "app/api/generate-text/route.ts",
        order: 2,
        action: "create",
        hint: "POST 接口",
        code: `import { generateText } from "ai";
import { model } from "@/lib/model";

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const { text } = await generateText({
    model,
    prompt,
  });
  return Response.json({ text });
}`,
      },
      {
        path: "app/page.tsx",
        order: 3,
        action: "replace",
        hint: "首页表单 + 展示结果",
        code: `"use client";

import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("用一句话介绍你自己");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    const res = await fetch("/api/generate-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    setText(data.text);
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 p-6">
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <button onClick={onSubmit} disabled={loading}>发送</button>
      {text && <p>{text}</p>}
    </main>
  );
}`,
      },
    ],
  },
  {
    kind: "project",
    slug: "stream",
    title: "流式回复",
    summary: "把等待改成「边生成边显示」，体验更接近真实聊天产品。",
    concepts: [
      "streamText — token 级流式输出",
      "toTextStreamResponse — 服务端返回文本流",
      "useCompletion — 客户端边收边渲染",
    ],
    prerequisite: "确认已完成「单轮问答」，lib/model.ts 已存在。",
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
        title: "DeepSeek Provider",
        href: "https://ai-sdk.dev/providers/ai-sdk-providers/deepseek",
      },
    ],
    files: [
      {
        path: "app/api/stream-text/route.ts",
        order: 1,
        action: "create",
        hint: "流式 POST 接口",
        code: `import { streamText } from "ai";
import { model } from "@/lib/model";

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const result = streamText({ model, prompt });
  return result.toTextStreamResponse();
}`,
      },
      {
        path: "components/chat-completion.tsx",
        order: 2,
        action: "create",
        hint: "useCompletion 组件",
        code: `"use client";

import { useCompletion } from "@ai-sdk/react";

export function ChatCompletion() {
  const { completion, complete, isLoading } = useCompletion({
    api: "/api/stream-text",
  });

  return (
    <div>
      <button
        onClick={() => complete("用三句话介绍 TypeScript")}
        disabled={isLoading}
      >
        发送
      </button>
      <p>{completion}</p>
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
    prerequisite: "确认已完成「流式回复」，components 目录已存在。",
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
import { model } from "@/lib/model";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model,
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
