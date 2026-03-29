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
pub struct ObjectId(pub [u8; 20]);

impl ObjectId {
    pub(crate) fn parse(input: &[u8]) -> nom::IResult<&[u8], Self> {
        take(40usize)
            .and_then(all_consuming(hex_digit0))
            .map_res(|hex_str| {
                let mut buf = [0u8; 20];
                hex::decode_to_slice(hex_str, &mut buf)?;
                Ok::<ObjectId, hex::FromHexError>(ObjectId(buf))
            })
            .parse(input)
    }

    pub fn from_encoded(s: &[u8]) -> Option<Self> {
        let (_, oid) = all_consuming(Self::parse).parse(s).ok()?;
        Some(oid)
    }
}

#[derive(Debug, PartialEq, Eq)]
pub enum Object {
    Commit(Commit),
    Tree,
    Blob,
    Tag,
    // others?
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

        let (_, out) = Object::parser(id)
            .parse(data.as_ref())
            .map_err(|_| Error::MalformedObject(id))?;
        Ok(out)
    }

    fn parser<'a>(id: ObjectId) -> impl Fn(&'a [u8]) -> nom::IResult<&'a [u8], Object> {
        fn parse_header_body(input: &[u8]) -> nom::IResult<&[u8], (&[u8], &[u8])> {
            let (rest, object_type) = terminated(alpha1, char(' ')).parse(input)?;
            let (rest, expected_len) = terminated(usize, char('\0')).parse(rest)?;
            let (rest, body) = take(expected_len).parse(rest)?;
            Ok((rest, (object_type, body)))
        }

        move |input: &[u8]| {
            let (_, (object_type, body)) = all_consuming(parse_header_body).parse(input)?;
            let (_, out) = match object_type {
                b"commit" => all_consuming(Commit::parser(id))
                    .map(Object::Commit)
                    .parse(body)?,
                _ => todo!(),
            };
            Ok((&[][..], out))
        }
    }
}

#[derive(Debug, PartialEq, Eq)]
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
                &input[..0],
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
    use futures::executor::block_on;

    use super::*;
    use crate::test::repo::{TestRepo, make_basic_commit};

    #[test]
    fn lookup_commit() {
        let test_repo = TestRepo::new().unwrap();
        make_basic_commit(&test_repo);
        let commit_id = test_repo.run_git(["rev-parse", "HEAD"]).unwrap();
        let commit_id = ObjectId::from_encoded(commit_id.trim_ascii()).unwrap();

        let repo = test_repo.repo();
        let object = block_on(Object::lookup(&repo, commit_id)).unwrap();
        match object {
            Object::Commit(commit) => {
                assert_eq!(commit.id, commit_id);
            }
            Object::Tree => panic!(),
            Object::Blob => panic!(),
            Object::Tag => panic!(),
        }
    }

    #[test]
    fn test_parse_object_invalid_length() {
        let data = b"commit 169\0tree 3a4df67dd7fd7cb3ca82d9896dbdd28053d39bdb
author a-user <an-email-address> 1774735018 +0530
committer another-user <another-email-address> 1774735019 -0800

a commit
";
        let result = Object::parser(ObjectId([0u8; 20])).parse(data);
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_root_commit() {
        let data = b"commit 170\0tree 3a4df67dd7fd7cb3ca82d9896dbdd28053d39bdb
author a-user <an-email-address> 1774735018 +0530
committer another-user <another-email-address> 1774735019 -0800

a commit
";
        let (rest, object) = Object::parser(ObjectId([0u8; 20])).parse(data).unwrap();
        assert_eq!(rest, &[]);
        let commit = match object {
            Object::Commit(commit) => commit,
            _ => panic!(),
        };
        assert_eq!(&commit.parents, &[]);
        assert_eq!(
            commit.tree,
            ObjectId([
                0x3a, 0x4d, 0xf6, 0x7d, 0xd7, 0xfd, 0x7c, 0xb3, 0xca, 0x82, 0xd9, 0x89, 0x6d, 0xbd,
                0xd2, 0x80, 0x53, 0xd3, 0x9b, 0xdb,
            ])
        );
        assert_eq!(str::from_utf8(&commit.author_name).unwrap(), "a-user");
        assert_eq!(
            str::from_utf8(&commit.author_email).unwrap(),
            "an-email-address"
        );
        assert_eq!(
            commit.author_date,
            DateTime::parse_from_rfc3339("2026-03-29T03:26:58+05:30").unwrap()
        );
        assert_eq!(
            str::from_utf8(&commit.committer_name).unwrap(),
            "another-user"
        );
        assert_eq!(
            str::from_utf8(&commit.committer_email).unwrap(),
            "another-email-address"
        );
        assert_eq!(
            commit.commit_date,
            DateTime::parse_from_rfc3339("2026-03-28T13:56:59-08:00").unwrap()
        );
        assert_eq!(str::from_utf8(&commit.message).unwrap(), "a commit\n");
    }

    #[test]
    fn test_parse_normal_commit() {
        let data = b"commit 213\0tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904
parent 16dafd3d0ba5af72f035d641c076a4150eda548d
author a-user <an-email-address> 1774739676 +0000
committer a-user <an-email-address> 1774739676 +0000

another commit
";
        let (_, object) = Object::parser(ObjectId([0u8; 20])).parse(data).unwrap();
        let commit = match object {
            Object::Commit(commit) => commit,
            _ => panic!(),
        };
        assert_eq!(
            &commit.parents,
            &[ObjectId([
                0x16, 0xda, 0xfd, 0x3d, 0x0b, 0xa5, 0xaf, 0x72, 0xf0, 0x35, 0xd6, 0x41, 0xc0, 0x76,
                0xa4, 0x15, 0x0e, 0xda, 0x54, 0x8d,
            ])]
        );
    }

    #[test]
    fn test_parse_merge_commit() {
        let data = b"commit 268\0tree bfb6d701e108f3be27395bd60c3417b47ffbe7d9
parent f625376d12f2edc71cff70bb42d387ddf2408460
parent 6904799d30a34bfcf6ca6a3526fc8b771ed6705c
author a-user <an-email-address> 1774740069 +0000
committer a-user <an-email-address> 1774740069 +0000

Merge branch 'branch'
";
        let (_, object) = Object::parser(ObjectId([0u8; 20])).parse(data).unwrap();
        let commit = match object {
            Object::Commit(commit) => commit,
            _ => panic!(),
        };
        assert_eq!(commit.parents.len(), 2);
    }

    #[test]
    fn test_parse_author_committer_line() {
        let example = "an author <an-email-address> 0 +0000";
        parse_author_committer_line(example.as_bytes()).unwrap();
    }
}
