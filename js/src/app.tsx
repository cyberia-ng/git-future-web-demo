import { useState } from "react";
import { WebRefName, WebRepo } from "../pkg/rgit_web";
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
          Refs:
          <Refs repo={repo} />
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
  | { type: "Branch"; value: Uint8Array }
  | { type: "Tag"; value: Uint8Array }
  | { type: "Remote"; value: Uint8Array }
  | { type: "Head" };
function Refs({ repo }: { repo: WebRepo }) {
  return (
    <Async
      deps={[repo]}
      repo={repo}
      component={async ({ repo }: { repo: WebRepo }) => {
        const refs: Array<WebRefName> = await repo.refs();
        const decoder = new TextDecoder();
        const names: Array<[string, string]> = refs
          .map((ref): RefName => ref.to_js())
          .map((name) => {
            switch (name.type) {
              case "Branch":
              case "Tag":
              case "Remote":
                return [name.type, decoder.decode(name.value)];
              case "Head":
                return [name.type, ""];
            }
          });
        return (
          <ul>
            {names.map(([type, name]) => (
              <li key={name}>
                {type}: {name}
              </li>
            ))}
          </ul>
        );
      }}
    />
  );
}
