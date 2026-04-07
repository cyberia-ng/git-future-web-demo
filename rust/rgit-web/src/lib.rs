use wasm_bindgen::prelude::*;

mod directory;
mod error;
mod object;
mod reference;
mod repo;

#[wasm_bindgen]
pub fn set_panic_hook() {
    console_error_panic_hook::set_once();
}
