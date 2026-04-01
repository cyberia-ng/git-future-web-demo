import { useEffect, useState } from "react";
import { WebRepo } from "../pkg/rgit_web";

export function App() {
  const [repo, setRepo] = useState<WebRepo | null | Error>(null);
  async function openRepo() {
    const handle = await window.showDirectoryPicker();
    const repo = await WebRepo.construct(handle);
    setRepo(repo);
  }
  let content = null;
  if (repo !== null) {
    if (repo instanceof Error) {
      content = <div>Error: {repo.message}</div>;
    } else {
      content = (
        <div>
          Branches:
          <Branches repo={repo} />
        </div>
      );
    }
  }
  return (
    <>
      <div>
        <button onClick={() => openRepo().catch(setRepo)}>Open</button>
      </div>
      {content}
    </>
  );
}

type AsyncResult<T> =
  | { type: "loading" }
  | { type: "error"; error: unknown }
  | { type: "success"; value: T };
function useAsync<T>(p: () => Promise<T>, deps: React.DependencyList): AsyncResult<T> {
  const [state, setState] = useState<AsyncResult<T>>({ type: "loading" });
  useEffect(() => {
    p()
      .then((value) => setState({ type: "success", value }))
      .catch((error) => setState({ type: "error", error }));
  }, deps);
  return state;
}

type RefName =
  | { Branch: Uint8Array }
  | { Tag: Uint8Array }
  | { Remote: Uint8Array }
  | { Head: null };
export function Branches({ repo }: { repo: WebRepo }) {
  const branchesR = useAsync<Array<RefName>>(() => repo.branches(), [repo]);
  if (branchesR.type === "loading") return <>Loading...</>;
  if (branchesR.type === "error") {
    if (branchesR.error instanceof Error) {
      return <>Error: {branchesR.error.message}</>;
    } else {
      return <>Error: non-Error error</>;
    }
  }
  if (branchesR.type === "success") {
    const branches = branchesR.value.flatMap((b) => ("Branch" in b ? [b.Branch] : []));
    const decoder = new TextDecoder();
    const branchNames = branches.map((nameBytes) => decoder.decode(nameBytes));
    return (
      <ul>
        {branchNames.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    );
  }
}
