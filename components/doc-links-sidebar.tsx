import { labPreview } from "@/lib/layout-classes";
import type { DocLink } from "@/lib/doc-link";

/** 右侧官方文档链接，与首页样式一致 */
export function DocLinksSidebar({
  links,
  description = "深入概念与完整 API 请查阅官方文档。",
}: {
  links: DocLink[];
  description?: string;
}) {
  return (
    <aside className={labPreview}>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">官方文档</h2>
        <p className="text-xs leading-5 text-muted">{description}</p>
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:bg-white/80"
              >
                {link.title}
                <span className="ml-1 text-xs text-muted">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
