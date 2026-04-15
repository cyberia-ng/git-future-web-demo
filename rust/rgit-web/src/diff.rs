use rgit_core::diff::{DiffEntry, TreeDiff};
use serde_wasm_bindgen::to_value;
use std::io::Cursor;
use wasm_bindgen::prelude::*;

use crate::{error::to_js_error, object::WebTree};

#[wasm_bindgen]
pub struct WebDiff(pub(crate) Vec<DiffEntry<String>>);

#[wasm_bindgen]
impl WebDiff {
    pub async fn diff(left: &WebTree, right: &WebTree) -> Result<WebDiff, JsValue> {
        let tree_diff = TreeDiff::new(&left.0, &right.0)
            .await
            .map_err(to_js_error)?;
        let diff = tree_diff
            .to_text_diff(Default::default())
            .await
            .map_err(to_js_error)?;
        let mut entries = Vec::new();
        for entry in diff.entries() {
            let entry = entry
                .map_content_res(|c| {
                    let mut cursor = Cursor::new(Vec::new());
                    c.unified_diff().to_writer(&mut cursor).unwrap();
                    let buf = cursor.into_inner();
                    String::from_utf8(buf)
                })
                .map_err(|_| JsError::new("invalid UTF-8"))?;
            entries.push(entry);
        }
        Ok(WebDiff(entries))
    }

    pub fn to_js(&self) -> Result<JsValue, JsValue> {
        Ok(to_value(&self.0)?)
    }
}
