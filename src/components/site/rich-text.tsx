import { Fragment } from "react";
import { cn } from "@/lib/utils";

const URL_RE = /(https?:\/\/[^\s]+)/g;

function linkify(text: string) {
  return text.split(URL_RE).map((part, i) =>
    URL_RE.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noreferrer noopener" className="break-all underline decoration-dotted underline-offset-4 hover:text-foreground">
        {part}
      </a>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/** 简单富文本：换行分段，「- 」开头渲染为列表，网址自动变成链接 */
export function RichText({ text, className, bulletClassName }: { text: string; className?: string; bulletClassName?: string }) {
  const lines = text.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim() !== "");
  return (
    <div className={cn("space-y-1.5", className)}>
      {lines.map((line, i) => {
        const m = line.match(/^\s*[-•·]\s+(.*)$/);
        return m ? (
          <div key={i} className="flex gap-2">
            <span className={cn("mt-[0.6em] size-1 shrink-0 rounded-full bg-current opacity-50", bulletClassName)} />
            <span>{linkify(m[1])}</span>
          </div>
        ) : (
          <p key={i}>{linkify(line)}</p>
        );
      })}
    </div>
  );
}
