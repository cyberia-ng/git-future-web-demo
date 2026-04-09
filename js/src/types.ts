export type Commit = {
  id: string;
  body: {
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
  };
};
export type Tree = {
  id: string;
  body: {
    type: "Tree";
    entries: Array<TreeEntry>;
  };
};

export type Tag = {
  id: string;
  body: {
    type: "Tag";
    target: string;
    tag_type: "Commit" | "Blob" | "Tree" | "Tag";
    name: string;
    tagger_name?: string;
    tagger_email?: string;
    tag_date?: string;
    message: string;
  };
};

export type Blob = {
  id: string;
  body: { type: "Blob"; data: Uint8Array };
};

export type GitObject = Commit | Tree | Tag | Blob;

export type TreeEntry = {
  id: string;
  name: string;
  entry_type: "Tree" | "Symlink" | "File" | "Executable" | "Commit";
};

export type RefName = { type: "Head" } | { type: "Ref"; value: string };

export function commit(object: GitObject): Commit | null {
  if (object.body.type === "Commit") return { id: object.id, body: object.body };
  else return null;
}
