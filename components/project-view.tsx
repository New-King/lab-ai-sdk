"use client";

import { useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { DocLinksSidebar } from "@/components/doc-links-sidebar";
import {
  labContent,
  labFileGrid,
  labMain,
  labScroll,
} from "@/lib/layout-classes";
import {
  getFileActionLabel,
  getFollowSteps,
  getOrderLabel,
  type FollowStep,
  type LabProject,
} from "@/lib/projects";

/** 项目页：跟做步骤 / 文件 / 代码 + 右侧官方文档 */
export function ProjectView({ project }: { project: LabProject }) {
  const followSteps = getFollowSteps(project.files);
  const sortedFiles = [...project.files].sort(
    (a, b) => (a.order ?? 99) - (b.order ?? 99),
  );
  const [selectedPath, setSelectedPath] = useState(sortedFiles[0]?.path ?? "");

  const selectedFile =
    sortedFiles.find((file) => file.path === selectedPath) ?? sortedFiles[0];

  return (
    <main className={labMain}>
      <div className={labContent}>
        <section className={labScroll}>
          <header className="mb-6 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
            <p className="text-sm leading-6 text-muted">{project.summary}</p>
          </header>

          {project.prerequisite && (
            <p className="mb-6 rounded-lg border border-border bg-white px-3 py-2 text-sm leading-6 text-muted">
              {project.prerequisite}
            </p>
          )}

          <ConceptList concepts={project.concepts} />

          <FollowStepsList steps={followSteps} onSelectFile={setSelectedPath} />

          <div className={`mt-6 ${labFileGrid}`}>
            <FileList
              files={sortedFiles}
              selectedPath={selectedFile?.path ?? ""}
              onSelect={setSelectedPath}
            />
            <CodeBlock file={selectedFile} />
          </div>
        </section>
      </div>

      <DocLinksSidebar
        links={project.docLinks}
        description="本课用到的核心 API，详见官方文档。"
      />
    </main>
  );
}

function ConceptList({ concepts }: { concepts: string[] }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">知识点</h2>
      <ul className="space-y-2">
        {concepts.map((concept) => (
          <li
            key={concept}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm leading-6 text-muted"
          >
            {concept}
          </li>
        ))}
      </ul>
    </section>
  );
}

function FollowStepsList({
  steps,
  onSelectFile,
}: {
  steps: FollowStep[];
  onSelectFile: (path: string) => void;
}) {
  return (
    <section className="mt-6 space-y-3">
      <h2 className="text-sm font-semibold">跟做步骤</h2>
      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li key={`${step.description}-${index}`} className="space-y-2">
            <p className="text-sm leading-6 text-muted">
              <span className="mr-1.5 font-medium text-foreground">{index + 1}.</span>
              {step.description}
            </p>
            {step.command && <CommandRow command={step.command} />}
            {step.copyText && (
              <CopyCodeRow
                label={step.copyLabel ?? "复制代码"}
                code={step.copyText}
                onSelect={() => step.copyLabel && onSelectFile(step.copyLabel)}
              />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function CommandRow({ command }: { command: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-zinc-950 px-3 py-2">
      <code className="min-w-0 flex-1 break-all font-mono text-xs leading-5 text-zinc-100">
        {command}
      </code>
      <CopyButton text={command} />
    </div>
  );
}

function CopyCodeRow({
  label,
  code,
  onSelect,
}: {
  label: string;
  code: string;
  onSelect?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-zinc-950 px-3 py-2">
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 truncate text-left font-mono text-xs leading-5 text-zinc-300 hover:text-zinc-100"
      >
        {label}
      </button>
      <CopyButton text={code} />
    </div>
  );
}

function FileList({
  files,
  selectedPath,
  onSelect,
}: {
  files: LabProject["files"];
  selectedPath: string;
  onSelect: (path: string) => void;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">相关文件</h2>
      <ul className="space-y-1">
        {files.map((file) => {
          const active = file.path === selectedPath;
          return (
            <li key={file.path}>
              <button
                type="button"
                onClick={() => onSelect(file.path)}
                className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                  active
                    ? "bg-neutral-200 text-foreground"
                    : "text-foreground hover:bg-white/80"
                }`}
              >
                <p className="truncate font-mono text-xs">
                  {file.order != null && (
                    <span className="mr-1 text-muted">{getOrderLabel(file.order)}</span>
                  )}
                  {file.path}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {file.action && getFileActionLabel(file.action)}
                  {file.hint && ` · ${file.hint}`}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CodeBlock({ file }: { file: LabProject["files"][number] | undefined }) {
  if (!file) {
    return (
      <section className="rounded-lg border border-border bg-white/60 p-4 text-sm text-muted">
        暂无代码文件。
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-col space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">代码</h2>
          <p className="truncate font-mono text-xs text-muted">{file.path}</p>
        </div>
        <CopyButton text={file.code} />
      </div>
      <pre className="min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-zinc-950 p-4 text-xs leading-5 text-zinc-100">
        <code>{file.code}</code>
      </pre>
    </section>
  );
}
