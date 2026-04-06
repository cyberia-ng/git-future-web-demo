use crate::{directory::WebDirectory, error::to_js_error, object::WebObject};
use rgit_core::{Ref, RefName};
use serde_wasm_bindgen::to_value;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct WebRef(pub(crate) Ref<'static, WebDirectory>);

#[wasm_bindgen]
impl WebRef {
    pub fn to_js(&self) -> Result<JsValue, JsValue> {
        Ok(to_value(&self.0)?)
    }

    pub async fn resolve_to_object(&self) -> Result<WebObject, JsValue> {
        let obj = self.0.peel_to_object().await.map_err(to_js_error)?;
        Ok(WebObject(obj))
    }
}

#[wasm_bindgen]
pub struct WebRefName(pub(crate) RefName);

#[wasm_bindgen]
impl WebRefName {
    pub fn to_js(&self) -> Result<JsValue, JsValue> {
        Ok(to_value(&self.0)?)
    }
}
