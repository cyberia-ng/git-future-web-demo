use crate::directory::DirectoryError;
use alloc::string::String;

pub type GResult<T> = core::result::Result<T, Error>;

#[derive(Debug)]
pub enum Error {
    Directory(DirectoryError),
    Utf8Error(core::str::Utf8Error),
    FromHexError(hex::FromHexError),
    PathError(String),
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
