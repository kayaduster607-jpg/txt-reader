/* Local file reading and progress handling; no document upload service is used. */
let currentFile = null;
let currentFileName = '';
let readSequence = 0;
let scrollTimeout;

function element(id) {
    return document.getElementById(id);
}

function handleFileSelect(file) {
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) {
        showToast('请选择 TXT 或 Markdown 文件');
        return;
    }
    currentFile = file;
    currentFileName = file.name;
    loadContent();
}

function reloadFile() {
    if (currentFile) loadContent();
}

function renderPlainText(text, content) {
    const fragment = document.createDocumentFragment();
    for (const paragraph of text.split(/\r?\n/)) {
        if (!paragraph.trim()) continue;
        const item = document.createElement('p');
        // TXT content stays text even when a document contains HTML-like input.
        item.textContent = paragraph;
        fragment.appendChild(item);
    }
    content.className = 'txt-mode';
    content.replaceChildren(fragment);
}

function renderMarkdown(text, content) {
    if (!window.marked || !window.DOMPurify) {
        throw new Error('Markdown libraries are unavailable');
    }
    const html = window.marked.parse(text);
    // Markdown may contain raw HTML: sanitize before putting it into the DOM.
    content.innerHTML = window.DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    content.className = 'md-mode';
}

function displayDocument(text) {
    const content = element('novel-content');
    if (currentFileName.toLowerCase().endsWith('.md')) renderMarkdown(text, content);
    else renderPlainText(text, content);
    element('novel-title').textContent = currentFileName.replace(/\.(txt|md)$/i, '');
    element('upload-box').style.display = 'none';
    element('reader-view').style.display = 'block';
    autoLoadProgress();
}

function loadContent() {
    const sequence = ++readSequence;
    const reader = new FileReader();
    reader.onload = function (event) {
        // A slower previous selection must not overwrite the current document.
        if (sequence !== readSequence) return;
        try {
            displayDocument(String(event.target.result || ''));
        } catch {
            showToast('文档渲染失败，请确认阅读器资源文件完整');
        }
    };
    reader.onerror = function () {
        if (sequence === readSequence) showToast('文件读取失败，请重新选择文件');
    };
    try {
        reader.readAsText(currentFile, element('encoding-select').value);
    } catch {
        showToast('文件读取失败，请重新选择文件');
    }
}

function progressKey() {
    return currentFileName ? 'reader_progress_' + currentFileName : null;
}

function readProgress() {
    const key = progressKey();
    if (!key) return null;
    try {
        const saved = localStorage.getItem(key);
        if (!saved) return null;
        const data = JSON.parse(saved);
        if (!data || data.fileName !== currentFileName || !Number.isFinite(data.position) || data.position < 0) return null;
        return data;
    } catch {
        // A damaged record or unavailable storage should not prevent reading.
        return null;
    }
}

function saveProgress(silent = false) {
    const key = progressKey();
    if (!key) {
        if (!silent) showToast('请先打开文件');
        return false;
    }
    const data = { fileName: currentFileName, position: window.scrollY, timestamp: Date.now() };
    try {
        localStorage.setItem(key, JSON.stringify(data));
        if (!silent) showToast('进度已保存');
        return true;
    } catch {
        if (!silent) showToast('无法保存进度，请检查浏览器存储权限或空间');
        return false;
    }
}

function saveProgressManually() {
    saveProgress(false);
}

function autoLoadProgress() {
    const saved = readProgress();
    if (!saved) return;
    const sequence = readSequence;
    setTimeout(() => {
        if (sequence !== readSequence) return;
        window.scrollTo(0, saved.position);
        showToast('已恢复上次阅读位置');
    }, 150);
}

function downloadProgressFile() {
    if (!currentFileName) {
        showToast('请先打开文件');
        return;
    }
    const data = { bookName: currentFileName, position: window.scrollY, date: new Date().toLocaleString() };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFileName + '_记录.json';
    link.click();
    // Wait until the download has started before releasing the temporary URL.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function setFont(size) {
    if ([14, 18, 24].includes(size)) element('novel-content').style.fontSize = size + 'px';
}

function setTheme(theme) {
    document.body.classList.remove('theme-green', 'theme-dark');
    if (theme === 'green') document.body.classList.add('theme-green');
    if (theme === 'dark') document.body.classList.add('theme-dark');
}

function showToast(message) {
    const toast = element('toast');
    toast.textContent = message;
    toast.className = 'show';
    setTimeout(() => toast.classList.remove('show'), 3000);
}

element('file-input').addEventListener('change', (event) => handleFileSelect(event.target.files[0]));
window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        if (element('reader-view').style.display === 'block') saveProgress(true);
    }, 500);
}, { passive: true });
