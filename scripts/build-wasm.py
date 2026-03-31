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

args = p.parse_args()

cargo_cmd = ["cargo", "build", "--target", "wasm32-unknown-unknown"]
if args.release:
    cargo_cmd.append("--release")
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
            "release" if args.release else "debug",
            "rgit_web.wasm",
        ),
        "--out-dir",
        join(js_dir, "pkg"),
        "--target",
        "web",
    ],
    cwd=root_dir,
    check=True,
)

if args.release:
    run(
        [
            "wasm-opt",
            join(js_dir, "pkg", "rgit_web_bg.wasm"),
            "-O3",
            "-o",
            join(js_dir, "pkg", "rgit_web_bg.wasm"),
        ],
        cwd=root_dir,
        check=True,
    )
