use rgit_core::repo::Repo;
use serde_wasm_bindgen::to_value;
use wasm_bindgen::prelude::*;
use web_sys::{DomException, FileSystemDirectoryHandle};

use crate::{directory::WebDirectory, error::to_js_error};

mod directory;
mod error;

#[wasm_bindgen]
pub fn set_panic_hook() {
    console_error_panic_hook::set_once();
}

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
    pub async fn branches(&self) -> Result<JsValue, JsValue> {
        let branches = self.repo.branches().await.map_err(to_js_error)?;
        Ok(to_value(&branches)?)
    }
}
