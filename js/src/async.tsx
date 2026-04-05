import { useEffect, useState } from "react";

export function Async<P = {}>({
  component,
  deps,
  ...props
}: {
  component: (props: Omit<P, "component" | "deps">) => Promise<React.ReactNode>;
  deps?: React.DependencyList;
} & P) {
  const resolvedDeps = deps ?? Object.values(props);
  const [child, setChild] = useState<React.ReactNode>(<>Loading...</>);
  useEffect(() => {
    component(props)
      .then(setChild)
      .catch((e) => {
        if (e instanceof Error) {
          setChild(<>Error: {e.message}</>);
        } else {
          console.log(e);
          setChild(<>Error: non-Error error</>);
        }
      });
  }, resolvedDeps);
  return child;
}
