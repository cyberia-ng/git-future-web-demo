import { GitCommit } from "react-feather";
import type { StandardProps } from "../props";
import type { FileBrowserView } from "../model/view-model";
import { viewCommit } from "../model/state";
import { Link } from "../link";

export function Commit({ view, updateState }: StandardProps<unknown, FileBrowserView>) {
  const commit = view.derived.commit;
  if (commit === undefined) {
    return <></>;
  }
  const commitDate = Temporal.Instant.from(commit.author_date());
  return (
    <Link
      className="p-3 d-flex text-decoration-none link-body-emphasis"
      onClick={() => updateState(viewCommit(commit.id()))}
    >
      <GitCommit className="me-3 flex-shrink-0" />
      <div className="flex-grow-1 text-truncate">{commit.message()}</div>
      <div className="flex-shrink-0 text-nowrap ms-3">{commit.author_name()}</div>
      <div className="flex-shrink-0 text-nowrap ms-3">
        {timeAgo(commitDate, Temporal.Now.instant())}
      </div>
    </Link>
  );
}

function unitPluralize(number: number, unit: string) {
  if (number === 1) {
    return `1 ${unit} ago`;
  } else {
    return `${number} ${unit}s ago`;
  }
}

function timeAgo(since: Temporal.Instant, now: Temporal.Instant): string {
  let diff = now.since(since).round("seconds");
  if (diff.seconds < 60) {
    return unitPluralize(diff.seconds, "second");
  }
  diff = diff.round("minutes");
  if (diff.minutes < 60) {
    return unitPluralize(diff.minutes, "minute");
  }
  diff = diff.round("hours");
  if (diff.hours < 24) {
    return unitPluralize(diff.hours, "hour");
  }
  diff = diff.round("days");
  if (diff.days < 30) {
    return unitPluralize(diff.days, "day");
  }
  if (diff.days < 365) {
    return unitPluralize(Math.round(diff.days / 30), "month");
  }
  return unitPluralize(Math.round(diff.days / 365.2425), "year");
}
