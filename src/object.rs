use crate::{directory::Directory, error::GResult, repo::Repo};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ObjectId([u8; 20]);

impl ObjectId {
    pub fn from_encoded(s: &[u8]) -> GResult<Self> {
        let mut buf = [0u8; 20];
        hex::decode_to_slice(s.trim_ascii(), &mut buf)?;
        Ok(ObjectId(buf))
    }
}

#[derive(Debug)]
pub enum Object<'r, D> {
    Commit(Commit<'r, D>),
}

impl<'r, D: Directory> Object<'r, D> {
    pub fn lookup(_repo: &'r Repo<D>, _id: ObjectId) -> GResult<Self> {
        todo!()
    }
}

#[derive(Debug)]
pub struct Commit<'r, D> {
    id: ObjectId,
    repo: &'r Repo<D>,
    // author, author_date, committer, commit_date, message, parent(s), tree
}
