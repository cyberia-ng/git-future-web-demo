use crate::{
    directory::Directory,
    error::{Error, GResult},
    reference::Ref,
};

#[derive(Debug)]
pub struct Repo<D> {
    git_dir: D,
}

impl<D: Directory> Repo<D> {
    pub fn new(git_dir: D) -> Self {
        Repo { git_dir }
    }

    pub async fn head(&self) -> GResult<Ref<'_, D>, D> {
        let ref_content = self
            .git_dir
            .read_file("HEAD")
            .await
            .map_err(Error::directory)?;
        let ref_ = Ref::from_content(self, &ref_content)?;
        Ok(ref_)
    }
}

#[cfg(test)]
mod tests {
    use futures::executor::block_on;

    use crate::{reference::RefType, test::repo::TestRepo};

    #[test]
    fn head() {
        let test_repo = TestRepo::new().unwrap();
        let repo = test_repo.repo();
        let head = block_on(repo.head()).unwrap();
        assert_eq!(
            head.ref_type(),
            &RefType::Symbolic(String::from("refs/heads/main"))
        );
    }
}
