import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renderizador de artefatos internos (specs/ADRs/decisões) no estilo do
 * markdown viewer do legado: h2 em ciano, code mono sobre superfície,
 * blockquote com borda de acento, tabelas densas.
 */
export function OsMarkdown({ children }: { children: string }) {
  return (
    <div className="max-w-none text-[13px] leading-relaxed [&>*+*]:mt-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="text-xl font-bold text-foreground" {...p} />,
          h2: (p) => (
            <h2 className="mt-6 text-[15px] font-bold uppercase tracking-wide text-info" {...p} />
          ),
          h3: (p) => <h3 className="mt-4 text-[13px] font-bold text-primary" {...p} />,
          a: (p) => <a className="text-info underline underline-offset-2" {...p} />,
          code: (p) => (
            <code
              className="rounded-[3px] bg-card px-1 py-0.5 font-mono text-[12px] text-info"
              {...p}
            />
          ),
          pre: (p) => (
            <pre
              className="overflow-x-auto rounded-md border border-border bg-card p-3 font-mono text-[12px] [&>code]:bg-transparent [&>code]:p-0"
              {...p}
            />
          ),
          blockquote: (p) => (
            <blockquote
              className="border-l-[3px] border-primary/70 pl-3 text-muted-foreground"
              {...p}
            />
          ),
          ul: (p) => <ul className="list-disc pl-5 [&>li+li]:mt-1" {...p} />,
          ol: (p) => <ol className="list-decimal pl-5 [&>li+li]:mt-1" {...p} />,
          table: (p) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]" {...p} />
            </div>
          ),
          th: (p) => (
            <th
              className="border-b border-border px-2 py-1 text-left font-semibold text-muted-foreground"
              {...p}
            />
          ),
          td: (p) => <td className="border-b border-border/50 px-2 py-1 align-top" {...p} />,
          hr: () => <hr className="my-4 border-border" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
