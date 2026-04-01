import { createRoot } from "react-dom/client";
import init, { set_panic_hook } from "../pkg/rgit_web.js";
import { App } from "./app";
import { createElement } from "react";

window.onload = () => {
  init()
    .then(() => set_panic_hook())
    .catch(console.error);
  const root = createRoot(document.querySelector("#react-root")!);
  const node = createElement(App);
  root.render(node);
};
