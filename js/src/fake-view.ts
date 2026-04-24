import type { Commit } from "../pkg/rgit_web";
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
        id: () => "4242424242424242424242424242424242424242",
        author_name: () => "jo bloggs",
        author_email: () => "jo@bloggs.blog",
        author_date: () => "2026-01-01T00:00:00Z",
        committer_name: () => "jay blings",
        committer_email: () => "jay@blings.industries",
        commit_date: () => "2030-12-31T23:59:59-08:00",
        tree: () => "43",
        parents: () => [
          "0000000000000000000000000000000000000000",
          "ffffffffffffffffffffffffffffffffffffffff",
        ],
        message: () =>
          "a very long commit message with lots of words that are probably unnecessary but are included anyway to test the commit message display wrapping\nsome more lines\nin the\ncommit",
      } satisfies Partial<Commit> as Commit,
      diff: [
        {
          type: "Both",
          path: "rust/rgit-web/src/diff.rs",
          left_type: "File",
          right_type: "File",
          content: [
            {
              old_start: 2,
              old_end: 39,
              new_start: 2,
              new_end: 39,
              changes: [
                {
                  tag: "equal",
                  value: "use std::io::Cursor;\n",
                },
                {
                  tag: "equal",
                  value: "use wasm_bindgen::prelude::*;\n",
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value: "use crate::{error::to_js_error, object::WebTree};\n",
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value: "#[wasm_bindgen]\n",
                },
                {
                  tag: "delete",
                  value: "pub struct WebDiff(pub(crate) Vec<DiffEntry<Vec<u8>>>);\n",
                },
                {
                  tag: "insert",
                  value: "pub struct WebDiff(pub(crate) Vec<DiffEntry<String>>);\n",
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value: "#[wasm_bindgen]\n",
                },
                {
                  tag: "equal",
                  value: "impl WebDiff {\n",
                },
                {
                  tag: "equal",
                  value:
                    "    pub async fn diff(left: &WebTree, right: &WebTree) -> Result<WebDiff, JsValue> {\n",
                },
                {
                  tag: "equal",
                  value: "        let tree_diff = TreeDiff::new(&left.0, &right.0)\n",
                },
                {
                  tag: "equal",
                  value: "            .await\n",
                },
                {
                  tag: "equal",
                  value: "            .map_err(to_js_error)?;\n",
                },
                {
                  tag: "equal",
                  value: "        let diff = tree_diff\n",
                },
                {
                  tag: "equal",
                  value: "            .to_text_diff(Default::default())\n",
                },
                {
                  tag: "equal",
                  value: "            .await\n",
                },
                {
                  tag: "equal",
                  value: "            .map_err(to_js_error)?;\n",
                },
                {
                  tag: "delete",
                  value: "        Ok(WebDiff(\n",
                },
                {
                  tag: "delete",
                  value: "            diff.entries()\n",
                },
                {
                  tag: "delete",
                  value: "                .iter()\n",
                },
                {
                  tag: "delete",
                  value: "                .map(|e| {\n",
                },
                {
                  tag: "delete",
                  value: "                    e.map_content(|text_diff| {\n",
                },
                {
                  tag: "delete",
                  value: "                        let unified = text_diff.unified_diff();\n",
                },
                {
                  tag: "delete",
                  value: "                        let mut cursor = Cursor::new(Vec::new());\n",
                },
                {
                  tag: "delete",
                  value: "                        unified.to_writer(&mut cursor).unwrap();\n",
                },
                {
                  tag: "delete",
                  value: "                        cursor.into_inner()\n",
                },
                {
                  tag: "delete",
                  value: "                    })\n",
                },
                {
                  tag: "insert",
                  value: "        let mut entries = Vec::new();\n",
                },
                {
                  tag: "insert",
                  value: "        for entry in diff.entries() {\n",
                },
                {
                  tag: "insert",
                  value: "            let entry = entry\n",
                },
                {
                  tag: "insert",
                  value: "                .map_content_res(|c| {\n",
                },
                {
                  tag: "insert",
                  value: "                    let mut cursor = Cursor::new(Vec::new());\n",
                },
                {
                  tag: "insert",
                  value: "                    c.unified_diff().to_writer(&mut cursor).unwrap();\n",
                },
                {
                  tag: "insert",
                  value: "                    let buf = cursor.into_inner();\n",
                },
                {
                  tag: "insert",
                  value: "                    String::from_utf8(buf)\n",
                },
                {
                  tag: "equal",
                  value: "                })\n",
                },
                {
                  tag: "delete",
                  value: "                .collect::<Vec<_>>(),\n",
                },
                {
                  tag: "delete",
                  value: "        ))\n",
                },
                {
                  tag: "insert",
                  value: '                .map_err(|_| JsError::new("invalid UTF-8"))?;\n',
                },
                {
                  tag: "insert",
                  value: "            entries.push(entry);\n",
                },
                {
                  tag: "insert",
                  value: "        }\n",
                },
                {
                  tag: "insert",
                  value: "        Ok(WebDiff(entries))\n",
                },
                {
                  tag: "equal",
                  value: "    }\n",
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value: "    pub fn to_js(&self) -> Result<JsValue, JsValue> {\n",
                },
                {
                  tag: "equal",
                  value: "        Ok(to_value(&self.0)?)\n",
                },
                {
                  tag: "equal",
                  value: "    }\n",
                },
                {
                  tag: "equal",
                  value: "}\n",
                },
              ],
            },
          ],
        },
        {
          type: "Both",
          path: "rust/rgit-web/src/object.rs",
          left_type: "File",
          right_type: "File",
          content: [
            {
              old_start: 5,
              old_end: 17,
              new_start: 5,
              new_end: 25,
              changes: [
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value: "#[wasm_bindgen]\n",
                },
                {
                  tag: "equal",
                  value: "pub struct WebObject(pub(crate) Object<WebDirectory>);\n",
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value: "#[wasm_bindgen]\n",
                },
                {
                  tag: "equal",
                  value: "impl WebObject {\n",
                },
                {
                  tag: "insert",
                  value: "    pub fn commit(&self) -> Result<WebCommit, JsValue> {\n",
                },
                {
                  tag: "insert",
                  value:
                    "        let commit = self.0.clone().commit().map_err(|e| to_js_error(e.into()))?;\n",
                },
                {
                  tag: "insert",
                  value: "        Ok(WebCommit(commit))\n",
                },
                {
                  tag: "insert",
                  value: "    }\n",
                },
                {
                  tag: "insert",
                  value: "}\n",
                },
                {
                  tag: "insert",
                  value: "\n",
                },
                {
                  tag: "insert",
                  value: "#[wasm_bindgen]\n",
                },
                {
                  tag: "insert",
                  value: "impl WebObject {\n",
                },
                {
                  tag: "equal",
                  value: "    pub fn to_js(&self) -> Result<JsValue, JsValue> {\n",
                },
                {
                  tag: "equal",
                  value: "        Ok(to_value(&self.0)?)\n",
                },
                {
                  tag: "equal",
                  value: "    }\n",
                },
                {
                  tag: "equal",
                  value: "}\n",
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value: "#[wasm_bindgen]\n",
                },
              ],
            },
            {
              old_start: 19,
              old_end: 32,
              new_start: 27,
              new_end: 45,
              changes: [
                {
                  tag: "equal",
                  value: "#[wasm_bindgen]\n",
                },
                {
                  tag: "equal",
                  value: "impl WebCommit {\n",
                },
                {
                  tag: "equal",
                  value: "    pub fn to_js(&self) -> Result<JsValue, JsValue> {\n",
                },
                {
                  tag: "equal",
                  value: "        Ok(to_value(&self.0)?)\n",
                },
                {
                  tag: "equal",
                  value: "    }\n",
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "delete",
                  value: "    pub async fn tree(&self) -> Result<WebTree, JsValue> {\n",
                },
                {
                  tag: "insert",
                  value: "    pub async fn lookup_tree(&self) -> Result<WebTree, JsValue> {\n",
                },
                {
                  tag: "equal",
                  value: "        Ok(WebTree(self.0.lookup_tree().await.map_err(to_js_error)?))\n",
                },
                {
                  tag: "equal",
                  value: "    }\n",
                },
                {
                  tag: "insert",
                  value: "\n",
                },
                {
                  tag: "insert",
                  value:
                    "    pub async fn lookup_parents(&self) -> Result<Vec<WebCommit>, JsValue> {\n",
                },
                {
                  tag: "insert",
                  value:
                    "        let parents = self.0.lookup_parents().await.map_err(to_js_error)?;\n",
                },
                {
                  tag: "insert",
                  value: "        Ok(parents.into_iter().map(WebCommit).collect())\n",
                },
                {
                  tag: "insert",
                  value: "    }\n",
                },
                {
                  tag: "equal",
                  value: "}\n",
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value: "#[wasm_bindgen]\n",
                },
                {
                  tag: "equal",
                  value: "pub struct WebTree(pub(crate) Tree<WebDirectory>);\n",
                },
              ],
            },
          ],
        },
        {
          type: "Both",
          path: "rust/rgit-core/src/diff.rs",
          left_type: "File",
          right_type: "File",
          content: [
            {
              old_start: 0,
              old_end: 7,
              new_start: 0,
              new_end: 9,
              changes: [
                {
                  tag: "equal",
                  value: "#![allow(missing_docs)]\n",
                },
                {
                  tag: "insert",
                  value: "use core::convert::Infallible;\n",
                },
                {
                  tag: "insert",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value: "use crate::{\n",
                },
                {
                  tag: "equal",
                  value: "    Repo,\n",
                },
                {
                  tag: "equal",
                  value: "    error::{Error, GResult},\n",
                },
                {
                  tag: "equal",
                  value: "    file_system::Directory,\n",
                },
                {
                  tag: "equal",
                  value: "    object::{Object, ObjectId, Tree, TreeEntry, TreeEntryType},\n",
                },
                {
                  tag: "equal",
                  value: "};\n",
                },
              ],
            },
            {
              old_start: 36,
              old_end: 48,
              new_start: 38,
              new_end: 51,
              changes: [
                {
                  tag: "equal",
                  value: "        None => Path(component.to_vec()),\n",
                },
                {
                  tag: "equal",
                  value: "    }\n",
                },
                {
                  tag: "equal",
                  value: "}\n",
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value: "#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Clone)]\n",
                },
                {
                  tag: "equal",
                  value: '#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]\n',
                },
                {
                  tag: "insert",
                  value: '#[cfg_attr(feature = "serde", serde(tag = "type"))]\n',
                },
                {
                  tag: "equal",
                  value: "pub enum DiffEntry<Content> {\n",
                },
                {
                  tag: "equal",
                  value: "    LeftOnly {\n",
                },
                {
                  tag: "equal",
                  value: "        path: Path,\n",
                },
                {
                  tag: "equal",
                  value: "        entry_type: TreeEntryType,\n",
                },
                {
                  tag: "equal",
                  value: "        content: Content,\n",
                },
                {
                  tag: "equal",
                  value: "    },\n",
                },
              ],
            },
            {
              old_start: 57,
              old_end: 101,
              new_start: 60,
              new_end: 112,
              changes: [
                {
                  tag: "equal",
                  value: "        content: Content,\n",
                },
                {
                  tag: "equal",
                  value: "    },\n",
                },
                {
                  tag: "equal",
                  value: "}\n",
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value: "impl<Content> DiffEntry<Content> {\n",
                },
                {
                  tag: "equal",
                  value:
                    "    pub fn map_content<T>(&self, fun: impl Fn(&Content) -> T) -> DiffEntry<T> {\n",
                },
                {
                  tag: "insert",
                  value: "        self.map_content_res(|c| Ok::<T, Infallible>(fun(c)))\n",
                },
                {
                  tag: "insert",
                  value: "            .unwrap()\n",
                },
                {
                  tag: "insert",
                  value: "    }\n",
                },
                {
                  tag: "insert",
                  value: "\n",
                },
                {
                  tag: "insert",
                  value: "    pub fn map_content_res<T, E>(\n",
                },
                {
                  tag: "insert",
                  value: "        &self,\n",
                },
                {
                  tag: "insert",
                  value: "        fun: impl Fn(&Content) -> Result<T, E>,\n",
                },
                {
                  tag: "insert",
                  value: "    ) -> Result<DiffEntry<T>, E> {\n",
                },
                {
                  tag: "equal",
                  value: "        use DiffEntry::*;\n",
                },
                {
                  tag: "delete",
                  value: "        match self {\n",
                },
                {
                  tag: "insert",
                  value: "        Ok(match self {\n",
                },
                {
                  tag: "equal",
                  value: "            LeftOnly {\n",
                },
                {
                  tag: "equal",
                  value: "                path,\n",
                },
                {
                  tag: "equal",
                  value: "                entry_type,\n",
                },
                {
                  tag: "equal",
                  value: "                content,\n",
                },
                {
                  tag: "equal",
                  value: "            } => DiffEntry::LeftOnly {\n",
                },
                {
                  tag: "equal",
                  value: "                path: path.clone(),\n",
                },
                {
                  tag: "equal",
                  value: "                entry_type: *entry_type,\n",
                },
                {
                  tag: "delete",
                  value: "                content: fun(content),\n",
                },
                {
                  tag: "insert",
                  value: "                content: fun(content)?,\n",
                },
                {
                  tag: "equal",
                  value: "            },\n",
                },
                {
                  tag: "equal",
                  value: "            Both {\n",
                },
                {
                  tag: "equal",
                  value: "                path,\n",
                },
                {
                  tag: "equal",
                  value: "                left_type,\n",
                },
                {
                  tag: "equal",
                  value: "                right_type,\n",
                },
                {
                  tag: "equal",
                  value: "                content,\n",
                },
                {
                  tag: "equal",
                  value: "            } => DiffEntry::Both {\n",
                },
                {
                  tag: "equal",
                  value: "                path: path.clone(),\n",
                },
                {
                  tag: "equal",
                  value: "                left_type: *left_type,\n",
                },
                {
                  tag: "equal",
                  value: "                right_type: *right_type,\n",
                },
                {
                  tag: "delete",
                  value: "                content: fun(content),\n",
                },
                {
                  tag: "insert",
                  value: "                content: fun(content)?,\n",
                },
                {
                  tag: "equal",
                  value: "            },\n",
                },
                {
                  tag: "equal",
                  value: "            RightOnly {\n",
                },
                {
                  tag: "equal",
                  value: "                path,\n",
                },
                {
                  tag: "equal",
                  value: "                entry_type,\n",
                },
                {
                  tag: "equal",
                  value: "                content,\n",
                },
                {
                  tag: "equal",
                  value: "            } => DiffEntry::RightOnly {\n",
                },
                {
                  tag: "equal",
                  value: "                path: path.clone(),\n",
                },
                {
                  tag: "equal",
                  value: "                entry_type: *entry_type,\n",
                },
                {
                  tag: "delete",
                  value: "                content: fun(content),\n",
                },
                {
                  tag: "insert",
                  value: "                content: fun(content)?,\n",
                },
                {
                  tag: "equal",
                  value: "            },\n",
                },
                {
                  tag: "delete",
                  value: "        }\n",
                },
                {
                  tag: "insert",
                  value: "        })\n",
                },
                {
                  tag: "equal",
                  value: "    }\n",
                },
                {
                  tag: "equal",
                  value: "}\n",
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value: "#[derive(Accessors)]\n",
                },
                {
                  tag: "equal",
                  value: "pub struct Diff {\n",
                },
                {
                  tag: "equal",
                  value: "    #[access(get(ty(&[DiffEntry<TextDiff<'static, 'static, [u8]>>])))]\n",
                },
              ],
            },
          ],
        },
        {
          type: "RightOnly",
          path: "js/src/diff-view.tsx",
          entry_type: "File",
          content: [
            {
              old_start: 0,
              old_end: 0,
              new_start: 0,
              new_end: 50,
              changes: [
                {
                  tag: "insert",
                  value: 'import { File } from "react-feather";\n',
                },
                {
                  tag: "insert",
                  value: 'import type { StandardProps } from "./props";\n',
                },
                {
                  tag: "insert",
                  value: 'import type { FileBrowserState } from "./state";\n',
                },
                {
                  tag: "insert",
                  value: 'import { assertString, type DiffEntry } from "./types";\n',
                },
                {
                  tag: "insert",
                  value: "\n",
                },
                {
                  tag: "insert",
                  value: "export function DiffEntry({ entry }: { entry: DiffEntry }) {\n",
                },
                {
                  tag: "insert",
                  value: '  const lines = entry.content.split("\\n");\n',
                },
                {
                  tag: "insert",
                  value: "  const nLines = lines.length;\n",
                },
                {
                  tag: "insert",
                  value: "  const maxDigits = Math.ceil(Math.log10(nLines + 1));\n",
                },
                {
                  tag: "insert",
                  value: "  return (\n",
                },
                {
                  tag: "insert",
                  value:
                    '    <div className="container-fluid font-monospace whitespace-pre-wrap">\n',
                },
                {
                  tag: "insert",
                  value: '      <div className="row bg-body-secondary p-2 border-bottom">\n',
                },
                {
                  tag: "insert",
                  value: '        <div className="d-flex align-items-center">\n',
                },
                {
                  tag: "insert",
                  value: "          <div>\n",
                },
                {
                  tag: "insert",
                  value: '            <File aria-label="file" size={20} />\n',
                },
                {
                  tag: "insert",
                  value: "          </div>\n",
                },
                {
                  tag: "insert",
                  value: '          <div className="ms-2">{entry.path}</div>\n',
                },
                {
                  tag: "insert",
                  value: "        </div>\n",
                },
                {
                  tag: "insert",
                  value: "      </div>\n",
                },
                {
                  tag: "insert",
                  value: "      {lines.map((line, idx) => (\n",
                },
                {
                  tag: "insert",
                  value: '        <div key={idx} className="row">\n',
                },
                {
                  tag: "insert",
                  value: "          <div\n",
                },
                {
                  tag: "insert",
                  value:
                    '            className="col text-end user-select-none text-secondary bg-body-tertiary"\n',
                },
                {
                  tag: "insert",
                  value: "            style={{\n",
                },
                {
                  tag: "insert",
                  value: "              maxWidth: `calc(${maxDigits}ch + var(--bs-gutter-x))`,\n",
                },
                {
                  tag: "insert",
                  value: '              ...(idx === 0 ? { paddingTop: ".5rem" } : {}),\n',
                },
                {
                  tag: "insert",
                  value: "            }}\n",
                },
                {
                  tag: "insert",
                  value: "          >\n",
                },
                {
                  tag: "insert",
                  value: "            {idx + 1}\n",
                },
                {
                  tag: "insert",
                  value: "          </div>\n",
                },
                {
                  tag: "insert",
                  value:
                    '          <div className="col" style={idx === 0 ? { paddingTop: ".5rem" } : {}}>\n',
                },
                {
                  tag: "insert",
                  value: "            {line}\n",
                },
                {
                  tag: "insert",
                  value: "          </div>\n",
                },
                {
                  tag: "insert",
                  value: "        </div>\n",
                },
                {
                  tag: "insert",
                  value: "      ))}\n",
                },
                {
                  tag: "insert",
                  value: "    </div>\n",
                },
                {
                  tag: "insert",
                  value: "  );\n",
                },
                {
                  tag: "insert",
                  value: "}\n",
                },
                {
                  tag: "insert",
                  value: "\n",
                },
                {
                  tag: "insert",
                  value: "export function Diff({ entries }: { entries: Array<DiffEntry> }) {\n",
                },
                {
                  tag: "insert",
                  value: "  return (\n",
                },
                {
                  tag: "insert",
                  value: "    <>\n",
                },
                {
                  tag: "insert",
                  value: "      {entries.map((entry) => (\n",
                },
                {
                  tag: "insert",
                  value: '        <div className="mt-3 border rounded overflow-hidden">\n',
                },
                {
                  tag: "insert",
                  value: "          <DiffEntry key={assertString(entry.path)} entry={entry} />\n",
                },
                {
                  tag: "insert",
                  value: "        </div>\n",
                },
                {
                  tag: "insert",
                  value: "      ))}\n",
                },
                {
                  tag: "insert",
                  value: "    </>\n",
                },
                {
                  tag: "insert",
                  value: "  );\n",
                },
                {
                  tag: "insert",
                  value: "}\n",
                },
              ],
            },
          ],
        },
        {
          type: "Both",
          path: "js/src/commit-view.tsx",
          left_type: "File",
          right_type: "File",
          content: [
            {
              old_start: 0,
              old_end: 58,
              new_start: 0,
              new_end: 67,
              changes: [
                {
                  tag: "equal",
                  value:
                    'import type { DetailedHTMLProps, HTMLAttributes, ReactNode } from "react";\n',
                },
                {
                  tag: "equal",
                  value: 'import type { StandardProps } from "./props";\n',
                },
                {
                  tag: "equal",
                  value:
                    'import { browseCommit, viewCommit, type CommitViewState } from "./state";\n',
                },
                {
                  tag: "equal",
                  value: 'import type { CommitView } from "./view";\n',
                },
                {
                  tag: "insert",
                  value: 'import { assertString } from "./types";\n',
                },
                {
                  tag: "insert",
                  value: 'import { Diff, DiffEntry } from "./diff-view";\n',
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value:
                    "export function CommitView({ view, updateState }: StandardProps<CommitViewState, CommitView>) {\n",
                },
                {
                  tag: "insert",
                  value: "  const diff = view.model.diff;\n",
                },
                {
                  tag: "equal",
                  value: "  const commit = view.model.commit;\n",
                },
                {
                  tag: "equal",
                  value: "  const differentCommitter =\n",
                },
                {
                  tag: "delete",
                  value: "    commit.committer_name !== commit.author_name ||\n",
                },
                {
                  tag: "delete",
                  value: "    commit.committer_email !== commit.author_email;\n",
                },
                {
                  tag: "insert",
                  value:
                    "    commit.committer_name !== commit.author_name || commit.committer_email !== commit.author_email;\n",
                },
                {
                  tag: "equal",
                  value:
                    "  const differentCommitDate = commit.commit_date !== commit.author_date;\n",
                },
                {
                  tag: "equal",
                  value: "  return (\n",
                },
                {
                  tag: "delete",
                  value: '    <ul className="list-group">\n',
                },
                {
                  tag: "delete",
                  value:
                    '      <li className="list-group-item d-flex flex-wrap bg-body-tertiary align-items-center">\n',
                },
                {
                  tag: "delete",
                  value: "        <strong>Commit</strong>\n",
                },
                {
                  tag: "delete",
                  value:
                    '        <div className="ms-3 flex-grow-1 font-monospace text-truncate">{commit.id}</div>\n',
                },
                {
                  tag: "delete",
                  value: "        <div>\n",
                },
                {
                  tag: "delete",
                  value: "          <button\n",
                },
                {
                  tag: "delete",
                  value: '            className="btn btn-primary"\n',
                },
                {
                  tag: "delete",
                  value: "            onClick={() => updateState(browseCommit(commit.id))}\n",
                },
                {
                  tag: "delete",
                  value: "          >\n",
                },
                {
                  tag: "delete",
                  value: "            Browse tree\n",
                },
                {
                  tag: "delete",
                  value: "          </button>\n",
                },
                {
                  tag: "delete",
                  value: "        </div>\n",
                },
                {
                  tag: "delete",
                  value: "      </li>\n",
                },
                {
                  tag: "delete",
                  value: "      {commit.parents.map((parentId) => (\n",
                },
                {
                  tag: "delete",
                  value:
                    '        <CommitHeader key={parentId} name="Parent" className="font-monospace">\n',
                },
                {
                  tag: "delete",
                  value: "          <a\n",
                },
                {
                  tag: "delete",
                  value: '            href="#"\n',
                },
                {
                  tag: "delete",
                  value: '            className="text-decoration-none"\n',
                },
                {
                  tag: "delete",
                  value: "            onClick={() => updateState(viewCommit(parentId))}\n",
                },
                {
                  tag: "delete",
                  value: "          >\n",
                },
                {
                  tag: "delete",
                  value: "            {parentId}\n",
                },
                {
                  tag: "delete",
                  value: "          </a>\n",
                },
                {
                  tag: "delete",
                  value: "        </CommitHeader>\n",
                },
                {
                  tag: "delete",
                  value: "      ))}\n",
                },
                {
                  tag: "delete",
                  value: '      <CommitHeader name="Author">\n',
                },
                {
                  tag: "delete",
                  value: "        {commit.author_name} &lt;{commit.author_email}&gt;\n",
                },
                {
                  tag: "delete",
                  value: "      </CommitHeader>\n",
                },
                {
                  tag: "delete",
                  value:
                    '      <CommitHeader name="Author date">{commit.author_date}</CommitHeader>\n',
                },
                {
                  tag: "delete",
                  value: "      {differentCommitter && (\n",
                },
                {
                  tag: "delete",
                  value: '        <CommitHeader name="Committer">\n',
                },
                {
                  tag: "delete",
                  value: "          {commit.committer_name} &lt;{commit.committer_email}&gt;\n",
                },
                {
                  tag: "insert",
                  value: "    <>\n",
                },
                {
                  tag: "insert",
                  value: '      <ul className="list-group">\n',
                },
                {
                  tag: "insert",
                  value:
                    '        <li className="list-group-item d-flex flex-wrap bg-body-tertiary align-items-center">\n',
                },
                {
                  tag: "insert",
                  value: "          <strong>Commit</strong>\n",
                },
                {
                  tag: "insert",
                  value:
                    '          <div className="ms-3 flex-grow-1 font-monospace text-truncate">{commit.id}</div>\n',
                },
                {
                  tag: "insert",
                  value: "          <div>\n",
                },
                {
                  tag: "insert",
                  value: "            <button\n",
                },
                {
                  tag: "insert",
                  value: '              className="btn btn-primary"\n',
                },
                {
                  tag: "insert",
                  value: "              onClick={() => updateState(browseCommit(commit.id))}\n",
                },
                {
                  tag: "insert",
                  value: "            >\n",
                },
                {
                  tag: "insert",
                  value: "              Browse tree\n",
                },
                {
                  tag: "insert",
                  value: "            </button>\n",
                },
                {
                  tag: "insert",
                  value: "          </div>\n",
                },
                {
                  tag: "insert",
                  value: "        </li>\n",
                },
                {
                  tag: "insert",
                  value: "        {commit.parents.map((parentId) => (\n",
                },
                {
                  tag: "insert",
                  value:
                    '          <CommitHeader key={parentId} name="Parent" className="font-monospace">\n',
                },
                {
                  tag: "insert",
                  value: "            <a\n",
                },
                {
                  tag: "insert",
                  value: '              href="#"\n',
                },
                {
                  tag: "insert",
                  value: '              className="text-decoration-none"\n',
                },
                {
                  tag: "insert",
                  value: "              onClick={() => updateState(viewCommit(parentId))}\n",
                },
                {
                  tag: "insert",
                  value: "            >\n",
                },
                {
                  tag: "insert",
                  value: "              {parentId}\n",
                },
                {
                  tag: "insert",
                  value: "            </a>\n",
                },
                {
                  tag: "insert",
                  value: "          </CommitHeader>\n",
                },
                {
                  tag: "insert",
                  value: "        ))}\n",
                },
                {
                  tag: "insert",
                  value: '        <CommitHeader name="Author">\n',
                },
                {
                  tag: "insert",
                  value: "          {commit.author_name} &lt;{commit.author_email}&gt;\n",
                },
                {
                  tag: "equal",
                  value: "        </CommitHeader>\n",
                },
                {
                  tag: "insert",
                  value:
                    '        <CommitHeader name="Author date">{commit.author_date}</CommitHeader>\n',
                },
                {
                  tag: "insert",
                  value: "        {differentCommitter && (\n",
                },
                {
                  tag: "insert",
                  value: '          <CommitHeader name="Committer">\n',
                },
                {
                  tag: "insert",
                  value: "            {commit.committer_name} &lt;{commit.committer_email}&gt;\n",
                },
                {
                  tag: "insert",
                  value: "          </CommitHeader>\n",
                },
                {
                  tag: "insert",
                  value: "        )}\n",
                },
                {
                  tag: "insert",
                  value: "        {differentCommitDate && (\n",
                },
                {
                  tag: "insert",
                  value:
                    '          <CommitHeader name="Commit date">{commit.commit_date}</CommitHeader>\n',
                },
                {
                  tag: "insert",
                  value: "        )}\n",
                },
                {
                  tag: "insert",
                  value: '        <li className="list-group-item">\n',
                },
                {
                  tag: "insert",
                  value:
                    '          <pre className="p-2 whitespace-pre-wrap">{commit.message}</pre>\n',
                },
                {
                  tag: "insert",
                  value: "        </li>\n",
                },
                {
                  tag: "insert",
                  value: "      </ul>\n",
                },
                {
                  tag: "insert",
                  value: "      {diff !== undefined && diff.length !== 0 && (\n",
                },
                {
                  tag: "insert",
                  value: '        <div className="mt-4">\n',
                },
                {
                  tag: "insert",
                  value: "          <Diff entries={diff} />\n",
                },
                {
                  tag: "insert",
                  value: "        </div>\n",
                },
                {
                  tag: "equal",
                  value: "      )}\n",
                },
                {
                  tag: "delete",
                  value: "      {differentCommitDate && (\n",
                },
                {
                  tag: "delete",
                  value:
                    '        <CommitHeader name="Commit date">{commit.commit_date}</CommitHeader>\n',
                },
                {
                  tag: "delete",
                  value: "      )}\n",
                },
                {
                  tag: "delete",
                  value: '      <li className="list-group-item">\n',
                },
                {
                  tag: "delete",
                  value:
                    '        <pre className="p-2 whitespace-pre-wrap">{commit.message}</pre>\n',
                },
                {
                  tag: "delete",
                  value: "      </li>\n",
                },
                {
                  tag: "delete",
                  value: "    </ul>\n",
                },
                {
                  tag: "insert",
                  value: "    </>\n",
                },
                {
                  tag: "equal",
                  value: "  );\n",
                },
                {
                  tag: "equal",
                  value: "}\n",
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value: "function CommitHeader({\n",
                },
                {
                  tag: "equal",
                  value: "  name,\n",
                },
                {
                  tag: "equal",
                  value: "  children,\n",
                },
              ],
            },
          ],
        },
        {
          type: "Both",
          path: "js/src/fake-view.ts",
          left_type: "File",
          right_type: "File",
          content: [
            {
              old_start: 23,
              old_end: 32,
              new_start: 23,
              new_end: 50,
              changes: [
                {
                  tag: "equal",
                  value: '          "0000000000000000000000000000000000000000",\n',
                },
                {
                  tag: "equal",
                  value: '          "ffffffffffffffffffffffffffffffffffffffff",\n',
                },
                {
                  tag: "equal",
                  value: "        ],\n",
                },
                {
                  tag: "equal",
                  value: "        message:\n",
                },
                {
                  tag: "equal",
                  value:
                    '          "a very long commit message with lots of words that are probably unnecessary but are included anyway to test the commit message display wrapping\\nsome more lines\\nin the\\ncommit",\n',
                },
                {
                  tag: "equal",
                  value: "      },\n",
                },
                {
                  tag: "insert",
                  value: "      diff: [\n",
                },
                {
                  tag: "insert",
                  value: "        {\n",
                },
                {
                  tag: "insert",
                  value: '          type: "Both",\n',
                },
                {
                  tag: "insert",
                  value: '          path: "rust/rgit-web/src/directory.rs",\n',
                },
                {
                  tag: "insert",
                  value: '          left_type: "File",\n',
                },
                {
                  tag: "insert",
                  value: '          right_type: "File",\n',
                },
                {
                  tag: "insert",
                  value: "          content:\n",
                },
                {
                  tag: "insert",
                  value:
                    '            \'@@ -126,13 +126,9 @@\\n         dest: &mut [u8],\\n     ) -> Result<usize, FilesystemError> {\\n         let mut f = async || -> Result<usize, JsValue> {\\n-            if offset.0 > 2u64.pow(53) {\\n-                panic!("offset not representable as f64");\\n-            }\\n+            assert!(offset.0 <= 2u64.pow(53), "offset not representable as f64");\\n             let offset = offset.0 as f64;\\n-            if dest.len() as u64 > 2u64.pow(53) {\\n-                panic!("length not representable as f64");\\n-            }\\n+            assert!(dest.len() as u64 <= 2u64.pow(53), "length not representable as f64");\\n             let length = dest.len() as f64;\\n             let data: Uint8Array = self.file.readSegment(offset, length).await?.dyn_into()?;\\n             let bytes_read = data.length() as usize;\\n\',\n',
                },
                {
                  tag: "insert",
                  value: "        },\n",
                },
                {
                  tag: "insert",
                  value: "        {\n",
                },
                {
                  tag: "insert",
                  value: '          type: "Both",\n',
                },
                {
                  tag: "insert",
                  value: '          path: "rust/rgit-web/src/error.rs",\n',
                },
                {
                  tag: "insert",
                  value: '          left_type: "File",\n',
                },
                {
                  tag: "insert",
                  value: '          right_type: "File",\n',
                },
                {
                  tag: "insert",
                  value: "          content:\n",
                },
                {
                  tag: "insert",
                  value:
                    '            \'@@ -22,7 +22,7 @@\\n             *js_error\\n         }\\n         _ => match to_value(&err) {\\n-            Ok(val) => make_rgit_error(JsString::from(format!("{:?}", err).as_str()), val),\\n+            Ok(val) => make_rgit_error(JsString::from(format!("{err:?}").as_str()), val),\\n             Err(val) => val.into(),\\n         },\\n     }\\n\',\n',
                },
                {
                  tag: "insert",
                  value: "        },\n",
                },
                {
                  tag: "insert",
                  value: "      ],\n",
                },
                {
                  tag: "equal",
                  value: "    },\n",
                },
                {
                  tag: "equal",
                  value: "  },\n",
                },
                {
                  tag: "equal",
                  value: "};\n",
                },
              ],
            },
          ],
        },
        {
          type: "Both",
          path: "js/src/types.ts",
          left_type: "File",
          right_type: "File",
          content: [
            {
              old_start: 33,
              old_end: 53,
              new_start: 33,
              new_end: 75,
              changes: [
                {
                  tag: "equal",
                  value: "export type GitObject =\n",
                },
                {
                  tag: "equal",
                  value: '  | ({ type: "Commit" } & Commit)\n',
                },
                {
                  tag: "equal",
                  value: '  | ({ type: "Tree" } & Tree)\n',
                },
                {
                  tag: "equal",
                  value: '  | ({ type: "Tag" } & Tag)\n',
                },
                {
                  tag: "equal",
                  value: '  | ({ type: "Blob" } & Blob);\n',
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "insert",
                  value:
                    'export type TreeEntryType = "Tree" | "Symlink" | "File" | "Executable" | "Commit";\n',
                },
                {
                  tag: "equal",
                  value: "export type TreeEntry = {\n",
                },
                {
                  tag: "equal",
                  value: "  id: string;\n",
                },
                {
                  tag: "equal",
                  value: "  name: string | Uint8Array;\n",
                },
                {
                  tag: "delete",
                  value: '  entry_type: "Tree" | "Symlink" | "File" | "Executable" | "Commit";\n',
                },
                {
                  tag: "insert",
                  value: "  entry_type: TreeEntryType;\n",
                },
                {
                  tag: "equal",
                  value: "};\n",
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value:
                    'export type RefName = { type: "Head" } | { type: "Ref"; value: string | Uint8Array };\n',
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "insert",
                  value: "export type DiffEntry =\n",
                },
                {
                  tag: "insert",
                  value: "  | {\n",
                },
                {
                  tag: "insert",
                  value: '    type: "LeftOnly";\n',
                },
                {
                  tag: "insert",
                  value: "    path: string | Uint8Array;\n",
                },
                {
                  tag: "insert",
                  value: "    entry_type: TreeEntryType;\n",
                },
                {
                  tag: "insert",
                  value: "    content: string;\n",
                },
                {
                  tag: "insert",
                  value: "  }\n",
                },
                {
                  tag: "insert",
                  value: "  | {\n",
                },
                {
                  tag: "insert",
                  value: '    type: "Both";\n',
                },
                {
                  tag: "insert",
                  value: "    path: string | Uint8Array;\n",
                },
                {
                  tag: "insert",
                  value: "    left_type: TreeEntryType;\n",
                },
                {
                  tag: "insert",
                  value: "    right_type: TreeEntryType;\n",
                },
                {
                  tag: "insert",
                  value: "    content: string;\n",
                },
                {
                  tag: "insert",
                  value: "  }\n",
                },
                {
                  tag: "insert",
                  value: "  | {\n",
                },
                {
                  tag: "insert",
                  value: '    type: "RightOnly";\n',
                },
                {
                  tag: "insert",
                  value: "    path: string | Uint8Array;\n",
                },
                {
                  tag: "insert",
                  value: "    entry_type: TreeEntryType;\n",
                },
                {
                  tag: "insert",
                  value: "    content: string;\n",
                },
                {
                  tag: "insert",
                  value: "  };\n",
                },
                {
                  tag: "insert",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value: "export function assertString(val: string | Uint8Array): string {\n",
                },
                {
                  tag: "equal",
                  value: '  if (typeof val !== "string") {\n',
                },
                {
                  tag: "equal",
                  value: '    throw new Error("Unexpected binary data");\n',
                },
                {
                  tag: "equal",
                  value: "  }\n",
                },
                {
                  tag: "equal",
                  value: "  return val;\n",
                },
                {
                  tag: "equal",
                  value: "}\n",
                },
              ],
            },
          ],
        },
        {
          type: "Both",
          path: "js/src/view.ts",
          left_type: "File",
          right_type: "File",
          content: [
            {
              old_start: 0,
              old_end: 16,
              new_start: 0,
              new_end: 16,
              changes: [
                {
                  tag: "delete",
                  value: 'import { WebRefName, type WebRepo } from "../pkg/rgit_web";\n',
                },
                {
                  tag: "insert",
                  value: 'import { WebDiff, WebRefName, type WebRepo } from "../pkg/rgit_web";\n',
                },
                {
                  tag: "equal",
                  value: 'import { assertNever } from "./assert-never";\n',
                },
                {
                  tag: "equal",
                  value: "import {\n",
                },
                {
                  tag: "equal",
                  value: "  setPath,\n",
                },
                {
                  tag: "equal",
                  value: "  type AppState,\n",
                },
                {
                  tag: "equal",
                  value: "  type CommitViewState,\n",
                },
                {
                  tag: "equal",
                  value: "  type FileBrowserState,\n",
                },
                {
                  tag: "equal",
                  value: "  type Mutator,\n",
                },
                {
                  tag: "equal",
                  value: '} from "./state";\n',
                },
                {
                  tag: "delete",
                  value:
                    'import { type Commit, type GitObject, type RefName, type TreeEntry } from "./types";\n',
                },
                {
                  tag: "insert",
                  value:
                    'import { type Commit, type DiffEntry, type GitObject, type RefName, type TreeEntry } from "./types";\n',
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value: "export type ViewModel<S, M> = { state: S; model: M };\n",
                },
                {
                  tag: "equal",
                  value: "export type DerivedView = EmptyView | RepoView;\n",
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value: "export function viewModel<S, M>(state: S, model: M): ViewModel<S, M> {\n",
                },
                {
                  tag: "equal",
                  value: "  return { state, model };\n",
                },
              ],
            },
            {
              old_start: 27,
              old_end: 39,
              new_start: 27,
              new_end: 40,
              changes: [
                {
                  tag: "equal",
                  value: "  inner: FileBrowserView | CommitView;\n",
                },
                {
                  tag: "equal",
                  value: "};\n",
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value: "export type CommitView = {\n",
                },
                {
                  tag: "equal",
                  value: '  type: "commit view";\n',
                },
                {
                  tag: "equal",
                  value: "  commit: Commit;\n",
                },
                {
                  tag: "insert",
                  value: "  diff?: Array<DiffEntry>;\n",
                },
                {
                  tag: "equal",
                  value: "};\n",
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value: "export type FileBrowserView = {\n",
                },
                {
                  tag: "equal",
                  value: '  type: "file browser";\n',
                },
                {
                  tag: "equal",
                  value: "  refs: RefName[];\n",
                },
                {
                  tag: "equal",
                  value: "  commit: Commit;\n",
                },
              ],
            },
            {
              old_start: 136,
              old_end: 148,
              new_start: 137,
              new_end: 160,
              changes: [
                {
                  tag: "equal",
                  value: '      throw new Error("not implemented");\n',
                },
                {
                  tag: "equal",
                  value: "    }\n",
                },
                {
                  tag: "equal",
                  value: "  }\n",
                },
                {
                  tag: "equal",
                  value: "}\n",
                },
                {
                  tag: "equal",
                  value: "\n",
                },
                {
                  tag: "equal",
                  value:
                    "async function deriveCommitView(repo: WebRepo, state: CommitViewState): Promise<CommitView> {\n",
                },
                {
                  tag: "delete",
                  value:
                    "  const commit: Commit | undefined = (await repo.lookup_object(state.commitId)).to_js();\n",
                },
                {
                  tag: "insert",
                  value:
                    "  const commitHandle = (await repo.lookup_object(state.commitId)).commit();\n",
                },
                {
                  tag: "insert",
                  value: "  const commit: Commit = commitHandle.to_js();\n",
                },
                {
                  tag: "insert",
                  value: "  let diff: Array<DiffEntry> | undefined = undefined;\n",
                },
                {
                  tag: "insert",
                  value: "  if (commit.parents.length === 1) {\n",
                },
                {
                  tag: "insert",
                  value: "    const parentHandle = (await commitHandle.lookup_parents())[0]!;\n",
                },
                {
                  tag: "insert",
                  value: "    const tree = await commitHandle.lookup_tree();\n",
                },
                {
                  tag: "insert",
                  value: "    const parentTree = await parentHandle.lookup_tree();\n",
                },
                {
                  tag: "insert",
                  value: "    const diffHandle = await WebDiff.diff(parentTree, tree);\n",
                },
                {
                  tag: "insert",
                  value: "    diff = diffHandle.to_js();\n",
                },
                {
                  tag: "insert",
                  value: "  }\n",
                },
                {
                  tag: "insert",
                  value: "  console.log(diff);\n",
                },
                {
                  tag: "equal",
                  value: "  return {\n",
                },
                {
                  tag: "equal",
                  value: '    type: "commit view",\n',
                },
                {
                  tag: "delete",
                  value: "    commit: commit!,\n",
                },
                {
                  tag: "insert",
                  value: "    commit: commit,\n",
                },
                {
                  tag: "insert",
                  value: "    ...(diff === undefined ? {} : { diff }),\n",
                },
                {
                  tag: "equal",
                  value: "  };\n",
                },
                {
                  tag: "equal",
                  value: "}\n",
                },
              ],
            },
          ],
        },
        {
          type: "Both",
          path: "js/src/file-browser/blob.tsx",
          left_type: "File",
          right_type: "File",
          content: [
            {
              old_start: 23,
              old_end: 36,
              new_start: 23,
              new_end: 36,
              changes: [
                {
                  tag: "equal",
                  value: "              style={style}\n",
                },
                {
                  tag: "equal",
                  value:
                    '              className="container rounded overflow-hidden font-monospace whitespace-pre-wrap"\n',
                },
                {
                  tag: "equal",
                  value: "            >\n",
                },
                {
                  tag: "equal",
                  value: "              {tokens.map((line, idx) => (\n",
                },
                {
                  tag: "equal",
                  value: '                <div key={idx} className="row">\n',
                },
                {
                  tag: "equal",
                  value: "                  <div\n",
                },
                {
                  tag: "delete",
                  value:
                    '                    className="col text-end user-select-none text-secondary bg-body-secondary"\n',
                },
                {
                  tag: "insert",
                  value:
                    '                    className="col text-end user-select-none text-secondary bg-body-tertiary"\n',
                },
                {
                  tag: "equal",
                  value: "                    style={{\n",
                },
                {
                  tag: "equal",
                  value:
                    "                      maxWidth: `calc(${maxDigits}ch + var(--bs-gutter-x))`,\n",
                },
                {
                  tag: "equal",
                  value: '                      ...(idx === 0 ? { paddingTop: ".5rem" } : {}),\n',
                },
                {
                  tag: "equal",
                  value: "                    }}\n",
                },
                {
                  tag: "equal",
                  value: "                  >\n",
                },
                {
                  tag: "equal",
                  value: "                    {idx + 1}\n",
                },
              ],
            },
          ],
        },
      ],
    },
  },
};
