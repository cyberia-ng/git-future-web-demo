export type TreeEntryType = "Tree" | "Symlink" | "File" | "Executable" | "Commit";
export type DiffEntry =
  | {
    type: "LeftOnly";
    path: string | Uint8Array;
    entry_type: TreeEntryType;
    content: Array<Hunk>;
  }
  | {
    type: "Both";
    path: string | Uint8Array;
    left_type: TreeEntryType;
    right_type: TreeEntryType;
    content: Array<Hunk>;
  }
  | {
    type: "RightOnly";
    path: string | Uint8Array;
    entry_type: TreeEntryType;
    content: Array<Hunk>;
  };

export type LineChange = {
  tag: "equal" | "delete" | "insert";
  value: string;
};

export type Hunk = {
  old_start: number;
  old_end: number;
  new_start: number;
  new_end: number;
  changes: Array<LineChange>;
};
