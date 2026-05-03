# A git repository browser in the browser

This is a demonstration of a new Rust library I wrote,
[git-async](https://crates.io/crates/git-async). It is a library for reading git
repositories, but in a filesystem-agnostic way. This means that it can be
integrated into one of the two
[web](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API)
[APIs](https://developer.mozilla.org/en-US/docs/Web/API/File_and_Directory_Entries_API)
for file system operations. It's a git browser in your web browser!

## Why?

The most widely-used git library, [libgit2](https://libgit2.org/), is tied to
the standard operating system file API. This means:

- It won't work with an asynchronous, event-based runtimes.
- It can't possibly work in the browser.

So I thought it would be interesting to write a git library that solved these
two issues. You could use [git-async](https://crates.io/crates/git-async) with a
virtual file-system, or any API that looks like a file-system. You could even
use it with S3 (although I don't recommend it).

I wrote this mostly for fun and to procrastinate doing work for my master's
degree.

## Can I use it?

Please do! The library is available at
[crates.io/crates/git-async](https://crates.io/crates/git-async). The
documentation is at [docs.rs/git-async](https://docs.rs/git-async/). It is
dual-licensed under MIT or Apache-2.0.

This web demo is licensed under the AGPL-3.0.
