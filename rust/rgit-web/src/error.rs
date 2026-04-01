use rgit_core::error::Error;
use serde_wasm_bindgen::to_value;
use wasm_bindgen::JsValue;

pub fn to_js_error(err: Error) -> JsValue {
    use Error::*;
    match err {
        Directory(directory_error) => {
            let js_error = directory_error.0.downcast::<JsValue>().unwrap();
            *js_error
        }
        _ => match to_value(&err) {
            Ok(val) => val,
            Err(val) => val.into(),
        },
    }
}
