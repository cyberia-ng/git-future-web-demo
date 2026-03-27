use std::{
    ffi::OsStr,
    fs::{OpenOptions, read_dir},
    io::{self, Read, Write},
    path::{Path, PathBuf},
    process::{Command, Stdio},
};

use tempfile::{TempDir, tempdir};

use crate::{
    directory::{Directory, DirectoryError},
    repo::Repo,
};

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
        self.run_git_stdin(args, &[])
    }

    fn run_git_stdin(
        &self,
        args: impl IntoIterator<Item = impl AsRef<OsStr>>,
        stdin: &[u8],
    ) -> io::Result<()> {
        let mut git_process = Command::new("git")
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .args([OsStr::new("-C"), self.location.path().as_ref()])
            .args(args)
            .spawn()?;
        git_process.stdin.take().unwrap().write_all(stdin).unwrap();
        let status = git_process.wait()?;
        assert!(status.success());
        Ok(())
    }

    pub fn new() -> io::Result<Self> {
        let dir = tempdir()?;
        let repo = TestRepo { location: dir };
        repo.run_git(["init"])?;
        repo.run_git(["config", "user.name", "somebody"])?;
        repo.run_git(["config", "user.email", "some-email"])?;
        Ok(repo)
    }

    pub fn git_dir(&self) -> TestRepoDirectory<'_> {
        TestRepoDirectory {
            repo: self,
            sub_path: PathBuf::from(".git"),
        }
    }

    pub fn working_tree_path(&self) -> &Path {
        self.location.path()
    }

    pub fn repo(&self) -> Repo<TestRepoDirectory<'_>> {
        Repo::new(self.git_dir())
    }

    pub fn add_all(&self) -> io::Result<()> {
        self.run_git(["add", "--all"])
    }

    pub fn commit(&self, message: &str) -> io::Result<()> {
        self.run_git_stdin(["commit", "-F", "-"], message.as_bytes())
    }
}

impl<'r> Directory for TestRepoDirectory<'r> {
    async fn open_subdir(&self, name: &[u8]) -> Result<Self, DirectoryError> {
        let new_sub_path = self.sub_path.join(str::from_utf8(name).unwrap());
        Ok(Self {
            repo: self.repo,
            sub_path: new_sub_path,
        })
    }

    async fn list_dir(&self) -> Result<Vec<String>, DirectoryError> {
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

    async fn read_file(&self, name: &[u8]) -> Result<Vec<u8>, DirectoryError> {
        let mut file = OpenOptions::new()
            .read(true)
            .open(
                self.repo
                    .location
                    .path()
                    .join(&self.sub_path)
                    .join(str::from_utf8(name).unwrap()),
            )
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
