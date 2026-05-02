import type { StandardProps } from "../props";
import { setFileBrowserRef, type FileBrowserCommit, type FileBrowserState } from "../model/state";
import { ExternalLink, GitBranch, GitCommit, Tag, type IconProps } from "react-feather";
import type { FileBrowserView } from "../model/view-model";
import { assertString } from "../helpers/assert-string";
import { assertNever } from "../helpers/assert-never";
import { Link } from "../link";
import type { RefName } from "../../pkg/git_future_web";
import { refNameToPlainObject, type RefNamePlainObject } from "../ref";

export function RefNav({ view, updateState }: StandardProps<FileBrowserState, FileBrowserView>) {
  const sortedRefs = view.derived.refs.toSorted((a, b) => {
    const typeOrderDiff = refTypeOrder(a) - refTypeOrder(b);
    if (typeOrderDiff !== 0) return typeOrderDiff;
    else if (a.discriminator() === "head" || b.discriminator() === "head") {
      // a and b are same type, but we can't have two heads or two stashes
      throw new Error("unreachable");
    } else {
      return a.name() < b.name() ? -1 : 1;
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
          <li key={refText(refNameToPlainObject(ref))}>
            <Link
              className="dropdown-item d-flex align-items-center"
              onClick={() => updateState(setFileBrowserRef(refNameToPlainObject(ref)))}
            >
              <RefIcon ref={refNameToPlainObject(ref)} size={20} className="me-2" />
              {refText(refNameToPlainObject(ref))}
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
  ref: RefNamePlainObject;
} & IconProps) {
  switch (ref.type) {
    case "head": {
      return <GitCommit {...props} />;
    }
    case "ref": {
      const value = ref.name;
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

function refText(refName: RefNamePlainObject) {
  if (refName.type === "head") return "HEAD";
  else {
    const value = refName.name;
    const [_, ...rest] = value.split("/");
    if (rest.length === 0) {
      return value;
    } else {
      return rest.join("/");
    }
  }
}

function refTypeOrder(ref: RefName): number {
  switch (ref.discriminator()) {
    case "head":
      return 0;
    case "ref": {
      const value = assertString(ref.name());
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
