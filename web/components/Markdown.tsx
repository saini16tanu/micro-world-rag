"use client";

import { Fragment } from "react";

/** Inline markdown: **bold**, *italic*, `code`, and [page 12] citations. Plain React, no library. */
function inline(text: string, keyBase: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[page[s]?\s[^\]]+\]|\*[^*\s][^*]*\*|\$[^$\n]+\$)/gi);
  return parts.map((p, i) => {
    const k = `${keyBase}-${i}`;
    if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={k} className="font-semibold text-white">{p.slice(2, -2)}</strong>;
    if (/^`[^`]+`$/.test(p)) return <code key={k} className="rounded bg-white/10 px-1 py-0.5 text-[13px] text-accent-cyan">{p.slice(1, -1)}</code>;
    if (/^\[pages?\s[^\]]+\]$/i.test(p)) return <span key={k} className="text-xs font-medium text-accent-cyan/90">{p}</span>;
    if (/^\*[^*\s][^*]*\*$/.test(p)) return <em key={k}>{p.slice(1, -1)}</em>;
    if (/^\$[^$\n]+\$$/.test(p)) return <em key={k} className="text-white/90">{p.slice(1, -1)}</em>; // simple math like $s$
    return <Fragment key={k}>{p}</Fragment>;
  });
}

/** Block markdown: headings, bullet lists, numbered lists, paragraphs. */
export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (!list) return;
    const k = `l${out.length}`;
    const items = list.items.map((it, i) => <li key={i}>{inline(it, `${k}-${i}`)}</li>);
    out.push(
      list.ordered
        ? <ol key={k} className="my-1.5 list-decimal space-y-1 pl-5 marker:text-accent-cyan/70">{items}</ol>
        : <ul key={k} className="my-1.5 list-disc space-y-1 pl-5 marker:text-accent-cyan/70">{items}</ul>,
    );
    list = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const num = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const head = line.match(/^#{1,4}\s+(.*)$/);
    if (bullet || num) {
      const ordered = !!num;
      if (!list || list.ordered !== ordered) { flush(); list = { ordered, items: [] }; }
      list.items.push((bullet || num)![1]);
      return;
    }
    flush();
    if (head) out.push(<p key={`h${idx}`} className="mt-2 font-semibold text-white">{inline(head[1], `h${idx}`)}</p>);
    else if (line.trim()) out.push(<p key={`p${idx}`} className="my-1 break-words">{inline(line, `p${idx}`)}</p>);
  });
  flush();
  return <div>{out}</div>;
}
