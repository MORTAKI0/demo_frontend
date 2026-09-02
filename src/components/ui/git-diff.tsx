export type GitDiffLineKind =
  | "meta"
  | "old-file"
  | "new-file"
  | "hunk"
  | "context"
  | "deletion"
  | "addition";

export interface GitDiffLine {
  kind: GitDiffLineKind;
  text: string;
  oldLine?: number;
  newLine?: number;
}

export interface GitDiffFile {
  oldPath: string;
  newPath: string;
  lines: GitDiffLine[];
}

export interface ParsedGitDiff {
  files: GitDiffFile[];
}

const HUNK_HEADER =
  /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(?:.*)?$/;

function stripGitPrefix(path: string) {
  return path.startsWith("a/") || path.startsWith("b/")
    ? path.slice(2)
    : path;
}

export function parseUnifiedDiff(diff: string): ParsedGitDiff {
  const files: GitDiffFile[] = [];
  let current: GitDiffFile | undefined;
  let oldLine: number | undefined;
  let newLine: number | undefined;

  const ensureCurrent = () => {
    if (!current) {
      current = {
        oldPath: "unknown",
        newPath: "unknown",
        lines: [],
      };
    }
    return current;
  };

  const flush = () => {
    if (current) files.push(current);
    current = undefined;
    oldLine = undefined;
    newLine = undefined;
  };

  for (const rawLine of diff.replaceAll("\r\n", "\n").split("\n")) {
    if (rawLine.startsWith("diff --git ")) {
      flush();
      const match = /^diff --git (\S+) (\S+)$/.exec(rawLine);
      current = {
        oldPath: stripGitPrefix(match?.[1] ?? "unknown"),
        newPath: stripGitPrefix(match?.[2] ?? "unknown"),
        lines: [],
      };
      continue;
    }

    const file = ensureCurrent();

    if (rawLine.startsWith("--- ")) {
      const path = rawLine.slice(4).trim();
      file.oldPath = path === "/dev/null" ? path : stripGitPrefix(path);
      file.lines.push({ kind: "old-file", text: rawLine });
      continue;
    }

    if (rawLine.startsWith("+++ ")) {
      const path = rawLine.slice(4).trim();
      file.newPath = path === "/dev/null" ? path : stripGitPrefix(path);
      file.lines.push({ kind: "new-file", text: rawLine });
      continue;
    }

    const hunk = HUNK_HEADER.exec(rawLine);
    if (hunk) {
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[3]);
      file.lines.push({ kind: "hunk", text: rawLine });
      continue;
    }

    if (rawLine.startsWith("+")) {
      file.lines.push({
        kind: "addition",
        text: rawLine,
        newLine,
      });
      if (newLine !== undefined) newLine += 1;
      continue;
    }

    if (rawLine.startsWith("-")) {
      file.lines.push({
        kind: "deletion",
        text: rawLine,
        oldLine,
      });
      if (oldLine !== undefined) oldLine += 1;
      continue;
    }

    if (
      rawLine.startsWith("index ") ||
      rawLine.startsWith("new file mode ") ||
      rawLine.startsWith("deleted file mode ") ||
      rawLine.startsWith("similarity index ") ||
      rawLine.startsWith("rename from ") ||
      rawLine.startsWith("rename to ") ||
      rawLine.startsWith("\\ No newline at end of file")
    ) {
      file.lines.push({ kind: "meta", text: rawLine });
      continue;
    }

    file.lines.push({
      kind: "context",
      text: rawLine,
      oldLine,
      newLine,
    });
    if (oldLine !== undefined) oldLine += 1;
    if (newLine !== undefined) newLine += 1;
  }

  flush();
  return { files };
}
