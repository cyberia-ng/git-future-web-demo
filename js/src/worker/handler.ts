import { FullDiff } from "../../pkg/rgit_web";
import type { DiffRequest, DiffResponse } from "./types";

export type DiffWorkerArgs = {
  directory: FileSystemDirectoryHandle;
};

export class DiffWorkerHandle {
  private handle: Worker;
  private listeners: Map<string, (serialized: Uint8Array) => void>;

  private constructor(
    { directory }: DiffWorkerArgs,
    private onWorkerReady: () => void,
  ) {
    this.listeners = new Map();
    this.handle = new Worker(new URL("worker.ts", import.meta.url));
    this.handle.onmessage = this.handleMessage.bind(this);
    this.pm({ type: "initialize", directory });
  }

  private pm(message: DiffRequest, transfers?: Transferable[]) {
    if (transfers !== undefined) {
      this.handle.postMessage(message, transfers);
    } else {
      this.handle.postMessage(message);
    }
  }

  private handleMessage(e: MessageEvent<DiffResponse>) {
    switch (e.data.type) {
      case "ready": {
        this.onWorkerReady();
        break;
      }
      case "full diff": {
        const listenerKey = e.data.trees[0] + e.data.trees[1];
        const cb = this.listeners.get(listenerKey);
        if (cb !== undefined) cb(e.data.serialized);
        this.listeners.delete(listenerKey);
        break;
      }
    }
  }

  static async init(args: DiffWorkerArgs): Promise<DiffWorkerHandle> {
    return new Promise((res) => {
      const handle = new DiffWorkerHandle(args, () => {
        res(handle);
      });
    });
  }

  close() {
    this.handle.terminate();
  }

  async diff(trees: [string, string]): Promise<FullDiff> {
    return new Promise((res) => {
      const listenerKey = trees[0] + trees[1];
      this.listeners.set(listenerKey, (serialized: Uint8Array) => {
        const diff = FullDiff.deserialize(serialized);
        res(diff);
      });
      this.pm({ type: "request diff", trees });
    });
  }
}
