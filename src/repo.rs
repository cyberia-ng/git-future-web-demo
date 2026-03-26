use crate::{directory::Directory, error::GResult, reference::Ref};

#[derive(Debug)]
pub struct Repo<D> {
    pub(crate) git_dir: D,
}

impl<D: Directory> Repo<D> {
    pub fn new(git_dir: D) -> Self {
        Repo { git_dir }
    }

    pub async fn head(&self) -> GResult<Ref<'_, D>> {
        let ref_content = self.git_dir.read_file("HEAD").await?;
        let reference = Ref::from_content(self, &ref_content)?;
        Ok(reference)
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        reference::{RefTarget, RefType},
        test::repo::TestRepo,
    };
    use futures::executor::block_on;
    use std::{fs::OpenOptions, io::Write as _};

    #[test]
    fn read_head() {
        let test_repo = TestRepo::new().unwrap();
        let repo = test_repo.repo();
        let head = block_on(repo.head()).unwrap();
        assert_eq!(
            head.ref_type(),
            &RefType::Symbolic(String::from("heads/main"))
        );
    }

    #[test]
    fn resolve_head() {
        let test_repo = TestRepo::new().unwrap();
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
        test_repo.commit("a commit").unwrap();

        let repo = test_repo.repo();
        let head = block_on(repo.head()).unwrap();
        let head_target = block_on(head.target()).unwrap();
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
}
