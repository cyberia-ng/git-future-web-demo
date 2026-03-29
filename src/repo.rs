use crate::{
    directory::Directory,
    error::{Error, GResult, RefPath},
    reference::Ref,
};

#[derive(Debug)]
pub struct Repo<D> {
    pub(crate) git_dir: D,
}

impl<D: Directory> Repo<D> {
    pub fn new(git_dir: D) -> Self {
        Repo { git_dir }
    }

    pub async fn head(&self) -> GResult<Ref> {
        let ref_content = self.git_dir.read_file(b"HEAD").await?;
        let (_, reference) =
            Ref::parse(&ref_content).map_err(|_| Error::MalformedRef(RefPath::Head))?;
        Ok(reference)
    }
}

#[cfg(test)]
mod tests {
    use crate::{reference::Ref, test::repo::TestRepo};
    use futures::executor::block_on;

    #[test]
    fn read_head() {
        let test_repo = TestRepo::new().unwrap();
        let repo = test_repo.repo();
        let head = block_on(repo.head()).unwrap();
        assert_eq!(head, Ref::Symbolic(Vec::from(b"heads/main")));
    }
}
