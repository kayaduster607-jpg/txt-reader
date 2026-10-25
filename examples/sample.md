# Markdown 阅读示例

这个文件用于体验标题、列表、代码和表格排版。

## 阅读操作

- 选择 UTF-8 或 GBK 解码。
- 使用小、中、大按钮调整字号。
- 使用蓝、绿、黑按钮切换主题。
- 滚动后自动保存位置，也可以手动保存。

> 原始文档由浏览器读取；进度记录不包含正文。

```python
def reading_progress(position):
    # A record stores the location, not the document body.
    return {"position": position}
```

| 操作 | 结果 |
| --- | --- |
| 保存进度 | 写入当前浏览器 localStorage |
| 导出记录 | 下载当前位置的 JSON 元数据 |

当前实现没有目录侧栏、搜索、书签管理或记录导入入口。
