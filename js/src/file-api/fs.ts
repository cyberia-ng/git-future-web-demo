import { FSFile } from "./file";

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const out = [];
  for await (const item of iter) {
    out.push(item);
  }
  return out;
}

export class FSDirectory {
  constructor(private handle: FileSystemDirectoryHandle) { }

  async openSubdir(name: string) {
    const handle = await this.handle.getDirectoryHandle(name);
    return new FSDirectory(handle);
  }

  async listDir() {
    const entries = await collect(this.handle.entries());
    const directories = entries
      .filter(([, handle]) => handle.kind === "directory")
      .map(([name]) => name);
    const files = entries.filter(([, handle]) => handle.kind === "file").map(([name]) => name);
    return [directories, files];
  }

  async openFile(name: string) {
    const handle = await this.handle.getFileHandle(name);
    const file = await handle.getFile();
    return new FSFile(file);
  }
}
