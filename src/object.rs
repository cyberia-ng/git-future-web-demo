#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ObjectId([u8; 20]);

impl ObjectId {
    pub fn from_encoded(s: impl AsRef<[u8]>) -> Result<Self, hex::FromHexError> {
        let mut buf = [0u8; 20];
        hex::decode_to_slice(s, &mut buf)?;
        Ok(ObjectId(buf))
    }
}
