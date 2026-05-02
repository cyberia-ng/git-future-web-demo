use crate::{error::to_js_error, js_interop::MaybeUtf8, repo::Repo};
use git_future::object as rgit_object;
use js_sys::JsString;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

pub fn from_object_id(id: rgit_object::ObjectId) -> JsString {
    format!("{id}").into()
}

#[wasm_bindgen]
pub enum ObjectType {
    Commit = "commit",
    Tag = "tag",
    Blob = "blob",
    Tree = "tree",
}

impl From<rgit_object::ObjectType> for ObjectType {
    fn from(value: rgit_object::ObjectType) -> Self {
        use ObjectType::*;
        match value {
            rgit_object::ObjectType::Commit => Commit,
            rgit_object::ObjectType::Tag => Tag,
            rgit_object::ObjectType::Blob => Blob,
            rgit_object::ObjectType::Tree => Tree,
        }
    }
}

#[wasm_bindgen]
pub struct GitObject(pub(crate) rgit_object::Object);

#[wasm_bindgen]
impl GitObject {
    pub fn id(&self) -> JsString {
        from_object_id(self.0.id())
    }

    pub fn object_type(&self) -> ObjectType {
        self.0.object_type().into()
    }

    pub fn commit(&self) -> Result<Commit, JsValue> {
        let commit = self.0.clone().commit().map_err(|e| to_js_error(e.into()))?;
        Ok(Commit(commit))
    }

    pub fn tree(&self) -> Result<Tree, JsValue> {
        let tree = self.0.clone().tree().map_err(|e| to_js_error(e.into()))?;
        Ok(Tree(tree))
    }

    pub fn blob(&self) -> Result<Blob, JsValue> {
        let blob = self.0.clone().blob().map_err(|e| to_js_error(e.into()))?;
        Ok(Blob(blob))
    }
}

#[wasm_bindgen]
pub struct Blob(pub(crate) rgit_object::Blob);

#[wasm_bindgen]
impl Blob {
    pub fn id(&self) -> JsString {
        from_object_id(self.0.id())
    }

    #[wasm_bindgen(unchecked_return_type = "MaybeUtf8")]
    pub fn data(&self) -> JsValue {
        self.0.data().maybe_utf8()
    }
}

#[wasm_bindgen]
pub struct Commit(pub(crate) rgit_object::Commit);

#[wasm_bindgen]
impl Commit {
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

    pub async fn lookup_tree(&self, repo: &Repo) -> Result<Tree, JsValue> {
        Ok(Tree(
            self.0.lookup_tree(&repo.0).await.map_err(to_js_error)?,
        ))
    }

    pub async fn lookup_parents(&self, repo: &Repo) -> Result<Vec<Commit>, JsValue> {
        let parents = self.0.lookup_parents(&repo.0).await.map_err(to_js_error)?;
        Ok(parents.into_iter().map(Commit).collect())
    }
}

#[wasm_bindgen]
#[derive(Clone, Copy, Serialize, Deserialize)]
pub enum TreeEntryType {
    File = "file",
    Executable = "executable",
    Symlink = "symlink",
    Tree = "tree",
    Commit = "commit",
}

impl From<rgit_object::TreeEntryType> for TreeEntryType {
    fn from(value: rgit_object::TreeEntryType) -> Self {
        use TreeEntryType::*;
        match value {
            rgit_object::TreeEntryType::File => File,
            rgit_object::TreeEntryType::Executable => Executable,
            rgit_object::TreeEntryType::Symlink => Symlink,
            rgit_object::TreeEntryType::Tree => Tree,
            rgit_object::TreeEntryType::Commit => Commit,
        }
    }
}

#[wasm_bindgen]
pub struct TreeEntry {
    name: Vec<u8>,
    pub entry_type: TreeEntryType,
    id: rgit_object::ObjectId,
}

impl<'a> From<rgit_object::TreeEntry<'a>> for TreeEntry {
    fn from(value: rgit_object::TreeEntry<'a>) -> Self {
        Self {
            name: value.name().to_vec(),
            entry_type: value.entry_type().into(),
            id: value.id(),
        }
    }
}

#[wasm_bindgen]
impl TreeEntry {
    #[wasm_bindgen(unchecked_return_type = "MaybeUtf8")]
    pub fn name(&self) -> JsValue {
        self.name.maybe_utf8()
    }

    pub fn id(&self) -> JsString {
        from_object_id(self.id)
    }
}

#[wasm_bindgen]
pub struct Tree(pub(crate) rgit_object::Tree);

#[wasm_bindgen]
impl Tree {
    pub fn id(&self) -> JsString {
        from_object_id(self.0.id())
    }

    #[wasm_bindgen(unchecked_return_type = "MaybeUtf8")]
    pub fn body(&self) -> JsValue {
        self.0.body().maybe_utf8()
    }

    pub fn entries(&self) -> Vec<TreeEntry> {
        self.0.entries().map(TreeEntry::from).collect()
    }

    pub fn as_object(&self) -> GitObject {
        GitObject(self.0.clone().as_object())
    }
}
