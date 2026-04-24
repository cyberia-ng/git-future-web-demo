#![warn(clippy::pedantic)]
#![allow(clippy::missing_errors_doc)]
#![allow(clippy::enum_glob_use)]
#![allow(clippy::must_use_candidate)]
#![allow(clippy::missing_panics_doc)]

use wasm_bindgen::prelude::*;

mod diff;
mod directory;
mod error;
mod impls;
mod js_interop;
mod object;
mod reference;
mod repo;

#[wasm_bindgen]
pub fn set_panic_hook() {
    console_error_panic_hook::set_once();
}
