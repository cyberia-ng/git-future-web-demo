use js_sys::Uint8Array;
use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(typescript_custom_section)]
const TS_APPEND_CONTENT: &'static str = r#"
export type MaybeUtf8 = string | Uint8Array
"#;

pub trait MaybeUtf8 {
    fn maybe_utf8(&self) -> JsValue;
}

impl MaybeUtf8 for [u8] {
    fn maybe_utf8(&self) -> JsValue {
        match str::from_utf8(self) {
            Ok(s) => JsValue::from(s),
            Err(_) => Uint8Array::from(self).into(),
        }
    }
}
