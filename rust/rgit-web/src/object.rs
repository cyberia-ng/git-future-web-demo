use crate::{error::to_js_error, js_interop::MaybeUtf8, repo::WebRepo};
use js_sys::JsString;
use rgit_core::object::{Commit, Object, ObjectId, ObjectType, Tree, TreeEntry, TreeEntryType};
use wasm_bindgen::prelude::*;

pub fn from_object_id(id: ObjectId) -> JsString {
    format!("{}", id).into()
}

#[wasm_bindgen]
pub enum WebObjectType {
    Commit = "commit",
    Tag = "tag",
    Blob = "blob",
    Tree = "tree",
}

impl From<ObjectType> for WebObjectType {
    fn from(value: ObjectType) -> Self {
        use WebObjectType::*;
        match value {
            ObjectType::Commit => Commit,
            ObjectType::Tag => Tag,
            ObjectType::Blob => Blob,
            ObjectType::Tree => Tree,
        }
    }
}

#[wasm_bindgen]
pub struct WebObject(pub(crate) Object);

#[wasm_bindgen]
impl WebObject {
    pub fn id(&self) -> JsString {
        from_object_id(self.0.id())
    }

    pub fn object_type(&self) -> WebObjectType {
        self.0.object_type().into()
    }

    pub fn commit(&self) -> Result<WebCommit, JsValue> {
        let commit = self.0.clone().commit().map_err(|e| to_js_error(e.into()))?;
        Ok(WebCommit(commit))
    }
}

#[wasm_bindgen]
pub struct WebCommit(pub(crate) Commit);

#[wasm_bindgen]
impl WebCommit {
    pub fn id(&self) -> JsString {
        from_object_id(self.0.id())
    }

    #[wasm_bindgen(unchecked_return_type = "MaybeUtf8")]
    pub fn body(&self) -> JsValue {
        self.0.body().maybe_utf8()
    }

    pub fn tree(&self) -> JsString {
        from_object_id(self.0.tree())
    }

    pub fn parents(&self) -> Vec<JsString> {
        self.0
            .parents()
            .iter()
            .map(|oid| from_object_id(*oid))
            .collect()
    }

    #[wasm_bindgen(unchecked_return_type = "MaybeUtf8")]
    pub fn author_name(&self) -> JsValue {
        self.0.author_name().maybe_utf8()
    }

    #[wasm_bindgen(unchecked_return_type = "MaybeUtf8")]
    pub fn author_email(&self) -> JsValue {
        self.0.author_email().maybe_utf8()
    }

    #[wasm_bindgen(unchecked_return_type = "MaybeUtf8")]
    pub fn committer_name(&self) -> JsValue {
        self.0.committer_name().maybe_utf8()
    }

    #[wasm_bindgen(unchecked_return_type = "MaybeUtf8")]
    pub fn committer_email(&self) -> JsValue {
        self.0.committer_email().maybe_utf8()
    }

    #[wasm_bindgen(unchecked_return_type = "MaybeUtf8")]
    pub fn message(&self) -> JsValue {
        self.0.message().maybe_utf8()
    }

    pub fn author_date(&self) -> JsString {
        self.0.author_date().to_rfc3339().into()
    }

    pub fn commit_date(&self) -> JsString {
        self.0.commit_date().to_rfc3339().into()
    }

    pub async fn lookup_tree(&self, repo: &WebRepo) -> Result<WebTree, JsValue> {
        Ok(WebTree(
            self.0.lookup_tree(&repo.0).await.map_err(to_js_error)?,
        ))
    }

    pub async fn lookup_parents(&self, repo: &WebRepo) -> Result<Vec<WebCommit>, JsValue> {
        let parents = self.0.lookup_parents(&repo.0).await.map_err(to_js_error)?;
        Ok(parents.into_iter().map(WebCommit).collect())
    }
}

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub enum WebTreeEntryType {
    File = "file",
    Executable = "executable",
    Symlink = "symlink",
    Tree = "tree",
    Commit = "commit",
}

impl From<TreeEntryType> for WebTreeEntryType {
    fn from(value: TreeEntryType) -> Self {
        use WebTreeEntryType::*;
        match value {
            TreeEntryType::File => File,
            TreeEntryType::Executable => Executable,
            TreeEntryType::Symlink => Symlink,
            TreeEntryType::Tree => Tree,
            TreeEntryType::Commit => Commit,
        }
    }
}

#[wasm_bindgen]
pub struct WebTreeEntry {
    name: Vec<u8>,
    pub entry_type: WebTreeEntryType,
    id: ObjectId,
}

impl<'a> From<TreeEntry<'a>> for WebTreeEntry {
    fn from(value: TreeEntry<'a>) -> Self {
        Self {
            name: value.name().to_vec(),
            entry_type: value.entry_type().into(),
            id: value.id(),
        }
    }
}

#[wasm_bindgen]
impl WebTreeEntry {
    #[wasm_bindgen(unchecked_return_type = "MaybeUtf8")]
    pub fn name(&self) -> JsValue {
        self.name.maybe_utf8()
    }

    pub fn id(&self) -> JsString {
        from_object_id(self.id)
    }
}

#[wasm_bindgen]
pub struct WebTree(pub(crate) Tree);

#[wasm_bindgen]
impl WebTree {
    pub fn id(&self) -> JsString {
        from_object_id(self.0.id())
    }

    #[wasm_bindgen(unchecked_return_type = "MaybeUtf8")]
    pub fn body(&self) -> JsValue {
        self.0.body().maybe_utf8()
    }

    pub fn entries(&self) -> Vec<WebTreeEntry> {
        self.0.entries().map(WebTreeEntry::from).collect()
    }
}
