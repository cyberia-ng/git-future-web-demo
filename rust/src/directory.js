async function collect(iter) {
  const out = [];
  for await (const item of iter) {
    out.push(item);
  }
  return out;
}

export async function constructDirectory(handle) {
  try {
    await handle.getFileHandle("HEAD");
    return new JsWebDirectory(handle);
  } catch (e) {
    if (e instanceof DOMException && e.name === "NotFoundError") {
      const gitDir = await handle.getDirectoryHandle(".git");
      return new JsWebDirectory(gitDir);
    }
  }
}

export class JsWebDirectory {
  constructor(handle) {
    this.handle = handle;
  }

  async openSubdir(name) {
    const handle = await this.handle.getDirectoryHandle(name);
    return new JsWebDirectory(handle);
  }

  async listDir() {
    const entries = await collect(this.handle.entries());
    const directories = entries
      .filter(([name, handle]) => handle.kind === "directory")
      .map(([name]) => name);
    const files = entries.filter(([name, handle]) => handle.kind === "file").map(([name]) => name);
    return [directories, files];
  }

  async openFile(name) {
    const handle = await this.handle.getFileHandle(name);
    const file = await handle.getFile();
    return new JsWebFile(file);
  }
}

export class JsWebFile {
  constructor(file) {
    this.file = file;
  }

  async readAll() {
    const ab = await this.file.arrayBuffer();
    return new Uint8Array(ab);
  }

  async readSegment(offset, length) {
    const sliced = this.file.slice(offset, offset + length);
    const ab = await sliced.arrayBuffer();
    return new Uint8Array(ab);
  }
}
