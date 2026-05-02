import { File } from "react-feather";
import { assertString } from "./helpers/assert-string";
import type { CSSProperties, ReactNode } from "react";
import type { FullDiff, FullDiffEntry } from "../pkg/git_async_web";

export function DiffEntryView({ entry }: { entry: FullDiffEntry }) {
  const hunks = entry.hunks();
  const oldEnd = Math.max(...hunks.map((hunk) => hunk.old_end));
  const newEnd = Math.max(...hunks.map((hunk) => hunk.new_end));
  const maxOldDigits = Math.ceil(Math.log10(oldEnd + 1));
  const maxNewDigits = Math.ceil(Math.log10(newEnd + 1));
  return (
    <div className="container-fluid font-monospace whitespace-pre-wrap">
      <div className="row bg-body-secondary p-2 border-bottom">
        <div className="d-flex align-items-center">
          <div>
            <File aria-label="file" size={20} />
          </div>
          <div className="ms-2">{entry.path()}</div>
        </div>
      </div>
      {hunks.map((hunk, idx) => {
        const oldLength = hunk.old_end - hunk.old_start;
        const newLength = hunk.new_end - hunk.new_start;
        let oldLineIdx = hunk.old_start;
        let newLineIdx = hunk.new_start;
        const changes = hunk.changes();
        const lines: ReactNode[] = [];
        for (let ii = 0; ii < changes.length; ii++) {
          const change = changes[ii]!;
          const colorClass = { equal: "", insert: "bg-success", delete: "bg-danger" }[change.tag];
          lines.push(
            <div key={ii} className="row">
              <LineNumber
                number={change.tag === "insert" ? null : oldLineIdx}
                maxDigits={maxOldDigits}
              />
              <LineNumber
                number={change.tag === "delete" ? null : newLineIdx}
                maxDigits={maxNewDigits}
              />
              <div className={`col diff-line mw-gutter-1 ${colorClass}`}>
                {change.tag === "insert" ? "+" : change.tag === "delete" ? "-" : " "}
              </div>
              <div className={`col diff-line ${colorClass}`}>{change.value()}</div>
            </div>,
          );
          switch (change.tag) {
            case "equal": {
              oldLineIdx++;
              newLineIdx++;
              break;
            }
            case "insert": {
              newLineIdx++;
              break;
            }
            case "delete": {
              oldLineIdx++;
              break;
            }
          }
        }
        return (
          <div key={idx}>
            <div className="row bg-body-tertiary pt-1 pb-1">
              <LineNumber number={null} maxDigits={maxOldDigits} />
              <LineNumber number={null} maxDigits={maxNewDigits} />
              <div className="col">
                @@ -{hunk.old_start + 1},{oldLength} +{hunk.new_start + 1},{newLength} @@
              </div>
            </div>
            {lines}
          </div>
        );
      })}
    </div>
  );
}

export function LineNumber({ number, maxDigits }: { number: number | null; maxDigits: number }) {
  let className = "col text-end user-select-none text-secondary bg-body-tertiary";
  let style: CSSProperties = {};
  if (maxDigits < 10) {
    className += ` mw-gutter-${maxDigits}`;
  } else {
    style = { maxWidth: `calc(${maxDigits}ch + var(--bs-gutter-x))` };
  }
  return <div {...{ className, style }}>{number !== null && number + 1}</div>;
}

export function DiffView({ diff }: { diff: FullDiff }) {
  return (
    <>
      {diff.entries().map((entry) => (
        <div key={assertString(entry.path())} className="mt-3 border rounded overflow-hidden">
          <DiffEntryView entry={entry} />
        </div>
      ))}
    </>
  );
}
