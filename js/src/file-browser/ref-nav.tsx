import type { ReactNode } from "react";
import type { StandardProps } from "../props";
import { setRef, type FileBrowserState } from "../state";
import { ExternalLink, GitBranch, GitCommit, Tag, type IconProps } from "react-feather";
import type { RefName } from "../types";
import type { FileBrowserView, RepoView } from "../view";
import { assertNever } from "../assert-never";

export function RefNav({ view, updateState }: StandardProps<FileBrowserState, FileBrowserView>) {
  const sortedRefs = view.model.refs.toSorted((a, b) => {
    const typeOrderDiff = refTypeOrder(a) - refTypeOrder(b);
    if (typeOrderDiff !== 0) return typeOrderDiff;
    else if (a.type === "Head" || b.type === "Head") {
      // a and b are same type, but we can't have two heads or two stashes
      throw new Error("unreachable");
    } else {
      return a.value < b.value ? -1 : 1;
    }
  });
  return (
    <div className="dropdown">
      <button
        className="btn btn-secondary dropdown-toggle d-flex align-items-center"
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
            <a
              className="dropdown-item d-flex align-items-center"
              href="#"
              onClick={() => updateState(setRef(ref))}
            >
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
    case "Ref": {
      switch (refName.value.split("/")[0]!) {
        case "heads": {
          return <GitBranch {...props} />;
        }
        case "tags": {
          return <Tag {...props} />;
        }
        case "remotes": {
          return <ExternalLink {...props} />;
        }
        default: {
          return <GitCommit {...props} />;
        }
      }
    }
  }
  assertNever(refName);
}

function refText(refName: RefName) {
  if (refName.type === "Head") return "HEAD";
  else {
    const [_, ...rest] = refName.value.split("/");
    if (rest.length === 0) {
      return refName.value;
    } else {
      return rest.join("/");
    }
  }
}

function refTypeOrder(ref: RefName): number {
  switch (ref.type) {
    case "Head":
      return 0;
    case "Ref": {
      const [first] = ref.value.split("/");
      switch (first) {
        case "stash":
          return 1;
        case "heads":
          return 2;
        case "remotes":
          return 3;
        case "tags":
          return 4;
        default:
          return 5;
      }
    }
  }
}
