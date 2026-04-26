use js_sys::JsString;
use rgit_core::{error::Error, file_system::FilesystemError};
use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::*;

pub fn to_js_error(err: Error) -> JsValue {
    use Error::*;
    match err {
        FileSystem(FilesystemError::NotFound(e) | FilesystemError::Other(e)) => {
            let js_error = e.downcast::<JsValue>().unwrap();
            *js_error
        }
        Error::DiffCanceled => JsString::from("diff canceled").into(),
        _ => JsError::new(format!("{err:?}").as_str()).into(),
    }
}
