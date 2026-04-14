use rgit_core::object::{Commit, Object};
use serde_wasm_bindgen::to_value;
use wasm_bindgen::prelude::*;

use crate::directory::WebDirectory;

#[wasm_bindgen]
pub struct WebObject(pub(crate) Object<'static, WebDirectory>);

#[wasm_bindgen]
impl WebObject {
    pub fn to_js(&self) -> Result<JsValue, JsValue> {
        Ok(to_value(&self.0)?)
    }
}

#[wasm_bindgen]
pub struct WebCommit(pub(crate) Commit<'static, WebDirectory>);

#[wasm_bindgen]
impl WebCommit {
    pub fn to_js(&self) -> Result<JsValue, JsValue> {
        Ok(to_value(&self.0)?)
    }
}
