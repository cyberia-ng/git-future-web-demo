use rgit_core::{error::Error, file_system::FilesystemError};
use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::*;

pub fn to_js_error(err: Error) -> JsValue {
    use Error::*;
    match err {
        FileSystem(FilesystemError::NotFound(e)) => {
            let js_error = e.downcast::<JsValue>().unwrap();
            *js_error
        }
        FileSystem(FilesystemError::Other(e)) => {
            let js_error = e.downcast::<JsValue>().unwrap();
            *js_error
        }
        _ => JsError::new(format!("{err:?}").as_str()).into(),
    }
}
