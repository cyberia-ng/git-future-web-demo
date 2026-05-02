use git_future::{Repo as RGitRepo, RepoConfig, object::ObjectId};
use js_sys::JsString;
use wasm_bindgen::prelude::*;

use crate::{
    directory::WebDirectory,
    error::to_js_error,
    impls::WebFileSystem,
    object::GitObject,
    reference::{Ref, RefName},
};

#[wasm_bindgen]
pub struct Repo(pub(crate) RGitRepo<WebFileSystem>);

#[wasm_bindgen]
impl Repo {
    pub async fn construct(directory: &JsValue) -> Result<Self, JsValue> {
        let repo = RepoConfig::default()
            .open(WebDirectory::new(directory))
            .await
            .map_err(to_js_error)?;
        Ok(Self(repo))
    }

    pub async fn head(&self) -> Result<Ref, JsValue> {
        let head = self.0.head().await.map_err(to_js_error)?;
        Ok(Ref(head))
    }

    pub async fn ref_names(&self) -> Result<Vec<RefName>, JsValue> {
        let refs = self.0.ref_names().await.map_err(to_js_error)?;
        Ok(refs.into_iter().map(RefName).collect())
    }

    pub async fn lookup_ref(&self, ref_name: &RefName) -> Result<Ref, JsValue> {
        let ref_name = &ref_name.0;
        let reference = self.0.lookup_ref(ref_name).await.map_err(to_js_error)?;
        Ok(Ref(reference))
    }

    pub async fn lookup_object(&self, id: &JsString) -> Result<GitObject, JsValue> {
        let id: ObjectId = ObjectId::from_hex(String::from(id).as_bytes())
            .ok_or_else(|| JsError::new("invalid object ID"))?;
        let object = self.0.lookup_object(id).await.map_err(to_js_error)?;
        Ok(GitObject(object))
    }

    pub fn close(self) {
        drop(self)
    }
}
