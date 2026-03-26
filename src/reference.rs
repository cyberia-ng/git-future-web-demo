use crate::{directory::Directory, error::GResult, object::ObjectId, repo::Repo};
use alloc::string::{String, ToString};
use core::str;

#[derive(Debug)]
pub struct Ref<'repo, D> {
    inner: RefType,
    repo: &'repo Repo<D>,
}

#[derive(Debug, PartialEq, Eq)]
pub enum RefType {
    Direct(ObjectId),
    Symbolic(String),
}

impl<'repo, D: Directory> Ref<'repo, D> {
    pub const fn direct(repo: &'repo Repo<D>, oid: ObjectId) -> Self {
        Ref {
            inner: RefType::Direct(oid),
            repo,
        }
    }

    pub const fn symbolic(repo: &'repo Repo<D>, target: String) -> Self {
        Ref {
            inner: RefType::Symbolic(target),
            repo,
        }
    }

    pub(crate) fn from_content(repo: &'repo Repo<D>, content: &[u8]) -> GResult<Self, D> {
        if content.starts_with(b"ref: ") {
            let target = str::from_utf8(&content[5..])?.trim().to_string();
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
