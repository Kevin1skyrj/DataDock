"use client";

import { FileQuestion } from "lucide-react";

import { FileIcon } from "@/components/workspace/file-icon";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * One renderer per kind of thing.
 *
 * Chosen by the descriptor the service returns rather than by sniffing the
 * filename, because the service is what will know: a `.pdf` that failed to
 * render, an image too large to inline, a video still transcoding. Deciding
 * here from the extension would mean the UI is confident about things only the
 * backend can answer.
 *
 * The players are deliberately non-functional and deliberately honest about it.
 * There are no bytes behind these fixtures, and a scrubber that moved would be
 * claiming something untrue.
 */

function Frame({ children, className }) {
  return (
    <div
      className={cn(
        "grid h-full w-full place-items-center overflow-auto bg-bg-deep p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PreviewImage({ preview, item }) {
  return (
    <Frame>
      {/* Not `next/image`: the source is a presigned URL that changes on every
          request, which defeats the optimiser and would proxy private bytes
          through the server. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={preview.url}
        alt={item.name}
        className="max-h-full max-w-full rounded-lg object-contain shadow-elevated"
      />
    </Frame>
  );
}

export function PreviewPdf({ preview, item }) {
  return (
    <iframe src={preview.url} title={item.name} className="h-full w-full bg-bg-deep" />
  );
}

export function PreviewVideo({ preview, item }) {
  return (
    <Frame>
      <video src={preview.url} aria-label={item.name} controls className="max-h-full max-w-full rounded-lg shadow-elevated" />
    </Frame>
  );
}

export function PreviewAudio({ preview, item }) {
  return (
    <Frame>
      <div className="flex w-full max-w-xl flex-col gap-6 rounded-xl border border-line bg-surface p-6">
        <div className="flex items-center gap-3">
          <FileIcon kind="audio" className="size-5" />
          <span className="min-w-0 flex-1 truncate text-md text-foreground">{item.name}</span>
        </div>
        <audio src={preview.url} aria-label={item.name} controls className="w-full" />
      </div>
    </Frame>
  );
}

export function PreviewText({ preview, mono = false }) {
  return (
    <div className="h-full overflow-auto bg-bg-deep p-6">
      <pre
        className={cn(
          "mx-auto max-w-3xl text-md leading-[1.7] whitespace-pre-wrap text-muted-foreground",
          mono && "font-mono text-base",
        )}
      >
        {preview.content}
      </pre>
    </div>
  );
}

/**
 * Markdown, rendered by the smallest thing that is honest.
 *
 * Headings, bold, list items and quotes — enough that a `.md` file reads as
 * formatted rather than as source. A full parser is a dependency, and the file
 * preview milestone is not the place to take one on for four constructs.
 */
export function PreviewMarkdown({ preview }) {
  const lines = preview.content.split("\n");

  return (
    <div className="h-full overflow-auto bg-bg-deep p-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-2.5">
        {lines.map((line, index) => {
          const key = `${index}-${line.slice(0, 12)}`;

          if (line.startsWith("## ")) {
            return (
              <h3 key={key} className="mt-3 text-xl font-medium text-foreground">
                {line.slice(3)}
              </h3>
            );
          }
          if (line.startsWith("# ")) {
            return (
              <h2 key={key} className="text-display-xs font-semibold tracking-tight">
                {line.slice(2)}
              </h2>
            );
          }
          if (line.startsWith("> ")) {
            return (
              <p key={key} className="border-l-2 border-brand pl-3 text-md text-dim italic">
                {line.slice(2)}
              </p>
            );
          }
          if (/^[-*] /.test(line) || /^\d+\. /.test(line)) {
            return (
              <p key={key} className="pl-4 text-md text-muted-foreground">
                <span className="mr-2 text-dim">·</span>
                <Inline text={line.replace(/^([-*]|\d+\.) /, "")} />
              </p>
            );
          }
          if (!line.trim()) return <span key={key} className="h-1" />;

          return (
            <p key={key} className="text-md leading-[1.7] text-muted-foreground">
              <Inline text={line} />
            </p>
          );
        })}
      </div>
    </div>
  );
}

/** `**bold**` only — the one inline mark these notes actually use. */
function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, index) =>
    part.startsWith("**") ? (
      <strong key={index} className="font-medium text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

export function PreviewUnsupported({ preview, item }) {
  return (
    <Frame>
      <div className="flex max-w-72 flex-col items-center gap-4 text-center">
        <span className="grid size-14 place-items-center rounded-xl bg-surface text-dim">
          <FileQuestion className="size-6" />
        </span>
        <div className="flex flex-col gap-1.5">
          <p className="text-md font-medium text-foreground">No preview</p>
          <p className="text-base leading-[1.6] text-muted-foreground text-balance">
            {preview.reason}
          </p>
        </div>
        <p className="font-mono text-xs text-dim">{formatBytes(item.size)}</p>
      </div>
    </Frame>
  );
}

export const PREVIEW_RENDERERS = {
  image: PreviewImage,
  pdf: PreviewPdf,
  video: PreviewVideo,
  audio: PreviewAudio,
  markdown: PreviewMarkdown,
  text: PreviewText,
  code: (props) => <PreviewText {...props} mono />,
  unsupported: PreviewUnsupported,
};
