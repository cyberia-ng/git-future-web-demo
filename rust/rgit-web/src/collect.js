export async function collect(iter) {
  const out = [];
  for await (const item of iter) {
    out.push(item);
  }
  return out;
}
