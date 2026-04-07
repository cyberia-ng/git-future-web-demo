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
    case "text":
      return <pre>{content.content}</pre>;
    case "binary":
      return <>Binary data</>;
  }
}
