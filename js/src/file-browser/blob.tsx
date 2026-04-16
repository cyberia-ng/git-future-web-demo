import type { StandardProps } from "../props";
import type { FileBrowserState } from "../state";
import type { BlobView } from "../view";
import { Highlight, themes } from "prism-react-renderer";

export function BlobComponent({ view, updateState }: StandardProps<FileBrowserState, BlobView>) {
  let content: { type: "text"; content: string } | { type: "binary"; content: Uint8Array };
  if (typeof view.model.content === "string") {
    content = { type: "text", content: view.model.content };
  } else {
    content = { type: "binary", content: view.model.content };
  }
  switch (content.type) {
    case "text": {
      const filenameSplit = view.state.path[view.state.path.length - 1]!.split(".");
      const extension = filenameSplit[filenameSplit.length - 1];
      const language = extension === undefined ? "" : (EXTENSIONS[extension] ?? "");
      const nLines = content.content.split("\n").length;
      const maxDigits = Math.ceil(Math.log10(nLines + 1));
      return (
        <Highlight code={content.content} language={language} theme={themes.gruvboxMaterialDark}>
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <div
              style={style}
              className="container-fluid rounded overflow-hidden font-monospace whitespace-pre-wrap"
            >
              {tokens.map((line, idx) => (
                <div key={idx} className="row">
                  <div
                    className="col text-end user-select-none text-secondary bg-body-tertiary"
                    style={{
                      maxWidth: `calc(${maxDigits}ch + var(--bs-gutter-x))`,
                      ...(idx === 0 ? { paddingTop: ".5rem" } : {}),
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div className="col" style={idx === 0 ? { paddingTop: ".5rem" } : {}}>
                    <div {...getLineProps({ line })}>
                      {line.map((token, idx) => (
                        <span key={idx} {...getTokenProps({ token })} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Highlight>
      );
    }
    case "binary":
      return <div className="alert alert-warning">Binary data</div>;
  }
}

const EXTENSIONS: Record<string, string> = {
  html: "markup",
  jsx: "jsx",
  tsx: "tsx",
  swift: "swift",
  kt: "kotlin",
  kts: "kotlin",
  ktm: "kotlin",
  m: "objectivec",
  ts: "js",
  js: "js",
  cjs: "js",
  mjs: "js",
  re: "reason",
  rei: "reason",
  rs: "rust",
  graphql: "graphql",
  gql: "graphql",
  yaml: "yaml",
  yml: "yaml",
  go: "go",
  c: "cpp",
  h: "cpp",
  cpp: "cpp",
  md: "markdown",
  py: "python",
  json: "json",
};
