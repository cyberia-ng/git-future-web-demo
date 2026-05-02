import { FSFile } from "./file";

export class EntriesDirectory {
  constructor(
    private files: File[],
    private subPath: string = "",
  ) {
    if (subPath.length !== 0 && !subPath.endsWith("/")) {
      this.subPath = subPath + "/";
    }
  }

  async openSubdir(name: string) {
    const targetPath = this.subPath + name + "/";
    return new EntriesDirectory(
      this.files.filter((file) => file.webkitRelativePath.startsWith(targetPath)),
      targetPath,
    );
  }

  async listDir() {
    const subFiles = this.files.filter((file) => file.webkitRelativePath.startsWith(this.subPath));
    const directories: Set<string> = new Set();
    const files: string[] = [];
    for (const subFile of subFiles) {
      const relPath = subFile.webkitRelativePath.slice(this.subPath.length);
      const [firstComponent, ...rest] = relPath.split("/");
      if (firstComponent === undefined) {
        continue;
      }
      if (rest.length !== 0) {
        directories.add(firstComponent);
      } else {
        files.push(firstComponent);
      }
    }
    return [Array.from(directories), files];
  }

  async openFile(name: string) {
    const targetPath = this.subPath + name;
    const file = this.files.find((file) => file.webkitRelativePath === targetPath);
    if (file === undefined) {
      throw new Error("file not found");
    }
    return new FSFile(file);
  }
}
