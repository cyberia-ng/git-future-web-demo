use js_sys::JsString;
use rgit_core::{DirectoryError, Error};
use serde_wasm_bindgen::to_value;
use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(module = "/src/error.js")]
extern "C" {
    #[wasm_bindgen]
    fn make_rgit_error(message: JsString, inner: JsValue) -> JsValue;
}

pub fn to_js_error(err: Error) -> JsValue {
    use Error::*;
    match err {
        Directory(DirectoryError::NotFound(e)) => {
            let js_error = e.downcast::<JsValue>().unwrap();
            *js_error
        }
        Directory(DirectoryError::Other(e)) => {
            let js_error = e.downcast::<JsValue>().unwrap();
            *js_error
        }
        _ => match to_value(&err) {
            Ok(val) => make_rgit_error(JsString::from(format!("{:?}", err).as_str()), val),
            Err(val) => val.into(),
        },
    }
}
