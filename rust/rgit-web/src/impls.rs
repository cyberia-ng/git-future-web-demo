use rgit_core::{sync::SingleThreadedRcCell, traits::AllGenerics};
use crate::directory::{WebDirectory, WebFile};

pub struct WebGenerics;
impl AllGenerics for WebGenerics {
    type File = WebFile;

    type Directory = WebDirectory;

    type SharedCell<T: 'static> = SingleThreadedRcCell<T>;
}
