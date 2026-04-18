use crate::directory::{WebDirectory, WebFile};
use rgit_core::traits::AllGenerics;
use std::rc::Rc;

pub struct WebGenerics;
impl AllGenerics for WebGenerics {
    type File = WebFile;

    type Directory = WebDirectory;

    type SharedRef<T: 'static> = Rc<T>;
}
