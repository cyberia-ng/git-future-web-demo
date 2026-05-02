use git_async::{error::Error, file_system::FileSystemError};
use js_sys::JsString;
use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::*;

pub fn to_js_error(err: Error) -> JsValue {
    use Error::*;
    match err {
        FileSystem(FileSystemError::NotFound(e) | FileSystemError::Other(e)) => {
            let js_error = e.downcast::<JsValue>().unwrap();
            *js_error
        }
        Error::DiffCanceled => JsString::from("diff canceled").into(),
        _ => JsError::new(format!("{err:?}").as_str()).into(),
    }
}
