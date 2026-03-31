use std::any::Any;

use js_sys::{
    Array, ArrayBuffer, AsyncIterator, Function, Promise, Reflect, TypeError, Uint8Array,
};
use rgit_core::directory::{Directory, DirectoryError};
use wasm_bindgen::prelude::*;
use web_sys::{File, FileSystemDirectoryHandle, FileSystemFileHandle};

#[wasm_bindgen(module = "/src/collect.js")]
extern "C" {
    #[wasm_bindgen]
    fn collect(this: &AsyncIterator) -> Promise;
}

#[derive(Debug, Clone)]
pub struct WebDirectory {
    handle: web_sys::FileSystemDirectoryHandle,
}

impl WebDirectory {
    pub fn new(handle: &web_sys::FileSystemDirectoryHandle) -> Self {
        Self {
            handle: handle.clone(),
        }
    }
}

fn to_directory_error<T: Any>(value: T) -> DirectoryError {
    DirectoryError(Box::new(value))
}

impl Directory for WebDirectory {
    async fn open_subdir(&self, name: &[u8]) -> Result<Self, DirectoryError> {
        let handle = self
            .handle
            .get_directory_handle(str::from_utf8(name).map_err(to_directory_error)?)
            .await
            .map_err(to_directory_error)?;
        let handle: FileSystemDirectoryHandle = handle
            .dyn_into()
            .map_err(|_| TypeError::new("FileSystemDirectoryHandle"))
            .map_err(to_directory_error)?;
        Ok(Self { handle })
    }

    async fn list_dir(&self) -> Result<Vec<Vec<u8>>, DirectoryError> {
        let keys_fn: Function = Reflect::get(&self.handle, &JsValue::from("keys"))
            .map_err(|_| TypeError::new("FileSystemDirectoryHandle.keys was missing"))
            .map_err(to_directory_error)?
            .dyn_into()
            .map_err(|_| TypeError::new("FileSystemDirectoryHandle.keys was not a function"))
            .map_err(to_directory_error)?;
        let keys_iter: AsyncIterator = Reflect::apply(&keys_fn, &self.handle, &Array::new())
            .map_err(to_directory_error)?
            .dyn_into()
            .map_err(|_| TypeError::new(".keys() was not an AsyncIterator"))
            .map_err(to_directory_error)?;

        let collect_res = collect(&keys_iter);
        let collected: Array = collect_res
            .await
            .map_err(to_directory_error)?
            .unchecked_into();
        let mut out = Vec::new();
        for val in collected {
            let val = val
                .as_string()
                .ok_or_else(|| TypeError::new(".keys() value was not a string"))
                .map_err(to_directory_error)?
                .as_bytes()
                .to_vec();
            out.push(val);
        }
        Ok(out)
    }

    async fn read_file(&self, name: &[u8]) -> Result<Vec<u8>, DirectoryError> {
        let handle = self
            .handle
            .get_file_handle(str::from_utf8(name).map_err(to_directory_error)?)
            .await
            .map_err(to_directory_error)?;
        let handle: FileSystemFileHandle = handle
            .dyn_into()
            .map_err(|_| TypeError::new("FileSystemFileHandle"))
            .map_err(to_directory_error)?;
        let file: File = handle
            .get_file()
            .await
            .map_err(to_directory_error)?
            .dyn_into()
            .map_err(|_| TypeError::new("File"))
            .map_err(to_directory_error)?;
        let data: ArrayBuffer = file
            .array_buffer()
            .await
            .map_err(to_directory_error)?
            .dyn_into()
            .map_err(|_| TypeError::new("ArrayBuffer"))
            .map_err(to_directory_error)?;
        let data = Uint8Array::new(&data);
        let mut out = vec![0u8; data.length() as usize];
        data.copy_to(&mut out);
        Ok(out)
    }
}
