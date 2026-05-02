import init, {
  FullDiffFactory,
  Repo,
  set_panic_hook,
  TreeDiffFactory,
} from "../../pkg/git_future_web.js";
import { EntriesDirectory } from "../file-api/entries";
import { FSDirectory } from "../file-api/fs";
import type { DiffRequest, DiffResponse, Initialize } from "./types";

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
        serialized && pm({ type: "full diff", trees, serialized }, [serialized.buffer]);
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
  private tree_diff_factory?: TreeDiffFactory;
  private full_diff_factory?: FullDiffFactory;

  private constructor(private repo: Repo) { }

  static async init(directory: Initialize["directory"]) {
    let directory_: FSDirectory | EntriesDirectory;
    switch (directory.type) {
      case "handle": {
        directory_ = new FSDirectory(directory.handle);
        break;
      }
      case "file list": {
        directory_ = new EntriesDirectory(directory.entries, directory.rootName);
        break;
      }
    }
    await init();
    set_panic_hook();
    return new DiffWorker(await Repo.construct(directory_));
  }

  async diff([left, right]: [string, string]) {
    this.tree_diff_factory?.cancel();
    this.full_diff_factory?.cancel();
    try {
      const leftTree = (await this.repo.lookup_object(left)).tree();
      const rightTree = (await this.repo.lookup_object(right)).tree();
      this.tree_diff_factory = new TreeDiffFactory();
      const treeDiff = await this.tree_diff_factory.diff(this.repo, leftTree, rightTree);
      this.full_diff_factory = new FullDiffFactory();
      const diff = await this.full_diff_factory.from_tree_diff(this.repo, treeDiff);
      const serialized = diff.serialize();
      return serialized;
    } catch (e) {
      if (e === "diff canceled") {
        return undefined;
      } else {
        throw e;
      }
    }
  }
}
