use rgit_core::{directory::DirectoryError, error::Error};
use serde_wasm_bindgen::to_value;
use wasm_bindgen::JsValue;

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
            Ok(val) => val,
            Err(val) => val.into(),
        },
    }
}
