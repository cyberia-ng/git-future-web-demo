use crate::{
    directory::Directory,
    error::{Error, GResult},
    object::{Object, ObjectId},
    repo::Repo,
};
use alloc::vec::Vec;

#[derive(Debug)]
pub struct Ref {
    inner: RefType,
}

#[derive(Debug, PartialEq, Eq)]
pub enum RefType {
    Direct(ObjectId),
    Symbolic(Vec<u8>),
}

#[derive(Debug)]
pub enum RefTarget {
    Ref(Ref),
    Object(Object),
}

impl Ref {
    pub const fn direct(oid: ObjectId) -> Self {
        Ref {
            inner: RefType::Direct(oid),
        }
    }

    pub const fn symbolic(target: Vec<u8>) -> Self {
        Ref {
            inner: RefType::Symbolic(target),
        }
    }

    pub(crate) fn from_content(content: &[u8]) -> GResult<Self> {
        if let Some(target) = content.strip_prefix(b"ref: refs/") {
            let target = target.trim_ascii_end().to_vec();
            Ok(Ref::symbolic(target))
        } else {
            let oid = ObjectId::from_encoded(content)?;
            Ok(Ref::direct(oid))
        }
    }

    pub fn ref_type(&self) -> &RefType {
        &self.inner
    }

    pub async fn target<D: Directory>(&self, repo: &Repo<D>) -> GResult<RefTarget> {
        use RefType::*;
        match &self.inner {
            Symbolic(s) => {
                let mut path_components = s.split(|b| *b == b'/');
                let file_name = path_components
                    .next_back()
                    .ok_or(Error::PathError(s.clone()))?;
                let mut dir = repo.git_dir.open_subdir(b"refs").await?;
                for component in path_components {
                    dir = dir.open_subdir(component).await?;
                }
                let file_content = dir.read_file(file_name).await?;
                let reference = Self::from_content(&file_content)?;
                Ok(RefTarget::Ref(reference))
            }
            Direct(oid) => {
                let object = Object::lookup(repo, *oid).await?;
                Ok(RefTarget::Object(object))
            }
        }
    }
}

#[cfg(test)]
mod test {
    #![allow(non_upper_case_globals)]

    use crate::{
        object::Object,
        reference::{RefTarget, RefType},
        test::repo::TestRepo,
    };
    use chrono::DateTime;
    use futures::executor::block_on;
    use std::{fs::OpenOptions, io::Write as _};

    const commit_message: &str = "a commit message";
    const author_name: &str = "author name";
    const author_email: &str = "author_email";
    const author_date_rfc3339: &str = "2026-03-27T19:35:00+05:30";
    const committer_name: &str = "committer";
    const committer_email: &str = "committer-email";
    const committer_date_rfc3339: &str = "2025-02-26T08:24:30-08:00";

    fn make_basic_commit(test_repo: &TestRepo) {
        let wd_path = test_repo.working_tree_path();
        let mut file_path = wd_path.to_path_buf();
        file_path.push("a-file");
        let mut f = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&file_path)
            .unwrap();
        f.flush().unwrap();
        test_repo.add_all().unwrap();
        test_repo.set_user(committer_name, committer_email).unwrap();
        test_repo
            .commit(
                commit_message,
                author_name,
                author_email,
                DateTime::parse_from_rfc3339(author_date_rfc3339).unwrap(),
                DateTime::parse_from_rfc3339(committer_date_rfc3339).unwrap(),
            )
            .unwrap();
    }

    #[test]
    fn resolve_head() {
        let test_repo = TestRepo::new().unwrap();
        make_basic_commit(&test_repo);

        let repo = test_repo.repo();
        let head = block_on(repo.head()).unwrap();
        let head_target = block_on(head.target(&repo)).unwrap();
        match head_target {
            RefTarget::Object(_) => panic!(),
            RefTarget::Ref(r) => {
                let ref_type = r.ref_type();
                match ref_type {
                    RefType::Symbolic(_) => panic!(),
                    RefType::Direct(_) => {
                        // Happy
                    }
                }
            }
        }
    }

    #[test]
    fn resolve_head_twice() {
        // i.e. get to the commit
        let test_repo = TestRepo::new().unwrap();
        make_basic_commit(&test_repo);

        let repo = test_repo.repo();
        let head = block_on(repo.head()).unwrap();
        let head_target = block_on(head.target(&repo)).unwrap();
        let head_target_target = match head_target {
            RefTarget::Ref(r) => block_on(r.target(&repo)).unwrap(),
            _ => panic!(),
        };
        let commit = match head_target_target {
            RefTarget::Object(Object::Commit(commit)) => commit,
            _ => panic!(),
        };
        assert_eq!(commit.author_name.as_slice(), author_name.as_bytes());
        assert_eq!(
            commit.author_date,
            DateTime::parse_from_rfc3339(author_date_rfc3339).unwrap()
        );

        // println!("{:?}", commit);
        // println!("{:?}", str::from_utf8(&commit.author));
        // // TODO check commit
        // todo!();
    }
}
