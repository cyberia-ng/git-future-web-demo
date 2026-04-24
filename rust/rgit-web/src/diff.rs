use crate::{
    error::to_js_error,
    js_interop::MaybeUtf8,
    object::{Tree, TreeEntryType},
    repo::Repo,
};
use rgit_core::diff as rgit_diff;
use similar::TextDiffConfig;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub enum DiffEntryType {
    LeftOnly = "left only",
    Both = "both",
    RightOnly = "right only",
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct DiffEntry(rgit_diff::DiffEntry<Vec<Hunk>>);

#[wasm_bindgen]
impl DiffEntry {
    pub fn discriminator(&self) -> DiffEntryType {
        use DiffEntryType::*;
        match self.0 {
            rgit_diff::DiffEntry::LeftOnly { .. } => LeftOnly,
            rgit_diff::DiffEntry::Both { .. } => Both,
            rgit_diff::DiffEntry::RightOnly { .. } => RightOnly,
        }
    }

    #[wasm_bindgen(unchecked_return_type = "MaybeUtf8")]
    pub fn path(&self) -> JsValue {
        self.0.path().as_slice().maybe_utf8()
    }

    pub fn hunks(&self) -> Vec<Hunk> {
        self.0.content().clone()
    }

    pub fn left_entry_type(&self) -> TreeEntryType {
        match self.0 {
            rgit_diff::DiffEntry::LeftOnly { entry_type, .. }
            | rgit_diff::DiffEntry::Both {
                left_type: entry_type,
                ..
            } => entry_type.into(),
            rgit_diff::DiffEntry::RightOnly { .. } => {
                panic!("no left entry type on right only diff entry")
            }
        }
    }

    pub fn right_entry_type(&self) -> TreeEntryType {
        match self.0 {
            rgit_diff::DiffEntry::RightOnly { entry_type, .. }
            | rgit_diff::DiffEntry::Both {
                left_type: entry_type,
                ..
            } => entry_type.into(),
            rgit_diff::DiffEntry::LeftOnly { .. } => {
                panic!("no left entry type on left only diff entry")
            }
        }
    }
}

#[wasm_bindgen]
pub struct Diff(pub(crate) Vec<DiffEntry>);

#[wasm_bindgen]
impl Diff {
    pub async fn diff(repo: &Repo, left: &Tree, right: &Tree) -> Result<Diff, JsValue> {
        let tree_diff = rgit_diff::TreeDiff::new(&repo.0, &left.0, &right.0)
            .await
            .map_err(to_js_error)?;
        let diff = tree_diff
            .to_text_diff(&repo.0, TextDiffConfig::default())
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
            entries.push(DiffEntry(entry));
        }
        Ok(Diff(entries))
    }

    pub fn entries(&self) -> Vec<DiffEntry> {
        self.0.clone()
    }
}

#[wasm_bindgen]
#[derive(Clone, Copy)]
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
#[derive(Clone)]
pub struct LineChange {
    pub tag: ChangeTag,
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
#[derive(Clone)]
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
