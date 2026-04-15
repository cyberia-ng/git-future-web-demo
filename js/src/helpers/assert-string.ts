export function assertString(val: string | Uint8Array): string {
  if (typeof val !== "string") {
    throw new Error("Unexpected binary data");
  }
  return val;
}
