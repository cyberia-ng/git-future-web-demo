use core::convert::Infallible;
use std::{
    ffi::{OsStr, OsString},
    fs::{OpenOptions, read_dir},
    io::{self, Read, Write},
    path::PathBuf,
    process::{Command, Stdio},
};

use tempfile::{TempDir, tempdir};

use crate::{directory::Directory, repo::Repo};

#[derive(Debug)]
pub struct TestRepo {
    pub location: TempDir,
}

#[derive(Debug, Clone)]
pub struct TestRepoDirectory<'r> {
    repo: &'r TestRepo,
    sub_path: PathBuf,
}

impl TestRepo {
    fn run_git(&self, args: impl IntoIterator<Item = impl AsRef<OsStr>>) -> io::Result<()> {
        let mut git_process = Command::new("git")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .args([OsStr::new("-C"), self.location.path().as_ref()])
            .args(args)
            .spawn()?;
        let status = git_process.wait()?;
        assert!(status.success());
        Ok(())
    }

    pub fn new() -> io::Result<Self> {
        let dir = tempdir()?;
        let repo = TestRepo { location: dir };
        repo.run_git(["init", "--bare"])?;
        Ok(repo)
    }

    pub fn root(&self) -> TestRepoDirectory<'_> {
        TestRepoDirectory {
            repo: self,
            sub_path: PathBuf::new(),
        }
    }

    pub fn repo(&self) -> Repo<TestRepoDirectory<'_>> {
        Repo::new(self.root())
    }

    // pub fn
}

impl<'r> Directory for TestRepoDirectory<'r> {
    type Error = Infallible;
    async fn open_subdir(&self, name: &str) -> Result<Self, Self::Error> {
        let os_path: OsString = name.into();
        let new_sub_path = self.sub_path.join(os_path);
        Ok(Self {
            repo: self.repo,
            sub_path: new_sub_path,
        })
    }

    async fn list_dir(&self) -> Result<Vec<String>, Self::Error> {
        let dir = read_dir(self.repo.location.path().join(&self.sub_path)).unwrap();
        let entries = dir
            .map_while(|entry| {
                if let Ok(entry) = entry {
                    Some(entry.file_name())
                } else {
                    None
                }
            })
            .map(|file_name| file_name.to_str().unwrap().to_owned())
            .collect::<Vec<_>>();
        Ok(entries)
    }

    async fn read_file(&self, name: &str) -> Result<Vec<u8>, Self::Error> {
        let mut file = OpenOptions::new()
            .read(true)
            .open(self.repo.location.path().join(&self.sub_path).join(name))
            .unwrap();
        let mut out = vec![];
        file.read_to_end(&mut out).unwrap();
        Ok(out)
    }
}

pub fn make_some_files() -> io::Result<TempDir> {
    let dir = TempDir::new()?;
    OpenOptions::new()
        .create(true)
        .write(true)
        .open(dir.path().join("a-file"))?;
    Ok(dir)
}
