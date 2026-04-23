use rgit_core::object::{Commit, Object, Tree};
use serde_wasm_bindgen::to_value;
use wasm_bindgen::prelude::*;

use crate::{error::to_js_error, repo::WebRepo};

#[wasm_bindgen]
pub struct WebObject(pub(crate) Object);

#[wasm_bindgen]
impl WebObject {
    pub fn commit(&self) -> Result<WebCommit, JsValue> {
        let commit = self.0.clone().commit().map_err(|e| to_js_error(e.into()))?;
        Ok(WebCommit(commit))
    }
}

#[wasm_bindgen]
impl WebObject {
    pub fn to_js(&self) -> Result<JsValue, JsValue> {
        Ok(to_value(&self.0)?)
    }
}

#[wasm_bindgen]
pub struct WebCommit(pub(crate) Commit);

#[wasm_bindgen]
impl WebCommit {
    pub fn to_js(&self) -> Result<JsValue, JsValue> {
        Ok(to_value(&self.0)?)
    }

    pub async fn lookup_tree(&self, repo: &WebRepo) -> Result<WebTree, JsValue> {
        Ok(WebTree(
            self.0.lookup_tree(&repo.0).await.map_err(to_js_error)?,
        ))
    }

    pub async fn lookup_parents(&self, repo: &WebRepo) -> Result<Vec<WebCommit>, JsValue> {
        let parents = self.0.lookup_parents(&repo.0).await.map_err(to_js_error)?;
        Ok(parents.into_iter().map(WebCommit).collect())
    }
}

#[wasm_bindgen]
pub struct WebTree(pub(crate) Tree);

#[wasm_bindgen]
impl WebTree {
    pub fn to_js(&self) -> Result<JsValue, JsValue> {
        Ok(to_value(&self.0)?)
    }
}
