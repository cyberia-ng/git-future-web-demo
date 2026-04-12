export type Commit = {
  id: string;
  author_name: string;
  author_email: string;
  author_date: string;
  committer_name: string;
  committer_email: string;
  commit_date: string;
  tree: string;
  parents: string[];
  message: string;
};
export type Tree = {
  id: string;
  entries: Array<TreeEntry>;
};

export type Tag = {
  id: string;
  target: string;
  tag_type: "Commit" | "Blob" | "Tree" | "Tag";
  name: string;
  tagger_name?: string;
  tagger_email?: string;
  tag_date?: string;
  message: string;
};

export type Blob = {
  id: string;
  data: Uint8Array;
};

export type GitObject =
  | ({ type: "Commit" } & Commit)
  | ({ type: "Tree" } & Tree)
  | ({ type: "Tag" } & Tag)
  | ({ type: "Blob" } & Blob);

export type TreeEntry = {
  id: string;
  name: string;
  entry_type: "Tree" | "Symlink" | "File" | "Executable" | "Commit";
};

export type RefName = { type: "Head" } | { type: "Ref"; value: string };

export function commit(object: GitObject): Commit | null {
  if (object.type === "Commit") return object;
  else return null;
}
