use rgit_core::diff::{DiffEntry, TreeDiff};
use serde::Serialize;
use similar::ChangeTag;
use wasm_bindgen::prelude::*;

use crate::{error::to_js_error, object::Tree, repo::Repo};

#[wasm_bindgen]
pub struct WebDiff(pub(crate) Vec<DiffEntry<Vec<Hunk>>>);

#[wasm_bindgen]
impl WebDiff {
    pub async fn diff(repo: &Repo, left: &Tree, right: &Tree) -> Result<WebDiff, JsValue> {
        let tree_diff = TreeDiff::new(&repo.0, &left.0, &right.0)
            .await
            .map_err(to_js_error)?;
        let diff = tree_diff
            .to_text_diff(&repo.0, Default::default())
            .await
            .map_err(to_js_error)?;
        let mut entries = Vec::new();
        for entry in diff.entries() {
            let entry = entry
                .map_content_res(|text_diff| -> Result<Vec<Hunk>, JsError> {
                    let grouped_ops = text_diff.grouped_ops(6);
                    // Each group of ops becomes a hunk
                    let mut hunks = Vec::<Hunk>::new();
                    for group in grouped_ops {
                        let changes: Vec<LineChange> = group
                            .iter()
                            .flat_map(|op| text_diff.iter_changes(op))
                            .map(|change| -> Result<_, JsError> {
                                Ok(LineChange {
                                    tag: change.tag(),
                                    value: change
                                        .as_str()
                                        .ok_or_else(|| JsError::new("invalid UTF-8"))?
                                        .to_string(),
                                })
                            })
                            .collect::<Result<_, _>>()?;
                        let first_op = group.first().unwrap();
                        let last_op = group.last().unwrap();
                        let hunk = Hunk {
                            old_start: first_op.old_range().start,
                            old_end: last_op.old_range().end,
                            new_start: first_op.new_range().start,
                            new_end: last_op.new_range().end,
                            changes,
                        };
                        hunks.push(hunk);
                    }
                    Ok(hunks)
                })
                .map_err(|_| JsError::new("invalid UTF-8"))?;
            entries.push(entry);
        }
        Ok(WebDiff(entries))
    }

    pub fn to_js(&self) -> Result<JsValue, JsValue> {
        todo!()
    }
}

#[derive(Serialize)]
pub struct LineChange {
    tag: ChangeTag,
    // value: Vec<u8>,
    value: String,
}

#[derive(Serialize)]
pub struct Hunk {
    old_start: usize,
    old_end: usize,
    new_start: usize,
    new_end: usize,
    changes: Vec<LineChange>,
}
