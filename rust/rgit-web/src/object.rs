use rgit_core::object::{Commit, Object, Tree};
use serde_wasm_bindgen::to_value;
use wasm_bindgen::prelude::*;

use crate::{directory::WebDirectory, error::to_js_error};

#[wasm_bindgen]
pub struct WebObject(pub(crate) Object<WebDirectory>);

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
pub struct WebCommit(pub(crate) Commit<WebDirectory>);

#[wasm_bindgen]
impl WebCommit {
    pub fn to_js(&self) -> Result<JsValue, JsValue> {
        Ok(to_value(&self.0)?)
    }

    pub async fn lookup_tree(&self) -> Result<WebTree, JsValue> {
        Ok(WebTree(self.0.lookup_tree().await.map_err(to_js_error)?))
    }

    pub async fn lookup_parents(&self) -> Result<Vec<WebCommit>, JsValue> {
        let parents = self.0.lookup_parents().await.map_err(to_js_error)?;
        Ok(parents.into_iter().map(WebCommit).collect())
    }
}

#[wasm_bindgen]
pub struct WebTree(pub(crate) Tree<WebDirectory>);
