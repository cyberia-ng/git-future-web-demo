use js_sys::{JsString, TypeError};
use rgit_core::{Repo, object::ObjectId};
use serde_wasm_bindgen::from_value;
use wasm_bindgen::prelude::*;
use web_sys::{DomException, FileSystemDirectoryHandle};

use crate::{
    directory::WebDirectory,
    error::to_js_error,
    impls::WebGenerics,
    object::WebObject,
    reference::{WebRef, WebRefName},
};

#[wasm_bindgen]
pub struct WebRepo(pub(crate) Repo<WebGenerics>);

#[wasm_bindgen]
impl WebRepo {
    pub async fn construct(handle: FileSystemDirectoryHandle) -> Result<Self, JsValue> {
        let handle: FileSystemDirectoryHandle = match handle.get_file_handle("HEAD").await {
            Ok(_) => handle,
            Err(e) => {
                let e: DomException = e.dyn_into()?;
                if e.name() == "NotFoundError" {
                    handle
                        .get_directory_handle(".git")
                        .await
                        .map_err(|e| match e.clone().dyn_into::<DomException>() {
                            Ok(dom_exception) => {
                                if dom_exception.name() == "NotFoundError" {
                                    JsValue::from(TypeError::new("Not a git repository"))
                                } else {
                                    JsValue::from(dom_exception)
                                }
                            }
                            Err(_) => e,
                        })?
                        .dyn_into()?
                } else {
                    return Err(e.into());
                }
            }
        };
        let repo = Repo::new(WebDirectory::new(&handle).await?)
            .await
            .map_err(to_js_error)?;
        Ok(Self(repo))
    }

    pub async fn head(&self) -> Result<WebRef, JsValue> {
        let head = self.0.head().await.map_err(to_js_error)?;
        Ok(WebRef(head))
    }

    pub async fn ref_names(&self) -> Result<Vec<WebRefName>, JsValue> {
        let refs = self.0.ref_names().await.map_err(to_js_error)?;
        Ok(refs.into_iter().map(WebRefName).collect())
    }

    pub async fn lookup_ref(&self, ref_name: &WebRefName) -> Result<WebRef, JsValue> {
        let ref_name = &ref_name.0;
        let reference = self.0.lookup_ref(ref_name).await.map_err(to_js_error)?;
        Ok(WebRef(reference))
    }

    pub async fn lookup_object(&self, id: JsString) -> Result<WebObject, JsValue> {
        let id: ObjectId = from_value(id.into())?;
        let object = self.0.lookup_object(id).await.map_err(to_js_error)?;
        Ok(WebObject(object))
    }
}
