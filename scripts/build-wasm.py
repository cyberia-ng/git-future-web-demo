#!/usr/bin/env python

from subprocess import run
from os.path import join, realpath, dirname
from argparse import ArgumentParser

root_dir = realpath(join(dirname(__file__), ".."))
rust_dir = join(root_dir, "rust")
js_dir = join(root_dir, "js")

p = ArgumentParser()
p.add_argument(
    "--release",
    action="store_true",
    help="Build in release mode (default: debug build)",
)
p.add_argument(
    "--perf",
    action="store_true",
    help="Build in perf mode (like release but with debug symbols)",
)

args = p.parse_args()

cargo_cmd = ["cargo", "build", "--target", "wasm32-unknown-unknown"]
if args.release:
    cargo_cmd.append("--release")
if args.perf:
    cargo_cmd.append("--profile=perf")
run(
    cargo_cmd,
    cwd=rust_dir,
    check=True,
)

run(
    [
        "wasm-bindgen",
        join(
            rust_dir,
            "target",
            "wasm32-unknown-unknown",
            "release" if args.release else "perf" if args.perf else "debug",
            "git_future_web.wasm",
        ),
        "--out-dir",
        join(js_dir, "pkg"),
        "--target",
        "web",
    ],
    cwd=root_dir,
    check=True,
)

if args.release or args.perf:
    if args.perf:
        opts = ["-g"]
    else:
        opts = []
    run(
        [
            "wasm-opt",
            join(js_dir, "pkg", "git_future_web_bg.wasm"),
            "-O3",
            *opts,
            "-o",
            join(js_dir, "pkg", "git_future_web_bg.wasm"),
        ],
        cwd=root_dir,
        check=True,
    )
