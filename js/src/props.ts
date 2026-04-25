import type { AppState } from "./model/state";
import type { Mutator } from "./model/mutator";
import type { DerivedView, ViewModel } from "./model/view-model";
import type { EphemeralState } from "./model/ephemeral";

export type StandardProps<S = AppState, D = DerivedView, E = EphemeralState> = {
  view: ViewModel<S, D, E>;
  updateState: (mutator: Mutator<AppState>) => void;
};
