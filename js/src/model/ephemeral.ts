import type { AppState } from "./state";
import type { Mutator } from "./mutator";
import type { DerivedView } from "./view-model";
import type { FullDiff } from "../../pkg/git_future_web";

export type EphemeralState = {
  errors: ErrorState;
  diff:
  | undefined
  | { type: "loading"; trees: [string, string] }
  | { type: "loaded"; diff: FullDiff };
};

export const emptyEphemeralState: EphemeralState = {
  errors: {
    messages: [],
  },
  diff: undefined,
};

export type ErrorState = {
  messages: string[];
};

export const resetEphemeral: Mutator<EphemeralState> = () => emptyEphemeralState;

export function addError(message: string): Mutator<EphemeralState> {
  return (draft) => {
    draft.errors.messages.push(message);
  };
}

export function dismissError(idx: number): Mutator<EphemeralState> {
  return (draft) => {
    draft.errors.messages = [
      ...draft.errors.messages.slice(0, idx),
      ...draft.errors.messages.slice(idx + 1),
    ];
  };
}

export function receiveDiff(trees: [string, string], diff: FullDiff): Mutator<EphemeralState> {
  return (draft) => {
    if (draft.diff?.type !== "loading") {
      return draft;
    }
    if (trees[0] !== draft.diff.trees[0] || trees[1] !== draft.diff.trees[1]) {
      return draft;
    }
    draft.diff = { type: "loaded", diff };
  };
}
