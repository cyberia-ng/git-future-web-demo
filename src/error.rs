use crate::{directory::DirectoryError, object::ObjectId};
use alloc::vec::Vec;
use miniz_oxide::inflate::DecompressError;

pub type GResult<T> = core::result::Result<T, Error>;

#[derive(Debug)]
pub enum Error {
    Directory(DirectoryError),
    Utf8Error(core::str::Utf8Error),
    FromHexError(hex::FromHexError),
    PathError(Vec<u8>),
    DecompressError(DecompressError),
    MalformedObject(ObjectId),
}

impl From<core::str::Utf8Error> for Error {
    fn from(value: core::str::Utf8Error) -> Self {
        Self::Utf8Error(value)
    }
}

impl From<hex::FromHexError> for Error {
    fn from(value: hex::FromHexError) -> Self {
        Self::FromHexError(value)
    }
}

impl From<DirectoryError> for Error {
    fn from(value: DirectoryError) -> Self {
        Self::Directory(value)
    }
}

impl From<DecompressError> for Error {
    fn from(value: DecompressError) -> Self {
        Self::DecompressError(value)
    }
}
