export type HomeSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

import type { DocLink } from "@/lib/doc-link";

export type HomeDocLink = DocLink;

export type HomeStackItem = {
  label: string;
  value: string;
};

export const HOME_INIT_PATH = "/lab/getting-started";

export const HOME = {
  title: "AI SDK Lab",
  sections: [
    {
      title: "什么是 AI SDK",
      paragraphs: [
        "AI SDK 是一个 TypeScript 工具包，用于通过 React、Next.js、Vue、Svelte、Node.js 等技术构建 AI 应用和智能体。",
      ],
    },
    {
      title: "核心组成",
      bullets: [
        "AI SDK Core：用统一 API 生成文本、结构化对象、工具调用，并基于大语言模型构建智能体。",
        "AI SDK UI：一组框架无关的 Hook，用于快速构建聊天和生成式 UI。",
        "AI SDK Harnesses：使用 HarnessAgent 以统一 API 运行成熟智能体 harness。",
        "Providers — 模型接入（本 Lab 用 DeepSeek）",
      ],
    },
    {
      title: "本 Lab 讲什么",
      paragraphs: [
        "本 Lab 采用项目驱动式学习：在独立的 Next.js 项目 my-ai-app 中，按左侧课程循序渐进搭建完整应用，Lab 提供步骤、代码与文档对照。",
        "学习路径：初始化项目与环境 → 单轮问答（generateText）→ 流式回复（streamText）→ 多轮对话（useChat），由 Core 到 UI，逐步掌握 AI SDK 的核心用法。",
      ],
    },
    {
      title: "Core 与 UI 怎么分工",
      bullets: [
        "Core（ai 包）：generateText / streamText 等在服务端调用模型。",
        "UI（@ai-sdk/react）：useCompletion / useChat / useObject 消费流式响应，管理 loading、结果与错误。",
        "单轮问答：服务端 generateText，客户端 fetch — 非流式浏览器 UI 没有官方 Hook，自己接 HTTP 是正常做法。",
        "流式及多轮：必须用对应 Hook，不要手写 fetch 解析流。",
      ],
    },
  ] satisfies HomeSection[],
  stack: {
    title: "本教程技术栈",
    items: [
      { label: "框架", value: "Next.js（App Router）" },
      { label: "语言", value: "TypeScript" },
      { label: "模型提供商", value: "DeepSeek（deepseek-flash）" },
      { label: "SDK", value: "ai · @ai-sdk/react · @ai-sdk/deepseek" },
      { label: "包管理", value: "pnpm" },
    ] satisfies HomeStackItem[],
  },
  cta: {
    label: "立即开始",
    href: HOME_INIT_PATH,
  },
  docLinks: [
    { title: "AI SDK 介绍", href: "https://ai-sdk.dev/docs/introduction" },
    { title: "AI SDK Core 概览", href: "https://ai-sdk.dev/docs/ai-sdk-core/overview" },
    { title: "AI SDK UI 概览", href: "https://ai-sdk.dev/docs/ai-sdk-ui/overview" },
    { title: "Providers 与模型", href: "https://ai-sdk.dev/docs/foundations/providers-and-models" },
    { title: "generateText", href: "https://ai-sdk.dev/docs/ai-sdk-core/generating-text" },
    { title: "streamText", href: "https://ai-sdk.dev/docs/ai-sdk-core/generating-text#streamtext" },
    { title: "useChat", href: "https://ai-sdk.dev/docs/ai-sdk-ui/chatbot" },
    { title: "DeepSeek Provider", href: "https://ai-sdk.dev/providers/ai-sdk-providers/deepseek" },
  ] satisfies HomeDocLink[],
};
