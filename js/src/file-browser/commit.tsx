import { GitCommit } from "react-feather";
import type { StandardProps } from "../props";
import type { FileBrowserView } from "../view";
import { viewCommit } from "../state";

export function Commit({ view, updateState }: StandardProps<unknown, FileBrowserView>) {
  const commit = view.model.commit;
  const commitDate = Temporal.Instant.from(commit.author_date);
  return (
    <a
      href="#"
      className="p-3 d-flex text-decoration-none link-body-emphasis"
      onClick={() => updateState(viewCommit(commit.id))}
    >
      <GitCommit className="me-3 flex-shrink-0" />
      <div className="flex-grow-1 text-truncate">{view.model.commit.message}</div>
      <div className="flex-shrink-0 text-nowrap ms-3">{view.model.commit.author_name}</div>
      <div className="flex-shrink-0 text-nowrap ms-3">
        {timeAgo(commitDate, Temporal.Now.instant())}
      </div>
    </a>
  );
}

function timeAgo(since: Temporal.Instant, now: Temporal.Instant): string {
  let diff = now.since(since).round("seconds");
  if (diff.seconds < 60) {
    return `${diff.seconds} seconds ago`;
  }
  diff = diff.round("minutes");
  if (diff.minutes < 60) {
    return `${diff.minutes} minutes ago`;
  }
  diff = diff.round("hours");
  if (diff.hours < 24) {
    return `${diff.hours} hours ago`;
  }
  diff = diff.round("days");
  if (diff.days < 30) {
    return `${diff.days} days ago`;
  }
  if (diff.days < 365) {
    return `${Math.round(diff.days / 30)} months ago`;
  }
  return `${Math.round(diff.days / 365.2425)} years ago`;
}
