use core::{any::Any, future::Future};

use alloc::{boxed::Box, string::String, vec::Vec};

#[derive(Debug)]
pub struct DirectoryError(Box<dyn Any>);

pub trait Directory: Sized + Clone {
    fn open_subdir(&self, name: &str) -> impl Future<Output = Result<Self, DirectoryError>>;
    fn list_dir(&self) -> impl Future<Output = Result<Vec<String>, DirectoryError>>;
    fn read_file(&self, name: &str) -> impl Future<Output = Result<Vec<u8>, DirectoryError>>;
}
