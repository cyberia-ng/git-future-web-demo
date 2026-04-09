import type { DetailedHTMLProps, HTMLAttributes, ReactNode } from "react";
import type { StandardProps } from "./props";
import { browseCommit, viewCommit, type CommitViewState } from "./state";
import type { CommitView } from "./view";

export function CommitView({ view, updateState }: StandardProps<CommitViewState, CommitView>) {
  const commit = view.model.commit;
  const differentCommitter =
    commit.body.committer_name !== commit.body.author_name ||
    commit.body.committer_email !== commit.body.author_email;
  const differentCommitDate = commit.body.commit_date !== commit.body.author_date;
  return (
    <ul className="list-group">
      <li className="list-group-item d-flex flex-wrap bg-body-tertiary align-items-center">
        <strong>Commit</strong>
        <div className="ms-3 flex-grow-1 font-monospace text-truncate">{commit.id}</div>
        <div>
          <button
            className="btn btn-primary"
            onClick={() => updateState(browseCommit(commit.id))}
          >
            Browse tree
          </button>
        </div>
      </li>
      {commit.body.parents.map((parentId) => (
        <CommitHeader key={parentId} name="Parent" className="font-monospace">
          <a
            href="#"
            className="text-decoration-none"
            onClick={() => updateState(viewCommit(parentId))}
          >
            {parentId}
          </a>
        </CommitHeader>
      ))}
      <CommitHeader name="Author">
        {commit.body.author_name} &lt;{commit.body.author_email}&gt;
      </CommitHeader>
      <CommitHeader name="Author date">{commit.body.author_date}</CommitHeader>
      {differentCommitter && (
        <CommitHeader name="Committer">
          {commit.body.committer_name} &lt;{commit.body.committer_email}&gt;
        </CommitHeader>
      )}
      {differentCommitDate && (
        <CommitHeader name="Commit date">{commit.body.commit_date}</CommitHeader>
      )}
      <li className="list-group-item">
        <pre className="p-2 whitespace-pre-wrap">{commit.body.message}</pre>
      </li>
    </ul>
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
