use js_sys::{
    Array, ArrayBuffer, AsyncIterator, Function, JsString, Promise, Reflect, TypeError, Uint8Array,
};
use rgit_core::directory::{DirEntry, Directory, DirectoryError, File};
use wasm_bindgen::prelude::*;
use web_sys::{DomException, FileSystemDirectoryHandle, FileSystemFileHandle};

#[wasm_bindgen(module = "/src/collect.js")]
extern "C" {
    #[wasm_bindgen]
    fn collect(this: &AsyncIterator) -> Promise;
}

#[derive(Debug, Clone)]
pub struct WebDirectory {
    handle: web_sys::FileSystemDirectoryHandle,
}

#[derive(Debug)]
pub struct WebFile {
    file: web_sys::File,
}

impl WebDirectory {
    pub fn new(handle: &web_sys::FileSystemDirectoryHandle) -> Self {
        Self {
            handle: handle.clone(),
        }
    }
}

fn to_directory_error(value: JsValue) -> DirectoryError {
    if value.has_type::<DomException>()
        && Reflect::get(&value, &JsValue::from("name")).unwrap() == JsValue::from("NotFoundError")
    {
        DirectoryError::NotFound(Box::new(value))
    } else {
        DirectoryError::Other(Box::new(value))
    }
}

impl Directory for WebDirectory {
    type File = WebFile;

    async fn open_subdir(&self, name: &[u8]) -> Result<Self, DirectoryError> {
        let f = async || -> Result<Self, JsValue> {
            let handle = self
                .handle
                .get_directory_handle(
                    str::from_utf8(name).map_err(|_| TypeError::new("name was not UTF-8"))?,
                )
                .await?;
            let handle: FileSystemDirectoryHandle = handle.dyn_into()?;
            Ok(Self { handle })
        };
        f().await.map_err(to_directory_error)
    }

    async fn list_dir(&self) -> Result<Vec<DirEntry>, DirectoryError> {
        let f = async || -> Result<Vec<DirEntry>, JsValue> {
            let entries_fn: Function =
                Reflect::get(&self.handle, &JsValue::from("entries"))?.dyn_into()?;
            let entries_iter: AsyncIterator =
                Reflect::apply(&entries_fn, &self.handle, &Array::new())?.dyn_into()?;

            let collect_res = collect(&entries_iter);
            let collected: Array = collect_res.await?.dyn_into()?;
            let mut out = Vec::new();
            for val in collected {
                let val: Array = val.dyn_into()?;
                let name = val.at(0).as_string().ok_or_else(|| {
                    TypeError::new(
                        "FileSystemDirectoryHandle.entries() did not yield [string, _] pair",
                    )
                })?;
                let kind: JsString =
                    Reflect::get(&val.at(1), &JsValue::from("kind"))?.dyn_into()?;
                if kind == JsString::from("file") {
                    out.push(DirEntry::File(name.into_bytes()));
                } else if kind == JsString::from("directory") {
                    out.push(DirEntry::Directory(name.into_bytes()));
                }
            }
            Ok(out)
        };
        f().await.map_err(to_directory_error)
    }

    async fn open_file(&self, name: &[u8]) -> Result<Self::File, DirectoryError> {
        let f = async || -> Result<Self::File, JsValue> {
            let handle = self
                .handle
                .get_file_handle(
                    str::from_utf8(name).map_err(|_| TypeError::new("name was not UTF-8"))?,
                )
                .await?;
            let handle: FileSystemFileHandle = handle.dyn_into()?;
            let file: web_sys::File = handle.get_file().await?.dyn_into()?;
            Ok(WebFile { file })
        };
        f().await.map_err(to_directory_error)
    }
}

impl File for WebFile {
    async fn read_all(&mut self) -> Result<Vec<u8>, DirectoryError> {
        let f = async || -> Result<Vec<u8>, JsValue> {
            let data: ArrayBuffer = self.file.array_buffer().await?.dyn_into()?;
            let data = Uint8Array::new(&data);
            let mut out = vec![0u8; data.length() as usize];
            data.copy_to(&mut out);
            Ok(out)
        };
        f().await.map_err(to_directory_error)
    }

    async fn read_segment(
        &mut self,
        offset: u64,
        dest: &mut [u8],
    ) -> Result<usize, DirectoryError> {
        todo!()
    }
}
