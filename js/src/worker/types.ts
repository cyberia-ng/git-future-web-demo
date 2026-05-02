export type DiffResponse = Ready | FullDiff;

export type Ready = {
  type: "ready";
};

export type FullDiff = {
  type: "full diff";
  trees: [string, string];
  serialized: Uint8Array;
};

export type DiffRequest = Initialize | RequestDiff;

export type Initialize = {
  type: "initialize";
  directory:
  | { type: "handle"; handle: FileSystemDirectoryHandle }
  | { type: "file list"; files: FileList };
};

export type RequestDiff = {
  type: "request diff";
  trees: [string, string];
};
