export class FSFile {
  constructor(private file: File) {
    this.file = file;
  }

  async readAll() {
    const ab = await this.file.arrayBuffer();
    return new Uint8Array(ab);
  }

  async readSegment(offset: number, length: number) {
    const sliced = this.file.slice(offset, offset + length);
    const ab = await sliced.arrayBuffer();
    return new Uint8Array(ab);
  }
}
