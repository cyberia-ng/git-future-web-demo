import type { ReactNode } from "react";
import type { StandardProps } from "../props";
import { setRef, type FileBrowserState } from "../state";
import { ExternalLink, GitBranch, GitCommit, Tag, type IconProps } from "react-feather";
import type { RefName } from "../types";
import type { FileBrowserView, RepoView } from "../view";

export function RefNav({ view, updateState }: StandardProps<FileBrowserState, FileBrowserView>) {
  const sortedRefs = view.model.refs.toSorted((a, b) => {
    const typeOrderDiff = refTypeOrder(a.type) - refTypeOrder(b.type);
    if (typeOrderDiff !== 0) return typeOrderDiff;
    else if (a.type === "Head" || b.type === "Head") {
      // a and b are same type, but we can't have two heads
      throw new Error("unreachable");
    } else {
      return a.value < b.value ? -1 : 1;
    }
  });
  return (
    <div className="dropdown">
      <button
        className="btn btn-secondary dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <RefIcon refName={view.state.ref} size={20} className="me-2" />
        {refText(view.state.ref)}
      </button>
      <ul className="dropdown-menu">
        {sortedRefs.map((ref) => (
          <li key={refText(ref)}>
            <a className="dropdown-item" href="#" onClick={() => updateState(setRef(ref))}>
              <RefIcon refName={ref} size={20} className="me-2" />
              {refText(ref)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RefIcon({
  refName,
  ...props
}: {
  refName: RefName;
} & IconProps) {
  switch (refName.type) {
    case "Head": {
      return <GitCommit {...props} />;
    }
    case "Branch": {
      return <GitBranch {...props} />;
    }
    case "Tag": {
      return <Tag {...props} />;
    }
    case "Remote": {
      return <ExternalLink {...props} />;
    }
  }
}

function refText(refName: RefName) {
  if (refName.type === "Head") return "HEAD";
  else return refName.value;
}

function refTypeOrder(refType: RefName["type"]): number {
  switch (refType) {
    case "Head":
      return 0;
    case "Branch":
      return 1;
    case "Remote":
      return 2;
    case "Tag":
      return 3;
  }
}
