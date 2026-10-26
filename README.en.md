# TXT / Markdown Reader

[简体中文](README.md) | [English](README.en.md)

Read local TXT and Markdown in a clean interface: switch UTF-8 / GBK decoding, adjust text size and theme, and continue from a saved position next time.

This is a static webpage. **Download the whole repository and double-click `index.html`.** No account, backend, Node.js, or API key is required. The browser reads your document; its body is not uploaded to an application server.

[Open a file](#open-a-document) · [Progress and export](#save-progress-and-export-a-record) · [How it works](#how-it-works) · [Troubleshooting](#common-issues)

## Open a document

1. Use GitHub **Code → Download ZIP**, extract the archive, and keep the relative positions of `index.html` and `assets/`. Alternatively, clone:

```bash
git clone https://github.com/kayaduster607-jpg/txt-reader.git
cd txt-reader
```

2. Open root `index.html` in a browser and select [examples/sample.txt](examples/sample.txt) in the file picker. Choose [examples/sample.md](examples/sample.md) to see headings, lists, and code formatting.
3. After text appears, switch “小 / 中 / 大” (small / medium / large) or “蓝 / 绿 / 黑” (blue / green / black). If Chinese text is garbled, switch UTF-8 / GBK to decode again.
4. Scroll down and click “保存进度” (save progress). Close the page, reopen the reader, and select a document with the **same filename** to restore approximately the saved position.

Your input is a `.txt` or `.md` file, not a typed path, pasted body, or JSON conversion. The picker area hides after loading; refresh to choose a different document.

## Save progress and export a record

| Action | Result | Where to find it |
| --- | --- | --- |
| Open TXT / Markdown | Paragraphs or rendered Markdown | Current reading page |
| Stop scrolling for about 500 ms or click “保存进度” | Filename, scroll position in pixels, save time | Current browser's localStorage |
| Click “导出记录” (export record) | `<original filename>_记录.json` | Browser download directory |

Exported JSON uses `bookName`, `position`, and `date`. It records where you were at export time, contains no document body, and creates no PDF, EPUB, or TXT copy. There is currently no interface for importing the JSON back.

Progress is keyed by filename, so same-name files in different directories share a record. Positions use pixels rather than chapters; changing font size, window width, or text may shift restoration. Text size and theme themselves do not persist across refreshes.

For consistent access to the same reader, start a static file server from the project directory:

```bash
python -m http.server 8080 --bind 127.0.0.1
```

Always use [http://127.0.0.1:8080](http://127.0.0.1:8080) afterward to keep the browser storage origin consistent. Browsers can handle storage for directly opened files differently. Clearing site data or changing browsers does not migrate old progress automatically.

## How it works

![File loading, rendering, and progress storage](docs/assets/architecture.png)

`assets/reader.js` uses FileReader to decode the selected file. TXT is displayed with `textContent`; Markdown is parsed by Marked, sanitized by DOMPurify, and then inserted into the page. Both browser libraries are bundled, so ordinary reading does not depend on a CDN.

Document contents exist only in the current page's memory. The localStorage key `reader_progress_<filename>` stores filename, position, and time only. Select the original again after refresh. Remote images or links in Markdown can make network requests; the reader does not make them offline automatically.

The diagram is available as [SVG](docs/assets/architecture.svg), with its [drawing source](docs/assets/generate_architecture.py).

## Common issues

| Symptom | Action |
| --- | --- |
| Buttons appear but Markdown formatting fails | Download the full directory and check `assets/vendor/` |
| No text after reopening | Select the original again; saving progress does not save the book body |
| Previous position is missing | Check filename, browser, address, and whether site data was cleared |
| Export does not produce a book | Export creates progress JSON only |
| Large files are slow | The reader loads the entire file at once, without pagination or streaming |

TXT / Markdown are supported. PDF, DOCX, EPUB, OCR, a table-of-contents sidebar, and a cloud library are not provided.

## Development and verification

Reading requires none of the development dependencies below. When changing scripts or browser libraries, use a Node.js version satisfying package engine requirements:

```bash
npm ci --ignore-scripts
npm run vendor
npm test
npm run audit
```

See the [verification record](docs/validation.md) for scope and historical environments, and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for library versions and licenses. The entry page, application script, and tests are `index.html`, `assets/reader.js`, and `tests/reader.test.mjs`.
