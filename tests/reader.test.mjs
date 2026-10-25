/** Exercise the shipped browser scripts in fresh, isolated DOM instances. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { JSDOM } from 'jsdom';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(join(root, 'index.html'), 'utf8');
const scriptFiles = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1]);
const scripts = await Promise.all(scriptFiles.map(file => readFile(join(root, file), 'utf8')));
const pause = milliseconds => new Promise(done => setTimeout(done, milliseconds));

function createReader() {
    const dom = new JSDOM(html, { url: 'https://reader.test/', runScripts: 'outside-only', pretendToBeVisual: true });
    const { window } = dom;
    let position = 0;
    const downloads = [];
    const released = [];
    Object.defineProperty(window, 'scrollY', { get: () => position, configurable: true });
    window.scrollTo = (_x, y) => { position = y; };
    window.URL.createObjectURL = blob => { downloads.push({ blob }); return 'blob:isolated-download'; };
    window.URL.revokeObjectURL = url => released.push(url);
    window.HTMLAnchorElement.prototype.click = function () {
        downloads.at(-1).name = this.download;
    };
    for (const script of scripts) window.eval(script);
    return { dom, window, downloads, released, element: id => window.document.getElementById(id) };
}

function withReader(name, action) {
    test(name, async () => {
        const reader = createReader();
        try { await action(reader); } finally { reader.dom.window.close(); }
    });
}

async function openFile(reader, name, content) {
    reader.window.handleFileSelect(new reader.window.File([content], name));
    const title = name.replace(/\.(txt|md)$/i, '');
    for (let attempt = 0; attempt < 100; attempt += 1) {
        if (reader.element('novel-title').textContent === title && reader.element('reader-view').style.display === 'block') return;
        await pause(10);
    }
    assert.fail('The isolated file did not render');
}

test('browser assets are local and match the pinned vendor manifest', async () => {
    assert.deepEqual(scriptFiles, ['assets/vendor/marked.umd.js', 'assets/vendor/purify.min.js', 'assets/reader.js']);
    const manifest = JSON.parse(await readFile(join(root, 'assets/vendor/versions.json'), 'utf8'));
    for (const item of manifest) {
        const code = await readFile(join(root, 'assets/vendor', item.file));
        assert.equal(createHash('sha256').update(code).digest('hex'), item.sha256);
    }
});

withReader('TXT is rendered as literal paragraphs, including HTML-like input', async reader => {
    await openFile(reader, 'sample.txt', '第一段\n\n<img src=x onerror=alert(1)>\n最后一段');
    const content = reader.element('novel-content');
    assert.equal(content.className, 'txt-mode');
    assert.equal(content.querySelectorAll('p').length, 3);
    assert.equal(content.querySelector('img'), null);
    assert.ok(content.textContent.includes('<img'));
});

withReader('UTF-8 text is decoded through FileReader', async reader => {
    await openFile(reader, 'utf8.txt', new TextEncoder().encode('中文 UTF-8 样例'));
    assert.equal(reader.element('novel-content').textContent, '中文 UTF-8 样例');
});

withReader('GBK selection decodes a GBK fixture', async reader => {
    reader.element('encoding-select').value = 'gbk';
    await openFile(reader, 'gbk.txt', Uint8Array.from([0xd6, 0xd0, 0xce, 0xc4]));
    assert.equal(reader.element('novel-content').textContent, '中文');
});

withReader('Markdown headings, lists and code render correctly', async reader => {
    await openFile(reader, 'notes.md', '# 标题\n\n- 条目\n\n```js\nconst value = 1;\n```');
    const content = reader.element('novel-content');
    assert.equal(content.className, 'md-mode');
    assert.equal(content.querySelector('h1').textContent, '标题');
    assert.equal(content.querySelector('li').textContent, '条目');
    assert.ok(content.querySelector('pre code').textContent.includes('const value'));
});

withReader('Markdown sanitization removes active HTML and unsafe URLs', async reader => {
    await openFile(reader, 'unsafe.md', '# Safe\n<script>window.bad=true</script><img src=x onerror="window.bad=true"><iframe src="https://invalid.test"></iframe><a href="javascript:alert(1)">link</a>');
    const content = reader.element('novel-content');
    assert.equal(content.querySelector('script, iframe, [onerror]'), null);
    assert.equal(content.querySelector('a').getAttribute('href'), null);
    assert.equal(content.querySelector('h1').textContent, 'Safe');
});

withReader('manual progress stores position metadata without document content', async reader => {
    await openFile(reader, 'progress.txt', 'DOCUMENT_BODY_NOT_FOR_STORAGE');
    reader.window.scrollTo(0, 725);
    reader.window.saveProgressManually();
    const raw = reader.window.localStorage.getItem('reader_progress_progress.txt');
    const progress = JSON.parse(raw);
    assert.equal(progress.fileName, 'progress.txt');
    assert.equal(progress.position, 725);
    assert.equal(typeof progress.timestamp, 'number');
    assert.ok(!raw.includes('DOCUMENT_BODY_NOT_FOR_STORAGE'));
});

withReader('saved progress is restored after opening the same filename', async reader => {
    reader.window.localStorage.setItem('reader_progress_restore.txt', JSON.stringify({ fileName: 'restore.txt', position: 340, timestamp: 1 }));
    await openFile(reader, 'restore.txt', 'Sample content');
    await pause(180);
    assert.equal(reader.window.scrollY, 340);
});

withReader('scroll progress is saved after the debounce interval', async reader => {
    await openFile(reader, 'scroll.txt', 'Scroll content');
    reader.window.scrollTo(0, 510);
    reader.window.dispatchEvent(new reader.window.Event('scroll'));
    assert.equal(reader.window.localStorage.getItem('reader_progress_scroll.txt'), null);
    await pause(550);
    assert.equal(JSON.parse(reader.window.localStorage.getItem('reader_progress_scroll.txt')).position, 510);
});

withReader('damaged local progress does not stop document reading', async reader => {
    reader.window.localStorage.setItem('reader_progress_broken.txt', '{invalid json');
    await openFile(reader, 'broken.txt', 'Still readable');
    assert.equal(reader.element('novel-content').textContent, 'Still readable');
});

withReader('storage restrictions leave reading available and show save feedback', async reader => {
    Object.defineProperty(reader.window, 'localStorage', { value: {
        getItem() { throw new Error('Storage denied'); },
        setItem() { throw new Error('Storage denied'); },
    } });
    await openFile(reader, 'restricted.txt', 'Still readable');
    reader.window.saveProgressManually();
    assert.ok(reader.element('toast').textContent.includes('无法保存进度'));
});

withReader('saving without a selected document creates no empty record', reader => {
    reader.window.saveProgressManually();
    assert.equal(reader.window.localStorage.length, 0);
    assert.equal(reader.element('toast').textContent, '请先打开文件');
});

withReader('unsupported file types are rejected', reader => {
    reader.window.handleFileSelect(new reader.window.File(['{}'], 'config.json'));
    assert.equal(reader.element('reader-view').style.display, 'none');
    assert.ok(reader.element('toast').textContent.includes('TXT'));
});

withReader('font controls keep the three documented sizes', reader => {
    for (const size of [14, 18, 24]) {
        reader.window.setFont(size);
        assert.equal(reader.element('novel-content').style.fontSize, size + 'px');
    }
    reader.window.setFont(99);
    assert.equal(reader.element('novel-content').style.fontSize, '24px');
});

withReader('theme changes preserve unrelated body classes', reader => {
    reader.window.document.body.classList.add('custom');
    reader.window.setTheme('green');
    assert.ok(reader.window.document.body.classList.contains('theme-green'));
    reader.window.setTheme('dark');
    assert.ok(reader.window.document.body.classList.contains('theme-dark'));
    assert.ok(!reader.window.document.body.classList.contains('theme-green'));
    reader.window.setTheme('default');
    assert.equal(reader.window.document.body.className, 'custom');
});

withReader('progress export creates JSON and releases its temporary URL', async reader => {
    await openFile(reader, 'export.txt', 'Not exported document content');
    reader.window.scrollTo(0, 120);
    const nativeTimeout = reader.window.setTimeout.bind(reader.window);
    reader.window.setTimeout = (action, delay) => delay === 1000 ? action() : nativeTimeout(action, delay);
    reader.window.downloadProgressFile();
    assert.equal(reader.downloads[0].name, 'export.txt_记录.json');
    assert.equal(reader.downloads[0].blob.type, 'application/json');
    assert.equal(reader.released[0], 'blob:isolated-download');
    const text = await new Promise(done => {
        const fileReader = new reader.window.FileReader();
        fileReader.onload = event => done(event.target.result);
        fileReader.readAsText(reader.downloads[0].blob);
    });
    assert.equal(JSON.parse(text).position, 120);
    assert.ok(!text.includes('Not exported document content'));
});

withReader('an older asynchronous read cannot overwrite a newer selection', reader => {
    const pending = [];
    reader.window.FileReader = class {
        readAsText(file) { pending.push({ reader: this, file }); }
    };
    reader.window.handleFileSelect(new reader.window.File(['old'], 'old.txt'));
    reader.window.handleFileSelect(new reader.window.File(['new'], 'new.txt'));
    pending[1].reader.onload({ target: { result: 'new' } });
    pending[0].reader.onload({ target: { result: 'old' } });
    assert.equal(reader.element('novel-title').textContent, 'new');
    assert.equal(reader.element('novel-content').textContent, 'new');
});
