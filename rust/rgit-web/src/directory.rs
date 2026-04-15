use js_sys::{Array, JsString, Promise, Reflect, TypeError, Uint8Array};
use rgit_core::directory::{DirEntry, Directory, DirectoryError, File, Offset};
use wasm_bindgen::prelude::*;
use web_sys::{DomException, FileSystemDirectoryHandle};

#[wasm_bindgen(module = "/src/directory.js")]
extern "C" {
    #[wasm_bindgen]
    fn constructDirectory(handle: &FileSystemDirectoryHandle) -> Promise;

    type JsWebDirectory;
    #[wasm_bindgen(method)]
    fn openSubdir(this: &JsWebDirectory, name: &str) -> Promise;
    #[wasm_bindgen(method)]
    fn listDir(this: &JsWebDirectory) -> Promise;
    #[wasm_bindgen(method)]
    fn openFile(this: &JsWebDirectory, name: &str) -> Promise;

    type JsWebFile;
    #[wasm_bindgen(method)]
    fn readAll(this: &JsWebFile) -> Promise;
    #[wasm_bindgen(method)]
    fn readSegment(this: &JsWebFile, offset: f64, length: f64) -> Promise;
}

pub struct WebDirectory {
    directory: JsWebDirectory,
}

impl Clone for WebDirectory {
    fn clone(&self) -> Self {
        Self {
            directory: self.directory.clone().dyn_into().unwrap(),
        }
    }
}

pub struct WebFile {
    file: JsWebFile,
}

impl WebDirectory {
    pub async fn new(handle: &web_sys::FileSystemDirectoryHandle) -> Result<Self, JsValue> {
        let js_directory: JsWebDirectory = constructDirectory(handle).await?.dyn_into()?;
        Ok(Self {
            directory: js_directory,
        })
    }
}

fn to_directory_error(value: JsValue) -> DirectoryError {
    if value.has_type::<DomException>()
        && Reflect::get(&value, &JsValue::from("name")).unwrap() == "NotFoundError"
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
            let subdir: JsWebDirectory = self
                .directory
                .openSubdir(str::from_utf8(name).map_err(|_| TypeError::new("name was not UTF-8"))?)
                .await?
                .dyn_into()?;
            Ok(Self { directory: subdir })
        };
        f().await.map_err(to_directory_error)
    }

    async fn list_dir(&self) -> Result<Vec<DirEntry>, DirectoryError> {
        let f = async || -> Result<Vec<DirEntry>, JsValue> {
            let entries: Array = self.directory.listDir().await?.dyn_into()?;
            let directories: Array = entries.at(0).dyn_into()?;
            let files: Array = entries.at(1).dyn_into()?;
            let mut out: Vec<DirEntry> = Vec::new();
            for name in directories {
                let name: JsString = name.dyn_into()?;
                let name: String = name.into();
                let name: Vec<u8> = name.into_bytes();
                out.push(DirEntry::Directory(name));
            }
            for name in files {
                let name: JsString = name.dyn_into()?;
                let name: String = name.into();
                let name: Vec<u8> = name.into_bytes();
                out.push(DirEntry::File(name));
            }
            Ok(out)
        };
        f().await.map_err(to_directory_error)
    }

    async fn open_file(&self, name: &[u8]) -> Result<Self::File, DirectoryError> {
        let f = async || -> Result<Self::File, JsValue> {
            let js_file: JsWebFile = self
                .directory
                .openFile(str::from_utf8(name).map_err(|_| TypeError::new("name was not UTF-8"))?)
                .await?
                .dyn_into()?;
            Ok(WebFile { file: js_file })
        };
        f().await.map_err(to_directory_error)
    }
}

impl File for WebFile {
    async fn read_all(&mut self) -> Result<Vec<u8>, DirectoryError> {
        let f = async || -> Result<Vec<u8>, JsValue> {
            let data: Uint8Array = self.file.readAll().await?.dyn_into()?;
            let mut out = vec![0u8; data.length() as usize];
            data.copy_to(&mut out);
            Ok(out)
        };
        f().await.map_err(to_directory_error)
    }

    async fn read_segment(
        &mut self,
        offset: Offset,
        dest: &mut [u8],
    ) -> Result<usize, DirectoryError> {
        let mut f = async || -> Result<usize, JsValue> {
            if offset.0 > 2u64.pow(53) {
                panic!("offset not representable as f64");
            }
            let offset = offset.0 as f64;
            if dest.len() as u64 > 2u64.pow(53) {
                panic!("length not representable as f64");
            }
            let length = dest.len() as f64;
            let data: Uint8Array = self.file.readSegment(offset, length).await?.dyn_into()?;
            let bytes_read = data.length() as usize;
            data.copy_to(&mut dest[0..bytes_read]);
            Ok(bytes_read)
        };
        f().await.map_err(to_directory_error)
    }
}
