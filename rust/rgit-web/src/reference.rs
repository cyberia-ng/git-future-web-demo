use rgit_core::reference::{Ref, RefName};
use serde_wasm_bindgen::to_value;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct WebRef(Ref);

#[wasm_bindgen]
impl WebRef {
    pub fn to_js(&self) -> Result<JsValue, JsValue> {
        Ok(to_value(&self.0)?)
    }
}

impl WebRef {
    pub fn new(reference: Ref) -> Self {
        Self(reference)
    }
}

#[wasm_bindgen]
pub struct WebRefName(RefName);

#[wasm_bindgen]
impl WebRefName {
    pub fn to_js(&self) -> Result<JsValue, JsValue> {
        Ok(to_value(&self.0)?)
    }
}

impl WebRefName {
    pub fn new(refname: RefName) -> Self {
        Self(refname)
    }
}
