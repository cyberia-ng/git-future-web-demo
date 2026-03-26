use crate::{directory::Directory, error::GResult, object::ObjectId, repo::Repo};
use alloc::string::{String, ToString};
use core::str;

#[derive(Debug)]
pub struct Ref<'r, D> {
    inner: RefType,
    repo: &'r Repo<D>,
}

#[derive(Debug, PartialEq, Eq)]
pub enum RefType {
    Direct(ObjectId),
    Symbolic(String),
}

impl<'r, D: Directory> Ref<'r, D> {
    pub const fn direct(repo: &'r Repo<D>, oid: ObjectId) -> Self {
        Ref {
            inner: RefType::Direct(oid),
            repo,
        }
    }

    pub const fn symbolic(repo: &'r Repo<D>, target: String) -> Self {
        Ref {
            inner: RefType::Symbolic(target),
            repo,
        }
    }

    pub(crate) fn from_content(repo: &'r Repo<D>, content: &[u8]) -> GResult<Self, D> {
        if let Some(target) = content.strip_prefix(b"ref: ") {
            let target = str::from_utf8(target)?.trim().to_string();
            Ok(Ref::symbolic(repo, target))
        } else {
            let oid = ObjectId::from_encoded(content)?;
            Ok(Ref::direct(repo, oid))
        }
    }

    pub fn ref_type(&self) -> &RefType {
        &self.inner
    }
}
