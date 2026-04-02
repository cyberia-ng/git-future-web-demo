use js_sys::{TypeError, Uint8Array};
use rgit_core::object::{Object, ObjectId};
use serde_wasm_bindgen::to_value;
use wasm_bindgen::prelude::*;

use crate::{error::to_js_error, repo::WebRepo};

#[wasm_bindgen]
pub struct WebObject(pub(crate) Object);

#[wasm_bindgen]
impl WebObject {
    pub fn to_js(&self) -> Result<JsValue, JsValue> {
        Ok(to_value(&self.0)?)
    }

    pub async fn lookup(repo: &WebRepo, id: Uint8Array) -> Result<WebObject, JsValue> {
        if id.length() != 20 {
            return Err(TypeError::new("Object ID was not 20 bytes long").into());
        }
        let mut id_bytes = [0u8; 20];
        id.copy_to(&mut id_bytes);
        let id = ObjectId(id_bytes);
        let object = Object::lookup(&repo.0, id).await.map_err(to_js_error)?;
        Ok(WebObject(object))
    }
}
