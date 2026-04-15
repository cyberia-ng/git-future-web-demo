export type Commit = {
  id: string;
  author_name: string | Uint8Array;
  author_email: string | Uint8Array;
  author_date: string;
  committer_name: string | Uint8Array;
  committer_email: string | Uint8Array;
  commit_date: string;
  tree: string;
  parents: string[];
  message: string | Uint8Array;
};
export type Tree = {
  id: string;
  entries: Array<TreeEntry>;
};

export type Tag = {
  id: string;
  target: string;
  tag_type: "Commit" | "Blob" | "Tree" | "Tag";
  name: string | Uint8Array;
  tagger_name?: string | Uint8Array;
  tagger_email?: string | Uint8Array;
  tag_date?: string;
  message: string | Uint8Array;
};

export type Blob = {
  id: string;
  data: string | Uint8Array;
};

export type GitObject =
  | ({ type: "Commit" } & Commit)
  | ({ type: "Tree" } & Tree)
  | ({ type: "Tag" } & Tag)
  | ({ type: "Blob" } & Blob);

export type TreeEntryType = "Tree" | "Symlink" | "File" | "Executable" | "Commit";
export type TreeEntry = {
  id: string;
  name: string | Uint8Array;
  entry_type: TreeEntryType;
};

export type RefName = { type: "Head" } | { type: "Ref"; value: string | Uint8Array };

export type DiffEntry =
  | {
    type: "LeftOnly";
    path: string | Uint8Array;
    entry_type: TreeEntryType;
    content: string;
  }
  | {
    type: "Both";
    path: string | Uint8Array;
    left_type: TreeEntryType;
    right_type: TreeEntryType;
    content: string;
  }
  | {
    type: "RightOnly";
    path: string | Uint8Array;
    entry_type: TreeEntryType;
    content: string;
  };

export function assertString(val: string | Uint8Array): string {
  if (typeof val !== "string") {
    throw new Error("Unexpected binary data");
  }
  return val;
}
