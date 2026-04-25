import type { DetailedHTMLProps, HTMLAttributes, ReactNode } from "react";
import type { StandardProps } from "./props";
import { browseCommit, viewCommit, type CommitViewState } from "./state";
import type { CommitView } from "./view";
import { DiffView } from "./diff-view";
import { Link } from "./link";

export function CommitView({ view, updateState }: StandardProps<CommitViewState, CommitView>) {
  const diff = view.model.diff;
  const commit = view.model.commit;
  const differentCommitter =
    commit.committer_name !== commit.author_name || commit.committer_email !== commit.author_email;
  const differentCommitDate = commit.commit_date !== commit.author_date;
  return (
    <>
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
      {diff !== undefined && !diff.is_empty() && (
        <div className="mt-4">
          <DiffView diff={diff} />
        </div>
      )}
    </>
  );
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
