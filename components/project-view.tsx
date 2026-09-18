"use client";

import { useState } from "react";
import { CodePanel } from "@/components/code-panel";
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

          <FollowStepsList steps={followSteps} />

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

function FollowStepsList({ steps }: { steps: FollowStep[] }) {
  if (steps.length === 0) return null;

  const step = steps[0]!;

  return (
    <section className="mt-6 space-y-3">
      <h2 className="text-sm font-semibold">跟做步骤</h2>
      <div className="space-y-2">
        <p className="text-sm leading-6 text-muted">{step.description}</p>
        <CodePanel code={step.command} language="bash" />
      </div>
    </section>
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
      <h2 className="text-sm font-semibold">代码</h2>
      <CodePanel code={file.code} path={file.path} />
    </section>
  );
}
