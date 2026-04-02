use rgit_core::repo::Repo;
use wasm_bindgen::prelude::*;
use web_sys::{DomException, FileSystemDirectoryHandle};

use crate::{
    directory::WebDirectory,
    error::to_js_error,
    reference::{WebRef, WebRefName},
};

#[wasm_bindgen]
pub struct WebRepo(pub(crate) Repo<WebDirectory>);

#[wasm_bindgen]
impl WebRepo {
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
        Ok(Self(repo))
    }

    pub async fn head(&self) -> Result<WebRef, JsValue> {
        let head = self.0.head().await.map_err(to_js_error)?;
        Ok(WebRef(head))
    }

    pub async fn refs(&self) -> Result<Vec<WebRefName>, JsValue> {
        let refs = self.0.refs().await.map_err(to_js_error)?;
        Ok(refs.into_iter().map(WebRefName).collect())
    }
}
