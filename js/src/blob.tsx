import type { StandardProps } from "./props";
import type { BlobView } from "./view";

export function BlobComponent({ state, view, updateState }: StandardProps<BlobView>) {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let content: { type: "text"; content: string } | { type: "binary"; content: Uint8Array };
  try {
    content = { type: "text", content: decoder.decode(view.content) };
  } catch (e) {
    if (e instanceof TypeError) {
      content = { type: "binary", content: view.content };
    } else {
      throw e;
    }
  }
  switch (content.type) {
    case "text": {
      const lines = content.content.split("\n");
      return (
        <div className="container">
          {lines.map((line, idx) => (
            <div className="row">
              <div className="col-1 text-end user-select-none text-secondary">{idx + 1}</div>
              <div className="col font-monospace" key={idx}>
                {line}
              </div>
            </div>
          ))}
        </div>
      );
    }
    case "binary":
      return <div className="alert alert-warning">Binary data</div>;
  }
}
