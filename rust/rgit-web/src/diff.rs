use rgit_core::diff::{DiffEntry, TreeDiff};
use serde_wasm_bindgen::to_value;
use std::io::Cursor;
use wasm_bindgen::prelude::*;

use crate::{error::to_js_error, object::WebTree};

#[wasm_bindgen]
pub struct WebDiff(pub(crate) Vec<DiffEntry<Vec<u8>>>);

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
        Ok(WebDiff(
            diff.entries()
                .iter()
                .map(|e| {
                    e.map_content(|text_diff| {
                        let unified = text_diff.unified_diff();
                        let mut cursor = Cursor::new(Vec::new());
                        unified.to_writer(&mut cursor).unwrap();
                        cursor.into_inner()
                    })
                })
                .collect::<Vec<_>>(),
        ))
    }

    pub fn to_js(&self) -> Result<JsValue, JsValue> {
        Ok(to_value(&self.0)?)
    }
}
