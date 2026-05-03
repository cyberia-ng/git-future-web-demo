import { createRoot } from "react-dom/client";
import init, { set_panic_hook } from "../pkg/git_async_web.js";
import { App } from "./app";
import { createElement, StrictMode } from "react";

window.onload = () => {
  init()
    .then(() => set_panic_hook())
    .catch(console.error);
  const root = createRoot(document.querySelector("#react-root")!);
  const repoControlElement = document.querySelector("#repo-control")!;
  const node = createElement(
    StrictMode,
    {},
    createElement(App, { repoControl: repoControlElement }),
  );
  root.render(node);
};
