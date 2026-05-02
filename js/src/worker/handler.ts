import { FullDiff } from "../../pkg/git_future_web";
import type { DiffRequest, DiffResponse, Initialize } from "./types";

export type DiffWorkerArgs = Initialize["directory"];

export class DiffWorkerHandle {
  private handle: Worker;
  private listener?: (serialized: Uint8Array) => void;

  private constructor(
    directory: DiffWorkerArgs,
    private onWorkerReady: () => void,
  ) {
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
        if (this.listener !== undefined) {
          this.listener(e.data.serialized);
        }
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
      this.listener = (serialized: Uint8Array) => {
        const diff = FullDiff.deserialize(serialized);
        res(diff);
      };
      this.pm({ type: "request diff", trees });
    });
  }
}
