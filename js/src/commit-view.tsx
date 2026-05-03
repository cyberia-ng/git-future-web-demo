import type { DetailedHTMLProps, HTMLAttributes, ReactNode } from "react";
import type { StandardProps } from "./props";
import { browseCommit, returnTo, viewCommit, type CommitViewState } from "./model/state";
import type { CommitView } from "./model/view-model";
import { DiffView } from "./diff-view";
import { Link } from "./link";
import type { EphemeralState } from "./model/ephemeral";
import { ArrowLeft } from "react-feather";

export function CommitView({ view, updateState }: StandardProps<CommitViewState, CommitView>) {
  const diff = view.ephemeral.diff;
  const commit = view.derived.commit;
  const differentCommitter =
    commit.committer_name !== commit.author_name || commit.committer_email !== commit.author_email;
  const differentCommitDate = commit.commit_date !== commit.author_date;
  return (
    <>
      <ReturnTo view={view} updateState={updateState} />
      <ul className="list-group">
        <li className="list-group-item d-flex flex-wrap bg-body-tertiary align-items-center">
          <strong>Commit</strong>
          <div className="ms-3 flex-grow-1 font-monospace text-truncate">{commit.id()}</div>
          <div>
            <button
              className="btn btn-primary"
              onClick={() => updateState(browseCommit(commit.id()))}
            >
              Browse tree
            </button>
          </div>
        </li>
        {commit.parents().map((parentId) => (
          <CommitHeader key={parentId} name="Parent" className="font-monospace">
            <Link
              className="text-decoration-none"
              onClick={() => updateState(viewCommit(parentId))}
            >
              {parentId}
            </Link>
          </CommitHeader>
        ))}
        <CommitHeader name="Author">
          {commit.author_name()} &lt;{commit.author_email()}&gt;
        </CommitHeader>
        <CommitHeader name="Author date">{commit.author_date()}</CommitHeader>
        {differentCommitter && (
          <CommitHeader name="Committer">
            {commit.committer_name()} &lt;{commit.committer_email()}&gt;
          </CommitHeader>
        )}
        {differentCommitDate && (
          <CommitHeader name="Commit date">{commit.commit_date()}</CommitHeader>
        )}
        <li className="list-group-item">
          <pre className="p-2 whitespace-pre-wrap">{commit.message()}</pre>
        </li>
      </ul>
      <DiffSelector diff={diff} />
    </>
  );
}

function DiffSelector({ diff }: { diff: EphemeralState["diff"] }) {
  switch (diff?.type) {
    case undefined:
      return null;
    case "loading":
      return (
        <div className="mt-4 p-3 d-flex align-items-center">
          <strong role="status">Diff loading...</strong>
          <div className="spinner-border ms-auto" aria-hidden="true"></div>
        </div>
      );
    case "loaded":
      return (
        <div className="mt-4">
          <DiffView diff={diff.diff} />
        </div>
      );
  }
}

function CommitHeader({
  name,
  children,
  ...props
}: { name: ReactNode; children?: ReactNode | ReactNode[] } & DetailedHTMLProps<
  HTMLAttributes<HTMLSpanElement>,
  HTMLSpanElement
>) {
  return (
    <li className="list-group-item d-flex flex-wrap bg-body-tertiary">
      <strong>{name}</strong>
      <span {...props} className={"text-truncate ms-3 " + (props.className ?? "")}>
        {children}
      </span>
    </li>
  );
}

function ReturnTo({ view, updateState }: StandardProps<CommitViewState, CommitView>) {
  const returnState = view.state.returnTo;
  if (returnState === null) {
    return <></>;
  }
  let name: string;
  switch (returnState.commit.type) {
    case "ref": {
      const ref = returnState.commit.ref;
      switch (ref.type) {
        case "head":
          name = "HEAD";
          break;
        case "ref":
          name = ref.name;
          break;
      }
      break;
    }
    case "detached": {
      name = returnState.commit.id.slice(0, 7);
    }
  }
  return (
    <div className="bg-body-tertiary rounded-3 mb-3">
      <Link
        className="p-3 d-flex text-decoration-none link-body-emphasis"
        onClick={() => updateState(returnTo(returnState))}
      >
        <ArrowLeft />
        <div className="ms-2">Return to {name}</div>
      </Link>
    </div>
  );
}
