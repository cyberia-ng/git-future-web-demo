use core::future::Future;

use alloc::{string::String, vec::Vec};

pub trait Directory: Sized {
    type Error: core::fmt::Debug;

    fn open_subdir(&self, name: &str) -> impl Future<Output = Result<Self, Self::Error>>;
    fn list_dir(&self) -> impl Future<Output = Result<Vec<String>, Self::Error>>;
    fn read_file(&self, name: &str) -> impl Future<Output = Result<Vec<u8>, Self::Error>>;
}
