export type GitObject = {
  id: string;
  body:
  | {
    type: "Commit";
    author_name: string;
    author_email: string;
    author_date: string;
    committer_name: string;
    committer_email: string;
    commit_date: string;
    tree: string;
    parents: string[];
    message: string;
  }
  | {
    type: "Tree";
    entries: Array<TreeEntry>;
  }
  | {
    type: "Tag";
    target: string;
    tag_type: "Commit" | "Blob" | "Tree" | "Tag";
    name: string;
    tagger_name: string | null;
    tagger_email: string | null;
    tag_date: string | null;
    message: string;
  }
  | { type: "Blob"; data: Uint8Array };
};

export type TreeEntry = {
  id: string;
  name: string;
  entry_type: "Tree" | "Symlink" | "File" | "Executable" | "Commit";
};

export type RefName =
  | { type: "Branch"; value: string }
  | { type: "Tag"; value: string }
  | { type: "Remote"; value: string }
  | { type: "Head" };
