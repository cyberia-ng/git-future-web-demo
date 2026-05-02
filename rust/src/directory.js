export class DirectoryWrapper {
  constructor(inner) {
    this.inner = inner;
  }

  async openSubdir(name) {
    return new DirectoryWrapper(await this.inner.openSubdir(name));
  }

  listDir() {
    return this.inner.listDir();
  }

  async openFile(name) {
    return new FileWrapper(await this.inner.openFile(name));
  }
}

export class FileWrapper {
  constructor(inner) {
    this.inner = inner;
  }

  readAll() {
    return this.inner.readAll();
  }

  readSegment(offset, length) {
    return this.inner.readSegment(offset, length);
  }
}
