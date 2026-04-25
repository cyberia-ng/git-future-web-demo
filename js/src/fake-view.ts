import type { Commit } from "../pkg/rgit_web";
import type { AppState } from "./state";
import type { RepoView, ViewModel } from "./view";

export const fakeViewModel: ViewModel<AppState, RepoView> = {
  state: {
    type: "commit view",
    commitId: "42",
  },
  model: {
    type: "repo",
    name: "fake-repo",
    inner: {
      type: "commit view",
      commit: {
        id: () => "4242424242424242424242424242424242424242",
        author_name: () => "jo bloggs",
        author_email: () => "jo@bloggs.blog",
        author_date: () => "2026-01-01T00:00:00Z",
        committer_name: () => "jay blings",
        committer_email: () => "jay@blings.industries",
        commit_date: () => "2030-12-31T23:59:59-08:00",
        tree: () => "43",
        parents: () => [
          "0000000000000000000000000000000000000000",
          "ffffffffffffffffffffffffffffffffffffffff",
        ],
        message: () =>
          "a very long commit message with lots of words that are probably unnecessary but are included anyway to test the commit message display wrapping\nsome more lines\nin the\ncommit",
      } satisfies Partial<Commit> as Commit,
    },
  },
};
