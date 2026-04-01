use rgit_core::repo::Repo;
use serde_wasm_bindgen::to_value;
use wasm_bindgen::prelude::*;
use web_sys::{DomException, FileSystemDirectoryHandle};

use crate::{directory::WebDirectory, error::to_js_error, reference::WebRef};

#[wasm_bindgen]
pub struct WebRepo {
    repo: Repo<WebDirectory>,
}

#[wasm_bindgen]
impl WebRepo {
    #[wasm_bindgen]
    pub async fn construct(handle: FileSystemDirectoryHandle) -> Result<Self, JsValue> {
        let handle: FileSystemDirectoryHandle = match handle.get_file_handle("HEAD").await {
            Ok(_) => handle,
            Err(e) => {
                let e: DomException = e.dyn_into()?;
                if e.name() == "NotFoundError" {
                    handle.get_directory_handle(".git").await?.dyn_into()?
                } else {
                    return Err(e.into());
                }
            }
        };
        let repo = Repo::new(WebDirectory::new(&handle));
        Ok(Self { repo })
    }

    #[wasm_bindgen]
    pub async fn head(&self) -> Result<WebRef, JsValue> {
        let head = self.repo.head().await.map_err(to_js_error)?;
        Ok(WebRef::new(head))
    }

    #[wasm_bindgen]
    pub async fn refs(&self) -> Result<Vec<JsValue>, JsValue> {
        let refs = self.repo.refs().await.map_err(to_js_error)?;
        let mut out = Vec::new();
        for reference in refs.iter() {
            let reference = to_value(reference)?;
            out.push(reference);
        }
        Ok(out)
    }
}
