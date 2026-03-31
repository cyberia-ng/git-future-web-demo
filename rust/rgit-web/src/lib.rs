use js_sys::{Array, Uint8Array};
use rgit_core::{reference::RefName, repo::Repo};
use wasm_bindgen::prelude::*;
use web_sys::{DomException, FileSystemDirectoryHandle};

use crate::directory::WebDirectory;

mod directory;

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
    pub async fn branches(&self) -> Result<Array, JsValue> {
        let branches = self
            .repo
            .branches()
            .await
            .map_err(|e| js_sys::Error::new(&format!("{:?}", e)))?;
        Ok(branches
            .into_iter()
            .map(|branch| {
                let branch = match branch {
                    RefName::Branch(branch) => branch,
                    _ => unreachable!(),
                };
                Uint8Array::new_from_slice(&branch)
            })
            .collect())
    }
}
