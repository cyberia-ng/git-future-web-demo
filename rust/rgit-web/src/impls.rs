use crate::directory::{WebDirectory, WebFile};
use rgit_core::traits::AllGenerics;

pub struct WebGenerics;
impl AllGenerics for WebGenerics {
    type File = WebFile;

    type Directory = WebDirectory;
}
