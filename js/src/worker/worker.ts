import init, { FullDiff, Repo, set_panic_hook, TreeDiff } from "../../pkg/rgit_web.js";
import type { DiffRequest, DiffResponse } from "./types";

onmessage = function onMessage(e: MessageEvent<DiffRequest>) {
  switch (e.data.type) {
    case "initialize": {
      DiffWorker.init(e.data.directory).then((w) => {
        worker = w;
        pm({ type: "ready" });
      });
      break;
    }
    case "request diff": {
      const trees = e.data.trees;
      worker.diff(trees).then((serialized) => {
        pm({ type: "full diff", trees, serialized }, [serialized.buffer]);
      });
      break;
    }
  }
};

function pm(message: DiffResponse, transfer?: Transferable[]) {
  if (transfer !== undefined) {
    postMessage(message, { transfer });
  } else {
    postMessage(message);
  }
}

let worker: DiffWorker;

class DiffWorker {
  private constructor(private repo: Repo) { }

  static async init(directory: FileSystemDirectoryHandle) {
    await init();
    set_panic_hook();
    return new DiffWorker(await Repo.construct(directory));
  }

  async diff([left, right]: [string, string]) {
    const leftTree = (await this.repo.lookup_object(left)).tree();
    const rightTree = (await this.repo.lookup_object(right)).tree();
    const treeDiff = await TreeDiff.diff(this.repo, leftTree, rightTree);
    const diff = await FullDiff.from_tree_diff(this.repo, treeDiff);
    const serialized = diff.serialize();
    return serialized;
  }
}
