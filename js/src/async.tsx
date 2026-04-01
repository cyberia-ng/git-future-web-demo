import { createElement, useEffect, useState } from "react";

export type AsyncResult<T> =
  | { type: "loading" }
  | { type: "error"; error: unknown }
  | { type: "success"; value: T };
export function useAsync<T>(p: () => Promise<T>, deps: React.DependencyList): AsyncResult<T> {
  const [state, setState] = useState<AsyncResult<T>>({ type: "loading" });
  useEffect(() => {
    p()
      .then((value) => setState({ type: "success", value }))
      .catch((error) => setState({ type: "error", error }));
  }, deps);
  return state;
}

export function Async<T>({
  action,
  component,
  deps,
}: {
  action: () => Promise<T>;
  component: React.FunctionComponent<{ value: T }>;
  deps: React.DependencyList;
}) {
  const result = useAsync(action, deps);
  if (result.type === "loading") {
    return <>Loading...</>;
  }
  if (result.type === "error") {
    if (result.error instanceof Error) {
      return <>Error: {result.error.message} </>;
    } else {
      return <>Error: non - Error error </>;
    }
  }
  if (result.type === "success") {
    return createElement(component, { value: result.value });
  }
}
