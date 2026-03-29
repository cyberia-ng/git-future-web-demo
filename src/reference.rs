use crate::{
    directory::Directory,
    error::{Error, GResult, RefPath},
    object::{Object, ObjectId},
    repo::Repo,
};
use alloc::vec::Vec;
use nom::{
    Parser,
    branch::alt,
    bytes::complete::tag,
    character::complete::{newline, not_line_ending},
    combinator::all_consuming,
    sequence::{preceded, terminated},
};

#[derive(Debug, PartialEq, Eq)]
pub enum Ref {
    Direct(ObjectId),
    Symbolic(Vec<u8>),
}

#[derive(Debug, PartialEq, Eq)]
pub enum RefTarget {
    Ref(Ref),
    Object(Object),
}

impl Ref {
    pub(crate) fn parse(content: &[u8]) -> nom::IResult<&[u8], Self> {
        all_consuming(terminated(not_line_ending, newline))
            .and_then(alt((
                ObjectId::parse.map(Ref::Direct),
                preceded(tag(&b"ref: refs/"[..]), |input: &[u8]| {
                    Ok((&[][..], Ref::Symbolic(input.to_vec())))
                }),
            )))
            .parse(content)
    }

    pub async fn target<D: Directory>(&self, repo: &Repo<D>) -> GResult<RefTarget> {
        use Ref::*;
        match &self {
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
                let (_, reference) = Self::parse(&file_content)
                    .map_err(|_| Error::MalformedRef(RefPath::Ref(s.to_vec())))?;
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
        object::{Object, ObjectId},
        reference::{Ref, RefTarget},
        test::repo::TestRepo,
    };
    use futures::executor::block_on;
    use std::{fs::OpenOptions, io::Write as _};

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
        test_repo.commit("a commit message").unwrap();
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
            RefTarget::Ref(reference) => {
                match reference {
                    Ref::Symbolic(_) => panic!(),
                    Ref::Direct(_) => {
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
        match head_target_target {
            RefTarget::Object(Object::Commit(_)) => {}
            _ => panic!(),
        }
    }

    #[test]
    fn parse_direct_ref() {
        let content = b"6121d0b97779278fcc32cc8a02754e7c588d9c18\n";
        let (_, parsed) = Ref::parse(content).unwrap();
        assert_eq!(
            parsed,
            Ref::Direct(ObjectId([
                0x61, 0x21, 0xd0, 0xb9, 0x77, 0x79, 0x27, 0x8f, 0xcc, 0x32, 0xcc, 0x8a, 0x02, 0x75,
                0x4e, 0x7c, 0x58, 0x8d, 0x9c, 0x18,
            ]))
        );
    }

    #[test]
    fn parse_symbolic_ref() {
        let content = b"ref: refs/heads/main\n";
        let (_, parsed) = Ref::parse(content).unwrap();
        assert_eq!(parsed, Ref::Symbolic(b"heads/main".to_vec()));
    }
}
