import init, { greet } from "../pkg/rgit_web.js";

async function run() {
  await init();
  greet("world");
}

window.onload = () => {
  run().catch(console.error);
};
