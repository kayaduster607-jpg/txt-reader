<div align="center">

# TXT / Markdown 阅读器

**打开本机文档，调整阅读样式，下次从原位置继续。**

TXT · Markdown · UTF-8 / GBK · 本地阅读进度

![HTML](https://img.shields.io/badge/HTML5-static_page-E34F26?style=flat-square&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=flat-square&logo=javascript&logoColor=222222)
![Storage](https://img.shields.io/badge/Storage-localStorage-71618E?style=flat-square)

[功能](#功能) · [使用](#使用) · [工作原理](#工作原理) · [数据与隐私](#数据与隐私) · [开发验证](#开发验证)

</div>

![阅读器工作原理](docs/assets/architecture.png)

一个轻量的纯前端阅读器，用于阅读本机 `.txt` 和 `.md` 文件。页面通过 FileReader 解码文档，TXT 按段落安全显示，Markdown 使用本地保存的 Marked 与 DOMPurify 解析、清洗并渲染。

无需账号、后端、数据库或 API Key。普通使用直接打开 `index.html`；Node.js 只用于开发测试和更新浏览器库。

## 先用一次：打开文本、继续阅读、导出进度

| 你输入什么 | 你会看到什么 | 是否上传到服务器 |
| --- | --- | --- |
| 本机 `.txt` 或 `.md` 文件 | TXT段落或清洗后的Markdown阅读页面 | 文件由浏览器在本地读取 |
| 字号、主题和滚动位置 | 对应阅读样式与当前位置 | 设置/进度在当前浏览器保存 |
| 点击“导出记录” | `<原文件名>_记录.json` | 浏览器下载到你选择的目录 |

### 第一次操作

1. 下载仓库，用浏览器打开 `index.html`。不需要安装Python/Node、账号或API Key。
2. 在文件选择框选一个TXT或Markdown文件。没有资料时，可在文本编辑器写两三段内容，保存为UTF-8的 `demo.txt`，再选择它。
3. 文本显示后，试用“小/中/大”字号和“蓝/绿/黑”主题，向下滚动。
4. 点击“保存进度”，关闭后再次用同一浏览器打开阅读器，重新选择同一个文件，检查是否恢复滚动位置。
5. 点击“导出记录”，在下载目录找到JSON并用文本编辑器查看。

**输出边界：**“导出记录”导出的是阅读进度，不是原文、PDF、EPUB或完整书库；当前没有把该JSON重新导入的按钮。浏览器清理存储、换浏览器或改变访问来源后，不应假定旧进度还在。文件要重新选择，原文不是自动保存在阅读器服务器上的。

## 功能

| 能力 | 具体行为 |
| --- | --- |
| 两种文档格式 | TXT 段落显示；Markdown 标题、列表、表格、引用、代码等排版 |
| 编码切换 | UTF-8 / GBK，可对当前文件重新解码 |
| 阅读样式 | 14 / 18 / 24 px 字号，蓝色、绿色、深色三种主题 |
| 自动续读 | 滚动停止约 500 ms 后保存位置；重新选择同名文件时尝试恢复 |
| 手动保存 | 随时记录当前文件名和滚动位置 |
| 记录导出 | 下载当前文件名、位置和日期的 JSON，不包含正文 |
| 安全渲染 | TXT 使用 `textContent`；Markdown 在插入页面前进行 HTML 清洗 |
| 静态运行 | 浏览器库随仓库提供，渲染不依赖运行时 CDN 请求 |

## 使用

```bash
git clone https://github.com/kayaduster607-jpg/txt-reader.git
cd txt-reader
```

1. 用浏览器打开 `index.html`，保持 `assets/` 与页面的相对位置。
2. 选择 `.txt` 或 `.md` 文件。可先使用 [TXT 示例](examples/sample.txt) 或 [Markdown 示例](examples/sample.md)。
3. 如遇乱码，切换 UTF-8 / GBK。
4. 调整字号和主题后阅读，滚动位置会自动保存，也可以手动点击“保存进度”。
5. 下次打开页面后，重新选择同名文件，恢复记录的位置。

当前页面加载文档后会隐藏文件选择区；切换另一份文档时可刷新页面再选择。字号和主题目前不跨页面刷新保存。

也可以通过普通静态服务器运行，例如已安装 Python 时：

```bash
python -m http.server 8080 --bind 127.0.0.1
```

访问 [http://127.0.0.1:8080](http://127.0.0.1:8080)。这是可选的静态文件服务，不是应用后端。通过稳定的 HTTP 来源访问，也便于明确 localStorage 所属的来源；浏览器对 `file://` 下存储的行为可能不同。

## 工作原理

架构图提供 [PNG](docs/assets/architecture.png)、[SVG](docs/assets/architecture.svg) 和 [绘图源码](docs/assets/generate_architecture.py)。

| 部分 | 职责 |
| --- | --- |
| `index.html` | 工具栏、文件输入、阅读区域与页面样式 |
| `assets/reader.js` | 文件选择、解码、渲染分流、主题、进度与导出 |
| `assets/vendor/` | 固定版本 Marked / DOMPurify、许可证和校验值 |
| FileReader | 按用户选择的 UTF-8 / GBK 读取本机文件 |
| localStorage | 按文件名保存滚动位置和保存时间 |

Markdown 可包含原始 HTML，页面使用 `DOMPurify.sanitize()` 后才写入阅读区域。TXT 中即使出现类似 HTML 的内容，也只按文字显示。读取失败会提示重新选择；损坏的进度记录或不可用的本地存储不会阻止普通阅读。

## 数据与隐私

程序没有上传文档的接口，正文不写入 localStorage。页面刷新后需要重新选择原文件。

自动或手动保存使用以下键和值：

```json
{
  "fileName": "example.txt",
  "position": 725,
  "timestamp": 1730000000000
}
```

键名为 `reader_progress_<文件名>`。导出文件名为 `<原文件名>_记录.json`，内容使用 `bookName`、`position`、`date` 字段，记录的是导出时的当前位置。

需要了解的边界：

- 同名的不同文档会共用同一个进度键；当前不按路径或文件内容哈希区分。
- 记录基于滚动像素，不是章节、页码或百分比。字号、窗口宽度、文档内容和图片加载变化可能影响恢复位置。
- 记录只保存在当前浏览器来源下，不会自动跨设备同步；清理浏览器数据会丢失本地记录。
- 当前只有记录导出，没有记录导入功能。
- 文档一次读入全文，没有分页或流式加载；大文件可能占用明显内存。
- Markdown 中的外链、远程图片仍可能在浏览器中产生网络请求；本地化库文件不等于文档中的外部资源也会离线化。

## 开发验证

普通阅读不需要安装依赖。修改代码、更新本地库或运行隔离测试时，使用 Node.js 22.22.2 或符合 `jsdom` 引擎要求的版本：

```bash
npm ci --ignore-scripts
npm run vendor
npm test
npm run audit
```

固定版本：Marked 18.1.1、DOMPurify 3.4.17、jsdom 30.1.3。jsdom 仅为测试工具；最终页面不会加载它。

本次 **17 项隔离 DOM 测试通过**，涵盖真实 FileReader 的 UTF-8/GBK 解码、Markdown 清洗、进度保存/恢复、导出和异常场景；依赖审计返回 0 条已知漏洞告警。范围与限制见 [验证记录](docs/validation.md)，发布文件检查见 [安全说明](docs/security-review.md)。

## 项目结构

```text
txt-reader/
├── index.html
├── assets/
│   ├── reader.js
│   └── vendor/              # 浏览器库、许可证、版本与哈希
├── examples/                # 可打开的 TXT / Markdown 样例
├── scripts/vendor.mjs       # 从锁定依赖生成本地库文件
├── tests/reader.test.mjs     # 隔离 DOM 功能与安全测试
├── docs/assets/             # 架构 PNG / SVG / 绘图源码
├── package.json
└── package-lock.json
```

当前不提供 EPUB/PDF/DOCX 解析、OCR、目录侧栏、全文搜索、书签管理或云端书库。第三方库的许可证和复制方式见 [第三方说明](THIRD_PARTY_NOTICES.md)。
