use crate::{
    directory::Directory,
    error::{Error, GResult},
    object::{Object, ObjectId},
    repo::Repo,
};
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

#[derive(Debug)]
pub enum RefTarget<'r, D> {
    Ref(Ref<'r, D>),
    Object(Object<'r, D>),
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

    pub(crate) fn from_content(repo: &'r Repo<D>, content: &[u8]) -> GResult<Self> {
        if let Some(target) = content.strip_prefix(b"ref: refs/") {
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

    pub async fn target(&self) -> GResult<RefTarget<'r, D>> {
        use RefType::*;
        match &self.inner {
            Symbolic(s) => {
                let mut path_components = s.split('/');
                let file_name = path_components
                    .next_back()
                    .ok_or(Error::PathError(s.clone()))?;
                let mut dir = self.repo.git_dir.open_subdir("refs").await?;
                for component in path_components {
                    dir = dir.open_subdir(component).await?;
                }
                let file_content = dir.read_file(file_name).await?;
                let reference = Self::from_content(self.repo, &file_content)?;
                Ok(RefTarget::Ref(reference))
            }
            Direct(_oid) => todo!(),
        }
    }
}
