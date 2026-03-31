#![cfg_attr(not(test), no_std)]
extern crate alloc;
use alloc::string::String;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn set_panic_hook() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    let mut greeting = String::from("Hello, ");
    greeting.push_str(name);
    alert(&greeting);
}
