use alloc::{boxed::Box, string::String, vec::Vec};
use core::{any::Any, future::Future};

#[derive(Debug)]
pub struct DirectoryError(pub Box<dyn Any>);

pub trait Directory: Sized + Clone {
    fn open_subdir(&self, name: &[u8]) -> impl Future<Output = Result<Self, DirectoryError>>;
    fn list_dir(&self) -> impl Future<Output = Result<Vec<String>, DirectoryError>>;
    fn read_file(&self, name: &[u8]) -> impl Future<Output = Result<Vec<u8>, DirectoryError>>;
}
