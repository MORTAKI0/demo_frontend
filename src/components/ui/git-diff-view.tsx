"use client";

import {
  parseUnifiedDiff,
  type GitDiffLine,
} from "./git-diff";

function lineTone(kind: GitDiffLine["kind"]) {
  if (kind === "deletion") {
    return "border-l-2 border-red-500 bg-red-950/50 text-red-200";
  }
  if (kind === "addition") {
    return "border-l-2 border-emerald-500 bg-emerald-950/45 text-emerald-200";
  }
  if (kind === "hunk") {
    return "border-l-2 border-sky-500 bg-sky-950/50 text-sky-200";
  }
  if (kind === "old-file" || kind === "new-file") {
    return "bg-slate-900 text-slate-300";
  }
  if (kind === "meta") {
    return "bg-slate-950 text-slate-500";
  }
  return "border-l-2 border-transparent bg-[#0d1117] text-slate-300";
}

function lineNumber(value?: number) {
  return value === undefined ? "" : String(value);
}

export function GitDiffView({ diff }: { diff: string }) {
  const parsed = parseUnifiedDiff(diff);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-700 bg-[#0d1117] font-mono text-[11px] text-slate-300">
      {parsed.files.map((file, fileIndex) => (
        <section
          key={`${file.oldPath}:${file.newPath}:${fileIndex}`}
          className={fileIndex === 0 ? "" : "border-t border-slate-700"}
        >
          <div className="flex items-center gap-2 border-b border-slate-700 bg-[#161b22] px-3 py-2 text-[10px] font-semibold text-slate-300">
            <span className="text-slate-500">FILE</span>
            <span className="truncate">
              {file.oldPath === "/dev/null" ? file.newPath : file.oldPath}
            </span>
            {file.oldPath !== file.newPath &&
            file.oldPath !== "/dev/null" &&
            file.newPath !== "/dev/null" ? (
              <>
                <span className="text-slate-600">→</span>
                <span className="truncate">{file.newPath}</span>
              </>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-max">
              {file.lines.map((line, lineIndex) => {
                const kind = line.kind;
                const isCodeLine =
                  kind === "context" ||
                  kind === "deletion" ||
                  kind === "addition";

                return (
                  <div
                    key={`${lineIndex}:${line.text}`}
                    data-diff-kind={kind}
                    className={`grid grid-cols-[3rem_3rem_minmax(0,1fr)] ${lineTone(kind)}`}
                  >
                    <span
                      aria-label="old line"
                      className="select-none border-r border-slate-800 px-2 py-0.5 text-right text-slate-600"
                    >
                      {isCodeLine ? lineNumber(line.oldLine) : ""}
                    </span>
                    <span
                      aria-label="new line"
                      className="select-none border-r border-slate-800 px-2 py-0.5 text-right text-slate-600"
                    >
                      {isCodeLine ? lineNumber(line.newLine) : ""}
                    </span>
                    <code
                      className={
                        kind === "hunk"
                          ? "px-3 py-1 font-semibold"
                          : "whitespace-pre px-3 py-0.5"
                      }
                    >
                      {line.text || " "}
                    </code>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
