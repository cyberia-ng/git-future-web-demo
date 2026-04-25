import { dismissError, type EphemeralState } from "./model/ephemeral";
import type { Mutator } from "./model/mutator";

export function Errors({
  state,
  updateErrorState,
}: {
  state: EphemeralState["errors"];
  updateErrorState: (mutator: Mutator<EphemeralState>) => void;
}) {
  return (
    <>
      {state.messages.map((message, idx) => (
        <div key={idx} className="alert alert-danger alert-dismissible" role="alert">
          {message}
          <button
            type="button"
            className="btn-close"
            aria-label="close"
            onClick={() => updateErrorState(dismissError(idx))}
          />
        </div>
      ))}
    </>
  );
}
