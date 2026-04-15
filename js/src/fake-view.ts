import type { AppState } from "./state";
import type { RepoView, ViewModel } from "./view";

export const fakeViewModel: ViewModel<AppState, RepoView> = {
  state: {
    type: "commit view",
    commitId: "42",
  },
  model: {
    type: "repo",
    name: "fake-repo",
    inner: {
      type: "commit view",
      commit: {
        id: "4242424242424242424242424242424242424242",
        author_name: "jo bloggs",
        author_email: "jo@bloggs.blog",
        author_date: "2026-01-01T00:00:00Z",
        committer_name: "jay blings",
        committer_email: "jay@blings.industries",
        commit_date: "2030-12-31T23:59:59-08:00",
        tree: "43",
        parents: [
          "0000000000000000000000000000000000000000",
          "ffffffffffffffffffffffffffffffffffffffff",
        ],
        message:
          "a very long commit message with lots of words that are probably unnecessary but are included anyway to test the commit message display wrapping\nsome more lines\nin the\ncommit",
      },
      diff: [
        {
          type: "Both",
          path: "rust/rgit-web/src/directory.rs",
          left_type: "File",
          right_type: "File",
          content:
            '@@ -126,13 +126,9 @@\n         dest: &mut [u8],\n     ) -> Result<usize, FilesystemError> {\n         let mut f = async || -> Result<usize, JsValue> {\n-            if offset.0 > 2u64.pow(53) {\n-                panic!("offset not representable as f64");\n-            }\n+            assert!(offset.0 <= 2u64.pow(53), "offset not representable as f64");\n             let offset = offset.0 as f64;\n-            if dest.len() as u64 > 2u64.pow(53) {\n-                panic!("length not representable as f64");\n-            }\n+            assert!(dest.len() as u64 <= 2u64.pow(53), "length not representable as f64");\n             let length = dest.len() as f64;\n             let data: Uint8Array = self.file.readSegment(offset, length).await?.dyn_into()?;\n             let bytes_read = data.length() as usize;\n',
        },
        {
          type: "Both",
          path: "rust/rgit-web/src/error.rs",
          left_type: "File",
          right_type: "File",
          content:
            '@@ -22,7 +22,7 @@\n             *js_error\n         }\n         _ => match to_value(&err) {\n-            Ok(val) => make_rgit_error(JsString::from(format!("{:?}", err).as_str()), val),\n+            Ok(val) => make_rgit_error(JsString::from(format!("{err:?}").as_str()), val),\n             Err(val) => val.into(),\n         },\n     }\n',
        },
      ],
    },
  },
};
