use crate::{
    error::to_js_error,
    js_interop::MaybeUtf8,
    object::{Tree, TreeEntryType},
    repo::Repo,
};
use js_sys::Uint8Array;
use postcard::{from_bytes, to_allocvec};
use rgit::{
    diff::{self as rgit_diff},
    error::Error,
};
use serde::{Deserialize, Serialize};
use similar::TextDiffConfig;
use std::{cell::Cell, rc::Rc};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Copy, Serialize, Deserialize)]
pub enum DiffEntryType {
    LeftOnly = "left only",
    Both = "both",
    RightOnly = "right only",
}

#[derive(Clone, Serialize, Deserialize)]
pub struct DiffEntry<Content> {
    kind: DiffEntryType,
    #[serde(with = "serde_bytes")]
    path: Vec<u8>,
    left_type: Option<TreeEntryType>,
    right_type: Option<TreeEntryType>,
    content: Content,
}

impl<Content> From<rgit_diff::DiffEntry<Content>> for DiffEntry<Content> {
    fn from(value: rgit_diff::DiffEntry<Content>) -> Self {
        match value {
            rgit_diff::DiffEntry::LeftOnly {
                path,
                entry_type,
                content,
            } => Self {
                kind: DiffEntryType::LeftOnly,
                path: path.inner(),
                left_type: Some(entry_type.into()),
                right_type: None,
                content,
            },
            rgit_diff::DiffEntry::Both {
                path,
                left_type,
                right_type,
                content,
            } => Self {
                kind: DiffEntryType::Both,
                path: path.inner(),
                left_type: Some(left_type.into()),
                right_type: Some(right_type.into()),
                content,
            },
            rgit_diff::DiffEntry::RightOnly {
                path,
                entry_type,
                content,
            } => Self {
                kind: DiffEntryType::RightOnly,
                path: path.inner(),
                left_type: None,
                right_type: Some(entry_type.into()),
                content,
            },
        }
    }
}

impl<Content> DiffEntry<Content> {
    fn path(&self) -> &[u8] {
        self.path.as_slice()
    }

    pub fn left_entry_type(&self) -> TreeEntryType {
        self.left_type
            .expect("no left entry type on right only diff entry")
    }

    pub fn right_entry_type(&self) -> TreeEntryType {
        self.right_type
            .expect("no right entry type on left only diff entry")
    }
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct TreeDiffEntry(DiffEntry<()>);

#[wasm_bindgen]
impl TreeDiffEntry {
    pub fn discriminator(&self) -> DiffEntryType {
        self.0.kind
    }

    #[wasm_bindgen(unchecked_return_type = "MaybeUtf8")]
    pub fn path(&self) -> JsValue {
        self.0.path().maybe_utf8()
    }

    pub fn left_entry_type(&self) -> TreeEntryType {
        self.0.left_entry_type()
    }

    pub fn right_entry_type(&self) -> TreeEntryType {
        self.0.right_entry_type()
    }
}

#[wasm_bindgen]
#[derive(Clone, Serialize, Deserialize)]
pub struct FullDiffEntry(DiffEntry<Vec<Hunk>>);

#[wasm_bindgen]
impl FullDiffEntry {
    pub fn discriminator(&self) -> DiffEntryType {
        self.0.kind
    }

    #[wasm_bindgen(unchecked_return_type = "MaybeUtf8")]
    pub fn path(&self) -> JsValue {
        self.0.path().maybe_utf8()
    }

    pub fn hunks(&self) -> Vec<Hunk> {
        self.0.content.clone()
    }

    pub fn left_entry_type(&self) -> TreeEntryType {
        self.0.left_entry_type()
    }

    pub fn right_entry_type(&self) -> TreeEntryType {
        self.0.right_entry_type()
    }
}

#[wasm_bindgen]
pub struct TreeDiffFactory {
    canceled: Rc<Cell<bool>>,
}

#[wasm_bindgen]
impl TreeDiffFactory {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            canceled: Rc::new(Cell::new(false)),
        }
    }

    pub async fn diff(&self, repo: &Repo, left: &Tree, right: &Tree) -> Result<TreeDiff, JsValue> {
        let canceled = self.canceled.clone();
        let cancel = async move || canceled.get();
        let tree_diff = rgit_diff::TreeDiff::new_cancelable(&repo.0, &left.0, &right.0, cancel)
            .await
            .map_err(to_js_error)?;
        Ok(TreeDiff(tree_diff))
    }

    pub fn cancel(&self) {
        self.canceled.set(true);
    }
}

#[wasm_bindgen]
pub struct TreeDiff(rgit_diff::TreeDiff);

#[wasm_bindgen]
impl TreeDiff {
    pub fn len(&self) -> usize {
        self.0.entries().len()
    }
}

#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
pub struct FullDiff(Vec<FullDiffEntry>);

#[wasm_bindgen]
impl FullDiff {
    pub fn entries(&self) -> Vec<FullDiffEntry> {
        self.0.clone()
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    pub fn serialize(&self) -> Result<Uint8Array, JsValue> {
        let buf = to_allocvec(self).map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Uint8Array::from(buf.as_slice()))
    }

    pub fn deserialize(buf: &Uint8Array) -> Result<Self, JsValue> {
        let buf = buf.to_vec();
        Ok(from_bytes(buf.as_slice()).map_err(|e| JsError::new(&e.to_string()))?)
    }
}

#[wasm_bindgen]
pub struct FullDiffFactory {
    canceled: Cell<bool>,
}

#[wasm_bindgen]
impl FullDiffFactory {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            canceled: Cell::new(false),
        }
    }

    pub async fn from_tree_diff(
        &self,
        repo: &Repo,
        tree_diff: &TreeDiff,
    ) -> Result<FullDiff, JsValue> {
        let mut entries = Vec::new();
        for entry in tree_diff.0.entries() {
            if self.canceled.get() {
                return Err(to_js_error(Error::DiffCanceled));
            }
            let entry = entry
                .resolve(&repo.0, TextDiffConfig::default())
                .await
                .map_err(to_js_error)?;
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
                                    tag: change.tag().into(),
                                    value: change.value().to_vec(),
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
            entries.push(FullDiffEntry(entry.into()));
        }
        Ok(FullDiff(entries))
    }

    pub fn cancel(&self) {
        self.canceled.set(true);
    }
}

#[wasm_bindgen]
#[derive(Clone, Copy, Serialize, Deserialize)]
pub enum ChangeTag {
    Equal = "equal",
    Delete = "delete",
    Insert = "insert",
}

impl From<similar::ChangeTag> for ChangeTag {
    fn from(value: similar::ChangeTag) -> Self {
        use ChangeTag::*;
        match value {
            similar::ChangeTag::Equal => Equal,
            similar::ChangeTag::Delete => Delete,
            similar::ChangeTag::Insert => Insert,
        }
    }
}

#[wasm_bindgen]
#[derive(Clone, Serialize, Deserialize)]
pub struct LineChange {
    pub tag: ChangeTag,
    #[serde(with = "serde_bytes")]
    value: Vec<u8>,
}

#[wasm_bindgen]
impl LineChange {
    #[wasm_bindgen(unchecked_return_type = "MaybeUtf8")]
    pub fn value(&self) -> JsValue {
        self.value.as_slice().maybe_utf8()
    }
}

#[wasm_bindgen]
#[derive(Clone, Serialize, Deserialize)]
pub struct Hunk {
    pub old_start: usize,
    pub old_end: usize,
    pub new_start: usize,
    pub new_end: usize,
    changes: Vec<LineChange>,
}

#[wasm_bindgen]
impl Hunk {
    pub fn changes(&self) -> Vec<LineChange> {
        self.changes.clone()
    }
}
