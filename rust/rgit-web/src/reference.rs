use crate::{
    error::to_js_error,
    object::{WebCommit, WebTree},
    repo::WebRepo,
};
use rgit_core::reference::{Ref, RefName};
use serde_wasm_bindgen::{from_value, to_value};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct WebRef(pub(crate) Ref);

#[wasm_bindgen]
impl WebRef {
    pub fn to_js(&self) -> Result<JsValue, JsValue> {
        Ok(to_value(&self.0)?)
    }

    pub async fn resolve_object_id(&self, repo: &WebRepo) -> Result<JsValue, JsValue> {
        let oid = self
            .0
            .resolve_object_id(&repo.0)
            .await
            .map_err(to_js_error)?;
        Ok(to_value(&oid)?)
    }

    pub async fn peel_to_commit(&self, repo: &WebRepo) -> Result<Option<WebCommit>, JsValue> {
        let object = self.0.peel_to_commit(&repo.0).await.map_err(to_js_error)?;
        Ok(object.map(WebCommit))
    }

    pub async fn peel_to_tree(&self, repo: &WebRepo) -> Result<Option<WebTree>, JsValue> {
        let object = self.0.peel_to_tree(&repo.0).await.map_err(to_js_error)?;
        Ok(object.map(WebTree))
    }
}

#[wasm_bindgen]
pub struct WebRefName(pub(crate) RefName);

#[wasm_bindgen]
impl WebRefName {
    #[wasm_bindgen(constructor)]
    pub fn new(ref_name: &JsValue) -> Result<Self, JsValue> {
        let ref_name: RefName = from_value(ref_name.clone()).map_err(JsValue::from)?;
        Ok(Self(ref_name))
    }

    pub fn to_js(&self) -> Result<JsValue, JsValue> {
        Ok(to_value(&self.0)?)
    }
}
