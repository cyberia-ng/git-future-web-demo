import type { StandardProps } from "../props";
import { setFileBrowserRef, type FileBrowserCommit, type FileBrowserState } from "../state";
import { ExternalLink, GitBranch, GitCommit, Tag, type IconProps } from "react-feather";
import type { FileBrowserView } from "../view";
import type { RefName } from "../types/git";
import { assertString } from "../helpers/assert-string";
import { assertNever } from "../helpers/assert-never";
import { Link } from "../link";

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
        <CommitIcon commit={view.state.commit} size={20} className="me-2" />
        {commitText(view.state.commit)}
      </button>
      <ul className="dropdown-menu">
        {sortedRefs.map((ref) => (
          <li key={refText(ref)}>
            <Link
              className="dropdown-item d-flex align-items-center"
              onClick={() => updateState(setFileBrowserRef(ref))}
            >
              <RefIcon ref={ref} size={20} className="me-2" />
              {refText(ref)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CommitIcon({ commit, ...props }: { commit: FileBrowserCommit } & IconProps) {
  switch (commit.type) {
    case "detached":
      return <GitCommit {...props} />;
    case "ref":
      return RefIcon({ ref: commit.ref, ...props });
  }
}

function RefIcon({
  ref,
  ...props
}: {
  ref: RefName;
} & IconProps) {
  switch (ref.type) {
    case "Head": {
      return <GitCommit {...props} />;
    }
    case "Ref": {
      const value = assertString(ref.value);
      switch (value.split("/")[0]!) {
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
  assertNever(ref);
}

function commitText(commit: FileBrowserCommit): string {
  switch (commit.type) {
    case "detached":
      return commit.id.slice(0, 8);
    case "ref":
      return refText(commit.ref);
  }
}

function refText(refName: RefName) {
  if (refName.type === "Head") return "HEAD";
  else {
    const value = assertString(refName.value);
    const [_, ...rest] = value.split("/");
    if (rest.length === 0) {
      return value;
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
      const value = assertString(ref.value);
      const [first] = value.split("/");
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
