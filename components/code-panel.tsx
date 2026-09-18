"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { CopyButton } from "@/components/copy-button";
import { languageFromPath } from "@/lib/code-language";

type CodePanelProps = {
  code: string;
  /** 代码块顶栏标签，默认 path 或 terminal */
  path?: string;
  language?: string;
};

/** 语法高亮代码块，复制按钮在块内顶栏 */
export function CodePanel({ code, path, language }: CodePanelProps) {
  const lang = language ?? languageFromPath(path);
  const label = path ?? "terminal";
  const [html, setHtml] = useState("");

  useEffect(() => {
    let cancelled = false;
    codeToHtml(code, { lang, theme: "github-dark-default" })
      .then((result) => {
        if (!cancelled) setHtml(result);
      })
      .catch(() => {
        if (!cancelled) setHtml("");
      });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#0d1117] shadow-sm">
      <div className="flex items-center gap-2 border-b border-white/10 bg-zinc-900/90 px-3 py-2">
        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-400">
          {label}
        </span>
        <CopyButton text={code} />
      </div>
      <div className="max-h-[min(520px,65vh)] overflow-auto p-4 text-xs leading-6">
        {html ? (
          <div
            className="[&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:!bg-transparent"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre className="m-0 whitespace-pre-wrap break-all font-mono text-zinc-100">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
