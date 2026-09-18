"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
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
  getLabOperations,
  getOrderLabel,
  type LabOperation,
  type LabProject,
} from "@/lib/projects";

/** 项目页：操作列表 + 代码 + 右侧官方文档 */
export function ProjectView({ project }: { project: LabProject }) {
  const operations = getLabOperations(project.files);
  const [selectedId, setSelectedId] = useState(operations[0]?.id ?? "");
  const detailRef = useRef<HTMLElement>(null);

  const selected =
    operations.find((op) => op.id === selectedId) ?? operations[0];

  useEffect(() => {
    detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

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

          <div className={`mt-6 ${labFileGrid}`}>
            <OperationList
              operations={operations}
              selectedId={selected?.id ?? ""}
              onSelect={setSelectedId}
            />
            <OperationDetail ref={detailRef} operation={selected} />
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

function OperationList({
  operations,
  selectedId,
  onSelect,
}: {
  operations: LabOperation[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">操作</h2>
      <ul className="space-y-1">
        {operations.map((op) => {
          const active = op.id === selectedId;
          return (
            <li key={op.id}>
              <button
                type="button"
                onClick={() => onSelect(op.id)}
                className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                  active
                    ? "bg-neutral-200 text-foreground"
                    : "text-foreground hover:bg-white/80"
                }`}
              >
                <p className="truncate font-mono text-xs">
                  <span className="mr-1 text-muted">{getOrderLabel(op.order)}</span>
                  {op.label}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const OperationDetail = forwardRef<
  HTMLElement,
  { operation: LabOperation | undefined }
>(function OperationDetail({ operation }, ref) {
  if (!operation) {
    return (
      <section
        ref={ref}
        className="rounded-lg border border-border bg-white/60 p-4 text-sm text-muted"
      >
        暂无操作。
      </section>
    );
  }

  if (operation.kind === "scaffold") {
    return (
      <section ref={ref} className="flex min-h-0 min-w-0 w-full flex-col space-y-2">
        <h2 className="text-sm font-semibold">代码</h2>
        <p className="text-sm leading-6 text-muted">{operation.description}</p>
        <CodePanel code={operation.command} language="bash" />
      </section>
    );
  }

  const { file } = operation;

  return (
    <section ref={ref} className="flex min-h-0 min-w-0 w-full flex-col space-y-2">
      <h2 className="text-sm font-semibold">代码</h2>
      {(file.action || file.hint) && (
        <p className="text-sm leading-6 text-muted">
          {[file.action && getFileActionLabel(file.action), file.hint]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      <CodePanel key={file.path} code={file.code} path={file.path} />
    </section>
  );
});
