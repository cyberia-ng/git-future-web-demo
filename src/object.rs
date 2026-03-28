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
    character::complete::{alpha1, char, hex_digit0, i32, i64, usize},
    combinator::all_consuming,
    multi::many,
    sequence::{delimited, terminated},
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
            let (rest, body) = take(expected_len).parse(rest)?;
            Ok((rest, (object_type, body)))
        }

        let (_, (object_type, body)) = all_consuming(parse_header_body)
            .parse(data.as_ref())
            .map_err(|_| Error::MalformedObject(id))?;

        let (_, out) = (match object_type {
            b"commit" => all_consuming(Commit::parser(id))
                .map(Object::Commit)
                .parse(body),
            _ => todo!(),
        })
        .map_err(|_| Error::MalformedObject(id))?;
        Ok(out)
    }
}

#[derive(Debug)]
pub struct Commit {
    pub id: ObjectId,
    pub author_name: Vec<u8>,
    pub author_email: Vec<u8>,
    pub author_date: DateTime<FixedOffset>,
    pub committer_name: Vec<u8>,
    pub committer_email: Vec<u8>,
    pub commit_date: DateTime<FixedOffset>,
    pub tree: ObjectId,
    pub parents: Vec<ObjectId>,
    pub message: Vec<u8>,
}

impl Commit {
    fn parser<'a>(id: ObjectId) -> impl Fn(&'a [u8]) -> nom::IResult<&'a [u8], Commit> {
        move |input| {
            let mut p = (
                delimited(tag("tree "), parse_object_id, char('\n')),
                many(0.., delimited(tag("parent "), parse_object_id, char('\n'))),
                delimited(tag("author "), parse_author_committer_line, char('\n')),
                delimited(tag("committer "), parse_author_committer_line, tag("\n\n")),
            );
            let (
                message,
                (
                    tree_id,
                    parents,
                    (author_name, author_email, author_date),
                    (committer_name, committer_email, commit_date),
                ),
            ) = p.parse(input)?;
            Ok((
                &input[input.len()..],
                Commit {
                    id,
                    author_name: author_name.to_vec(),
                    author_email: author_email.to_vec(),
                    author_date,
                    committer_name: committer_name.to_vec(),
                    committer_email: committer_email.to_vec(),
                    commit_date,
                    tree: tree_id,
                    parents,
                    message: message.to_vec(),
                },
            ))
        }
    }
}

fn parse_object_id(input: &[u8]) -> nom::IResult<&[u8], ObjectId> {
    take(40usize)
        .and_then(hex_digit0)
        .map_res(|hex_chars| -> Result<ObjectId, hex::FromHexError> {
            let mut out = ObjectId([0u8; 20]);
            hex::decode_to_slice(hex_chars, &mut out.0)?;
            Ok(out)
        })
        .parse(input)
}

#[allow(clippy::type_complexity)]
fn parse_author_committer_line(
    input: &[u8],
) -> nom::IResult<&[u8], (&[u8], &[u8], DateTime<FixedOffset>)> {
    (
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
    )
        .parse(input)
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
