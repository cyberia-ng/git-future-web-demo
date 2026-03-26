use crate::directory::Directory;

pub type GResult<T, D> = core::result::Result<T, Error<<D as Directory>::Error>>;

#[derive(Debug)]
pub enum InternalError {
    Utf8Error(core::str::Utf8Error),
    FromHexError(hex::FromHexError),
}

#[derive(Debug)]
pub enum Error<DirectoryError> {
    Directory(DirectoryError),
    Internal(InternalError),
}

impl<DirectoryError> Error<DirectoryError> {
    pub const fn internal(error: InternalError) -> Self {
        Error::Internal(error)
    }

    pub const fn directory(error: DirectoryError) -> Self {
        Error::Directory(error)
    }
}

impl<DirectoryError> From<core::str::Utf8Error> for Error<DirectoryError> {
    fn from(value: core::str::Utf8Error) -> Self {
        Self::Internal(InternalError::Utf8Error(value))
    }
}

impl<DirectoryError> From<hex::FromHexError> for Error<DirectoryError> {
    fn from(value: hex::FromHexError) -> Self {
        Self::Internal(InternalError::FromHexError(value))
    }
}
