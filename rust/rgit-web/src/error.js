class RGitError extends Error {
  constructor(message, inner) {
    super(message);
    this.inner = inner;
  }
}

export function make_rgit_error(message, inner) {
  return new RGitError(message, inner)
}
