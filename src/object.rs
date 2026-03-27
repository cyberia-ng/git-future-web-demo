use crate::{
    directory::Directory,
    error::{Error, GResult},
    repo::Repo,
};
use alloc::vec::Vec;
use miniz_oxide::inflate::decompress_to_vec_zlib;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ObjectId([u8; 20]);

impl ObjectId {
    pub fn from_encoded(s: &[u8]) -> GResult<Self> {
        let mut buf = [0u8; 20];
        hex::decode_to_slice(s.trim_ascii(), &mut buf)?;
        Ok(ObjectId(buf))
    }
}

#[derive(Debug)]
pub enum Object<'r, D> {
    Commit(Commit<'r, D>),
}

impl<'r, D: Directory> Object<'r, D> {
    pub async fn lookup(repo: &'r Repo<D>, id: ObjectId) -> GResult<Self> {
        let (prefix, suffix) = id.0.split_at(1);
        let mut prefix_buf = [0u8; 2 * 1];
        hex::encode_to_slice(prefix, &mut prefix_buf)?;
        let mut suffix_buf = [0u8; 2 * 19];
        hex::encode_to_slice(suffix, &mut suffix_buf)?;
        let mut dir = repo.git_dir.open_subdir(b"objects").await?;
        dir = dir.open_subdir(&prefix_buf).await?;
        let data = dir.read_file(&suffix_buf).await?;
        let data = decompress_to_vec_zlib(&data)?;

        let mut blocks = data.split(|b| *b == b'\0');
        let header = blocks.next().ok_or_else(|| Error::MalformedObject(id))?;
        let mut header_toks = header.split(|b| *b == b' ');
        let object_type = header_toks
            .next()
            .ok_or_else(|| Error::MalformedObject(id))?;
        let expected_length = header_toks
            .next()
            .ok_or_else(|| Error::MalformedObject(id))?;
        let expected_length_parsed = usize::from_str_radix(str::from_utf8(expected_length)?, 10)
            .map_err(|_| Error::MalformedObject(id))?;
        if header_toks.next().is_some() {
            return Err(Error::MalformedObject(id));
        }
        let body = data
            .get(object_type.len() + 1 + expected_length.len() + 1..expected_length_parsed)
            .ok_or_else(|| Error::MalformedObject(id))?;

        match object_type {
            b"commit" => Ok(Object::Commit(Commit::from_bytes(repo, id, body)?)),
            _ => todo!(),
        }
    }
}

#[derive(Debug)]
pub struct Commit<'r, D> {
    repo: &'r Repo<D>,
    pub id: ObjectId,
    pub author: Vec<u8>,
    // author_date, committer, commit_date, message, parent(s), tree
}

impl<'r, D> Commit<'r, D> {
    fn from_bytes(repo: &'r Repo<D>, id: ObjectId, body: &[u8]) -> GResult<Self> {
        let mut out = Commit {
            id,
            repo,
            author: Vec::new(),
        };
        for line in body.split(|c| *c == b'\n') {
            if let Some(author_line) = line.strip_prefix(b"author ") {
                let mut tokens = author_line.split(|b| *b == b' ');
                let tz = tokens
                    .next_back()
                    .ok_or_else(|| Error::MalformedObject(id))?;
                let timestamp = tokens
                    .next_back()
                    .ok_or_else(|| Error::MalformedObject(id))?;
                let author_len = author_line.len() - tz.len() - 1 - timestamp.len() - 1;
                out.author.extend_from_slice(&author_line[0..author_len]);
            }
        }
        Ok(out)
    }
}
