use wasm_bindgen::prelude::*;

mod diff;
mod directory;
mod error;
mod object;
mod reference;
mod repo;
mod impls;

#[wasm_bindgen]
pub fn set_panic_hook() {
    console_error_panic_hook::set_once();
}
