import { File } from "react-feather";
import type { StandardProps } from "./props";
import type { FileBrowserState } from "./state";
import { assertString, type DiffEntry } from "./types";

export function DiffEntry({ entry }: { entry: DiffEntry }) {
  const lines = entry.content.split("\n");
  const nLines = lines.length;
  const maxDigits = Math.ceil(Math.log10(nLines + 1));
  return (
    <div className="container-fluid font-monospace whitespace-pre-wrap">
      <div className="row bg-body-secondary p-2 border-bottom">
        <div className="d-flex align-items-center">
          <div>
            <File aria-label="file" size={20} />
          </div>
          <div className="ms-2">{entry.path}</div>
        </div>
      </div>
      {lines.map((line, idx) => (
        <div key={idx} className="row">
          <div
            className="col text-end user-select-none text-secondary bg-body-tertiary"
            style={{
              maxWidth: `calc(${maxDigits}ch + var(--bs-gutter-x))`,
              ...(idx === 0 ? { paddingTop: ".5rem" } : {}),
            }}
          >
            {idx + 1}
          </div>
          <div className="col" style={idx === 0 ? { paddingTop: ".5rem" } : {}}>
            {line}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Diff({ entries }: { entries: Array<DiffEntry> }) {
  return (
    <>
      {entries.map((entry) => (
        <div className="mt-3 border rounded overflow-hidden">
          <DiffEntry key={assertString(entry.path)} entry={entry} />
        </div>
      ))}
    </>
  );
}
