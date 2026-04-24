use crate::{
    error::to_js_error,
    js_interop::MaybeUtf8,
    object::{Commit, Tree, from_object_id},
    repo::Repo,
};
use js_sys::JsString;
use rgit_core::reference as rgit_ref;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub enum RefNameDiscriminator {
    Head = "head",
    Ref = "ref",
}

#[wasm_bindgen]
pub struct RefName(pub(crate) rgit_ref::RefName);

#[wasm_bindgen]
impl RefName {
    pub fn head() -> Self {
        Self(rgit_ref::RefName::Head)
    }

    pub fn reference(name: &JsString) -> Self {
        Self(rgit_ref::RefName::Ref(
            String::from(name).as_bytes().to_vec(),
        ))
    }

    pub fn discriminator(&self) -> RefNameDiscriminator {
        use RefNameDiscriminator::*;
        match self.0 {
            rgit_ref::RefName::Head => Head,
            rgit_ref::RefName::Ref(_) => Ref,
        }
    }

    #[wasm_bindgen(unchecked_return_type = "MaybeUtf8")]
    pub fn name(&self) -> JsValue {
        match &self.0 {
            rgit_ref::RefName::Head => panic!("HEAD ref name has no name"),
            rgit_ref::RefName::Ref(name) => name.as_slice().maybe_utf8(),
        }
    }
}

#[wasm_bindgen]
pub enum RefTypeDiscriminator {
    Direct = "direct",
    Symbolic = "symbolic",
}

#[wasm_bindgen]
pub struct RefType(pub(crate) rgit_ref::RefType);

#[wasm_bindgen]
impl RefType {
    pub fn discriminator(&self) -> RefTypeDiscriminator {
        use RefTypeDiscriminator::*;
        match self.0 {
            rgit_ref::RefType::Direct(_) => Direct,
            rgit_ref::RefType::Symbolic(_) => Symbolic,
        }
    }

    pub fn object_id(&self) -> JsString {
        match self.0 {
            rgit_ref::RefType::Direct(object_id) => from_object_id(object_id),
            rgit_ref::RefType::Symbolic(_) => panic!("no object ID on symbolic ref"),
        }
    }

    pub fn name(&self) -> RefName {
        match &self.0 {
            rgit_ref::RefType::Direct(_) => panic!("no ref name on direct ref"),
            rgit_ref::RefType::Symbolic(ref_name) => RefName(ref_name.clone()),
        }
    }
}

#[wasm_bindgen]
pub struct Ref(pub(crate) rgit_ref::Ref);

#[wasm_bindgen]
impl Ref {
    pub fn name(&self) -> RefName {
        RefName(self.0.name().clone())
    }

    pub fn ref_type(&self) -> RefType {
        RefType(self.0.ref_type().clone())
    }

    pub async fn resolve_object_id(&self, repo: &Repo) -> Result<JsString, JsValue> {
        let oid = self
            .0
            .resolve_object_id(&repo.0)
            .await
            .map_err(to_js_error)?;
        Ok(from_object_id(oid))
    }

    pub async fn peel_to_commit(&self, repo: &Repo) -> Result<Option<Commit>, JsValue> {
        let object = self.0.peel_to_commit(&repo.0).await.map_err(to_js_error)?;
        Ok(object.map(Commit))
    }

    pub async fn peel_to_tree(&self, repo: &Repo) -> Result<Option<Tree>, JsValue> {
        let object = self.0.peel_to_tree(&repo.0).await.map_err(to_js_error)?;
        Ok(object.map(Tree))
    }
}
