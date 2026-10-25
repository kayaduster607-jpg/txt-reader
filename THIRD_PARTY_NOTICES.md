# 第三方浏览器库

应用直接加载仓库中保存的浏览器版本，无需运行时访问 CDN。

| 库 | 固定版本 | 用途 | 上游许可证 |
| --- | --- | --- | --- |
| Marked | 18.1.1 | Markdown 转 HTML | MIT |
| DOMPurify | 3.4.17 | 插入页面前清洗 HTML | MPL-2.0 OR Apache-2.0 |

许可证原文位于 `assets/vendor/marked.LICENSE`、`assets/vendor/dompurify.LICENSE` 和 `assets/vendor/dompurify.LICENSE-MPL`；`versions.json` 保存版本与已交付 JavaScript 文件的 SHA-256。

`npm ci` 按锁文件安装官方 npm 包，`npm run vendor` 复制浏览器文件、许可证及版本信息。复制时只去掉未交付 source map 的调试链接注释，保留库的代码与授权头。

jsdom 30.1.3 仅用于开发测试，不由浏览器加载。其他开发依赖的版本和完整性记录见 `package-lock.json`，各自许可见相应 npm 包。

本项目的业务代码当前没有单独的开源许可证声明；第三方库的授权不自动适用于本项目的其他文件。
