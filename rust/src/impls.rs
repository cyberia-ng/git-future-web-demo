use crate::directory::{WebDirectory, WebFile};
use git_future::file_system::FileSystem;

pub struct WebFileSystem;
impl FileSystem for WebFileSystem {
    type File = WebFile;
    type Directory = WebDirectory;
}
