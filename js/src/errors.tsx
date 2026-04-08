import { dismissError, type ErrorState, type Mutator } from "./state";

export function Errors({
  state,
  updateErrorState,
}: {
  state: ErrorState;
  updateErrorState: (mutator: Mutator<ErrorState>) => void;
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
