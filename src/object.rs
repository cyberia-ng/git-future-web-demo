use crate::{
    directory::Directory,
    error::{Error, GResult},
    repo::Repo,
};
use alloc::vec::Vec;
use chrono::{DateTime, FixedOffset};
use miniz_oxide::inflate::decompress_to_vec_zlib;
use nom::{
    Parser,
    branch::alt,
    bytes::complete::{tag, take, take_until},
    character::complete::{alpha1, char, i32, i64, usize},
    combinator::all_consuming,
    sequence::terminated,
};

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
pub enum Object {
    Commit(Commit),
}

impl Object {
    pub async fn lookup<D: Directory>(repo: &Repo<D>, id: ObjectId) -> GResult<Self> {
        let (prefix, suffix) = id.0.split_at(1);
        let mut prefix_buf = [0u8; 2];
        hex::encode_to_slice(prefix, &mut prefix_buf)?;
        let mut suffix_buf = [0u8; 2 * 19];
        hex::encode_to_slice(suffix, &mut suffix_buf)?;
        let mut dir = repo.git_dir.open_subdir(b"objects").await?;
        dir = dir.open_subdir(&prefix_buf).await?;
        let data = dir.read_file(&suffix_buf).await?;
        let data = decompress_to_vec_zlib(&data)?;

        fn parse_header_body(input: &[u8]) -> nom::IResult<&[u8], (&[u8], &[u8])> {
            let (rest, object_type) = terminated(alpha1, char(' ')).parse(input)?;
            let (rest, expected_len) = terminated(usize, char('\0')).parse(rest)?;
            let (rest, body) = all_consuming(take(expected_len)).parse(rest)?;
            Ok((rest, (object_type, body)))
        }
        let (_, (object_type, body)) = parse_header_body
            .parse(data.as_ref())
            .map_err(|_| Error::MalformedObject(id))?;

        match object_type {
            b"commit" => Ok(Object::Commit(
                Commit::from_bytes(id, body).ok_or_else(|| Error::MalformedObject(id))?,
            )),
            _ => todo!(),
        }
    }
}

#[derive(Debug)]
pub struct Commit {
    pub id: ObjectId,
    pub author_name: Vec<u8>,
    pub author_email: Vec<u8>,
    pub author_date: DateTime<FixedOffset>,
    // author_date, committer, commit_date, message, parent(s), tree
}

impl Commit {
    fn from_bytes(id: ObjectId, body: &[u8]) -> Option<Self> {
        let mut author_name: Option<Vec<u8>> = None;
        let mut author_email: Option<Vec<u8>> = None;
        let mut author_date: Option<DateTime<FixedOffset>> = None;
        for line in body.split(|c| *c == b'\n') {
            if let Some(author_line) = line.strip_prefix(b"author ") {
                let (_, (author_name_, author_email_, author_date_)) =
                    parse_author_committer_line(author_line).ok()?;
                author_name = Some(author_name_.to_vec());
                author_email = Some(author_email_.to_vec());
                author_date = Some(author_date_);
            }
        }
        Some(Commit {
            id,
            author_name: author_name?,
            author_email: author_email?,
            author_date: author_date?,
        })
    }
}

fn parse_author_committer_line(
    input: &[u8],
) -> nom::IResult<&[u8], (&[u8], &[u8], DateTime<FixedOffset>)> {
    let mut p = all_consuming((
        terminated(take_until(" <"), tag(" <")),
        terminated(take_until("> "), tag("> ")),
        (
            terminated(i64, char(' ')),
            alt((char('+').map(|_| 1), char('-').map(|_| -1))),
            take(2usize).and_then(all_consuming(i32)),
            take(2usize).and_then(all_consuming(i32)),
        )
            .map_opt(|(timestamp, tz_sign, tz_hour, tz_minute)| {
                let date = DateTime::from_timestamp(timestamp, 0)?;
                let offset = FixedOffset::east_opt(tz_sign * (3600 * tz_hour + 60 * tz_minute))?;
                let author_date = date.with_timezone(&offset);
                Some(author_date)
            }),
    ));
    p.parse(input)
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_parse_author_committer_line() {
        let example = "an author <an-email-address> 0 +0000";
        parse_author_committer_line(example.as_bytes()).unwrap();
    }
}
