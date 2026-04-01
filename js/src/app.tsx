import { useState } from "react";
import { WebRepo } from "../pkg/rgit_web";
import { Async } from "./async";

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

type RefName =
  | { Branch: Uint8Array }
  | { Tag: Uint8Array }
  | { Remote: Uint8Array }
  | { Head: null };
function Branches({ repo }: { repo: WebRepo }) {
  return (
    <Async
      action={(): Promise<Array<RefName>> => repo.branches()}
      deps={[repo]}
      component={({ value }) => {
        const branches = value.flatMap((b) => ("Branch" in b ? [b.Branch] : []));
        const decoder = new TextDecoder();
        const branchNames = branches.map((nameBytes) => decoder.decode(nameBytes));
        return (
          <ul>
            {branchNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        );
      }}
    />
  );
}
