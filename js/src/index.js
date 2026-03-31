import init, { WebRepo } from "../pkg/rgit_web.js";

window.onload = () => {
  init().catch(console.error);
  document.querySelector('#open').addEventListener('click', () => {
    openRepo().catch(console.error);
  })
};

async function openRepo() {
  const handle = await window.showDirectoryPicker();
  const repo = await WebRepo.construct(handle);
  window.repo = repo;
}
