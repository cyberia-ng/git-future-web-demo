use crate::{
    error::to_js_error,
    js_interop::MaybeUtf8,
    object::{WebCommit, WebTree, from_object_id},
    repo::WebRepo,
};
use js_sys::JsString;
use rgit_core::reference::{Ref, RefName, RefType};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub enum WebRefNameDiscriminator {
    Head = "head",
    Ref = "ref",
}

#[wasm_bindgen]
pub struct WebRefName(pub(crate) RefName);

#[wasm_bindgen]
impl WebRefName {
    pub fn head() -> Self {
        Self(RefName::Head)
    }

    pub fn reference(name: &JsString) -> Self {
        Self(RefName::Ref(String::from(name).as_bytes().to_vec()))
    }

    pub fn discriminator(&self) -> WebRefNameDiscriminator {
        use WebRefNameDiscriminator::*;
        match self.0 {
            RefName::Head => Head,
            RefName::Ref(_) => Ref,
        }
    }

    #[wasm_bindgen(unchecked_return_type = "MaybeUtf8")]
    pub fn name(&self) -> JsValue {
        match &self.0 {
            RefName::Head => panic!("HEAD ref name has no name"),
            RefName::Ref(name) => name.as_slice().maybe_utf8(),
        }
    }
}

#[wasm_bindgen]
pub enum WebRefTypeDiscriminator {
    Direct = "direct",
    Symbolic = "symbolic",
}

#[wasm_bindgen]
pub struct WebRefType(pub(crate) RefType);

#[wasm_bindgen]
impl WebRefType {
    pub fn discriminator(&self) -> WebRefTypeDiscriminator {
        use WebRefTypeDiscriminator::*;
        match self.0 {
            RefType::Direct(_) => Direct,
            RefType::Symbolic(_) => Symbolic,
        }
    }

    pub fn object_id(&self) -> JsString {
        match self.0 {
            RefType::Direct(object_id) => from_object_id(object_id),
            RefType::Symbolic(_) => panic!("no object ID on symbolic ref"),
        }
    }

    pub fn name(&self) -> WebRefName {
        match &self.0 {
            RefType::Direct(_) => panic!("no ref name on direct ref"),
            RefType::Symbolic(ref_name) => WebRefName(ref_name.clone()),
        }
    }
}

#[wasm_bindgen]
pub struct WebRef(pub(crate) Ref);

#[wasm_bindgen]
impl WebRef {
    pub fn name(&self) -> WebRefName {
        WebRefName(self.0.name().clone())
    }

    pub fn ref_type(&self) -> WebRefType {
        WebRefType(self.0.ref_type().clone())
    }

    pub async fn resolve_object_id(&self, repo: &WebRepo) -> Result<JsString, JsValue> {
        let oid = self
            .0
            .resolve_object_id(&repo.0)
            .await
            .map_err(to_js_error)?;
        Ok(from_object_id(oid))
    }

    pub async fn peel_to_commit(&self, repo: &WebRepo) -> Result<Option<WebCommit>, JsValue> {
        let object = self.0.peel_to_commit(&repo.0).await.map_err(to_js_error)?;
        Ok(object.map(WebCommit))
    }

    pub async fn peel_to_tree(&self, repo: &WebRepo) -> Result<Option<WebTree>, JsValue> {
        let object = self.0.peel_to_tree(&repo.0).await.map_err(to_js_error)?;
        Ok(object.map(WebTree))
    }
}
