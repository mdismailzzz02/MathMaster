import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";

const components: Components = {
  // ── Headings ──────────────────────────────────────────
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold font-heading mt-8 mb-3 pb-2 border-b-2 border-primary/30 text-primary">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-bold font-heading mt-7 mb-2 flex items-center gap-2 text-primary">
      <span className="w-1 h-6 rounded-full bg-primary inline-block shrink-0" />
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-bold font-heading mt-5 mb-1.5 text-secondary">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-bold font-heading mt-4 mb-1 text-foreground/80 uppercase tracking-wide">
      {children}
    </h4>
  ),

  // ── Paragraph ─────────────────────────────────────────
  p: ({ children }) => (
    <p className="text-foreground/80 leading-relaxed mb-3 text-sm sm:text-base">
      {children}
    </p>
  ),

  // ── Strong / Em ────────────────────────────────────────
  strong: ({ children }) => (
    <strong className="font-bold text-primary">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-secondary">{children}</em>
  ),

  // ── Lists ──────────────────────────────────────────────
  ul: ({ children }) => (
    <ul className="my-3 space-y-1.5 list-none pl-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 space-y-1.5 list-decimal pl-5 text-foreground/80 text-sm sm:text-base">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="flex gap-2 text-foreground/80 text-sm sm:text-base">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
      <span>{children}</span>
    </li>
  ),

  // ── Table ─────────────────────────────────────────────
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto rounded-xl border border-border shadow-sm">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-primary/10 border-b border-border">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-border">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-muted/50 transition-colors">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left font-bold font-heading text-primary text-xs uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-foreground/80 text-sm leading-relaxed">
      {children}
    </td>
  ),

  // ── Code ─────────────────────────────────────────────
  code: ({ children, className }) => {
    if (className) {
      return (
        <pre className="my-4 p-4 rounded-xl bg-muted/50 border border-border overflow-x-auto text-sm font-mono text-foreground/90 leading-relaxed">
          <code>{children}</code>
        </pre>
      );
    }
    return (
      <code className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[0.85em] font-mono font-medium">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,

  // ── Blockquote ────────────────────────────────────────
  blockquote: ({ children }) => (
    <blockquote className="my-4 pl-4 border-l-4 border-primary bg-primary/5 rounded-r-xl py-3 pr-3 text-foreground/70 italic">
      {children}
    </blockquote>
  ),

  // ── Horizontal Rule ───────────────────────────────────
  hr: () => <hr className="my-6 border-border" />,
};

interface StudyGuideRendererProps {
  content: string;
}

export default function StudyGuideRenderer({ content }: StudyGuideRendererProps) {
  return (
    <div>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
