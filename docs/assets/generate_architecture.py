"""Generate a compact editorial diagram of the local reading data flow."""

from pathlib import Path
from xml.etree.ElementTree import Element, SubElement, ElementTree, indent, tostring


WIDTH, HEIGHT = 1800, 920
INK, MUTED, RULE, ACCENT = "#292C29", "#777C75", "#DDDCD6", "#71618E"
MONO = "Consolas, SFMono-Regular, monospace"


def node(parent, tag, **attrs):
    """Translate Python-friendly names into native SVG attributes."""
    return SubElement(parent, tag, {key.replace("_", "-"): str(value) for key, value in attrs.items()})


def text(parent, x, y, value, size=24, color=INK, weight=400, mono=False, anchor="start"):
    """Keep every label on an explicit baseline for stable Chinese text layout."""
    attrs = {"x": x, "y": y, "fill": color, "font_size": size, "font_weight": weight, "text_anchor": anchor}
    if mono:
        attrs["font_family"] = MONO
    item = node(parent, "text", **attrs)
    item.text = value


def line(parent, x1, y1, x2, y2, color=RULE):
    node(parent, "line", x1=x1, y1=y1, x2=x2, y2=y2, stroke=color, stroke_width=1.4)


def box(parent, x, y, width, height, fill="#FFFFFF", stroke=RULE, radius=8):
    """Use containers only for real browser/storage boundaries."""
    node(parent, "rect", x=x, y=y, width=width, height=height, rx=radius, fill=fill, stroke=stroke, stroke_width=1.4)


def arrow(parent, path):
    node(parent, "path", d=path, fill="none", stroke="#A0A59E", stroke_width=1.8, marker_end="url(#arrow)", stroke_linejoin="round")


def file_icon(parent, x, y, label="TXT"):
    """A folded document represents files outside the browser memory boundary."""
    node(parent, "path", d=f"M{x} {y} h38 l18 18 v54 h-56 z", fill="#F0EEF4", stroke="#C5BDCF", stroke_width=1.3)
    node(parent, "path", d=f"M{x + 38} {y} v18 h18", fill="none", stroke="#C5BDCF", stroke_width=1.3)
    text(parent, x + 28, y + 51, label, 18, ACCENT, 400, True, "middle")


def draw_header(svg):
    text(svg, 64, 60, "TXT READER / LOCAL PROCESSING", 18, ACCENT, 400, True)
    text(svg, 64, 121, "本地阅读流程", 47, INK, 700)
    text(svg, 430, 118, "文本解码  /  安全渲染  /  阅读记录", 24, MUTED)
    line(svg, 64, 155, 1736, 155)


def draw_file_input(svg):
    file_icon(svg, 64, 264)
    text(svg, 140, 301, "LOCAL FILE", 16, ACCENT, 400, True)
    text(svg, 64, 363, "TXT / Markdown", 30, INK, 700)
    text(svg, 64, 408, "选择本机文件", 23, MUTED)
    line(svg, 64, 438, 320, 438)
    text(svg, 64, 478, "正文留在页面内存", 22, MUTED)
    arrow(svg, "M 320 355 H 400")
    text(svg, 360, 338, "读取", 17, MUTED, 400, False, "middle")


def draw_browser(svg):
    """Show the decoder, separate rendering paths and reading controls."""
    box(svg, 400, 230, 1150, 520, "#F8F8F5", "#BCBEB5", 12)
    text(svg, 434, 279, "浏览器内处理", 33, INK, 700)
    text(svg, 1516, 278, "HTML / CSS / JavaScript", 19, MUTED, 400, True, "end")
    line(svg, 434, 310, 1516, 310)
    text(svg, 434, 358, "FileReader 解码", 27, INK, 600)
    text(svg, 766, 357, "UTF-8 / GBK", 22, MUTED, 400, True)
    text(svg, 434, 425, "TXT", 23, ACCENT, 400, True)
    text(svg, 554, 425, "段落化 → textContent", 27, INK)
    text(svg, 434, 488, "MD", 23, ACCENT, 400, True)
    text(svg, 554, 488, "Marked → DOMPurify", 27, INK)
    arrow(svg, "M 968 435 H 1148")
    text(svg, 1058, 416, "渲染", 17, MUTED, 400, False, "middle")
    text(svg, 1176, 370, "阅读界面", 31, INK, 700)
    text(svg, 1176, 412, "段落 · 标题 · 列表 · 代码", 22, MUTED)
    text(svg, 1176, 451, "三档字号 · 三种主题", 22, MUTED)
    text(svg, 1176, 490, "滚动 / 手动保存 / 导出", 21, MUTED)
    line(svg, 434, 551, 1516, 551)


def draw_progress(svg):
    """Keep local persistence distinct from one-way JSON download."""
    box(svg, 434, 596, 520, 112, radius=6)
    text(svg, 456, 625, "LOCAL PROGRESS", 15, ACCENT, 400, True)
    text(svg, 456, 667, "localStorage", 27, INK, 600, True)
    text(svg, 676, 667, "文件名 / 位置 / 时间", 21, MUTED)
    arrow(svg, "M 1276 514 V 652 H 954")
    text(svg, 1109, 631, "记录位置", 18, MUTED, 400, False, "middle")
    arrow(svg, "M 1430 514 V 652 H 1610")
    text(svg, 1586, 632, "导出", 17, MUTED, 400, False, "middle")
    file_icon(svg, 1632, 581, "JSON")
    text(svg, 1610, 702, "记录 JSON", 29, INK, 700)
    text(svg, 1610, 739, "仅当前位置元数据", 20, MUTED)


def build_svg():
    svg = Element("svg", {"xmlns": "http://www.w3.org/2000/svg", "width": str(WIDTH), "height": str(HEIGHT), "viewBox": f"0 0 {WIDTH} {HEIGHT}", "font-family": "Segoe UI, Microsoft YaHei, sans-serif"})
    node(svg, "title").text = "TXT / Markdown 阅读器：本地阅读流程"
    node(svg, "desc").text = "用户选择本地文档，浏览器通过 FileReader 按 UTF-8 或 GBK 解码。TXT 安全渲染为段落，Markdown 经 Marked 解析及 DOMPurify 清洗。阅读位置保存在 localStorage，当前记录可单向导出为 JSON。"
    definitions = node(svg, "defs")
    marker = node(definitions, "marker", id="arrow", markerWidth=8, markerHeight=8, refX=7, refY=4, orient="auto", markerUnits="userSpaceOnUse")
    node(marker, "path", d="M 0 0 L 8 4 L 0 8 z", fill="#A0A59E")
    node(svg, "rect", width=WIDTH, height=HEIGHT, fill="#FFFFFF")
    draw_header(svg)
    draw_file_input(svg)
    draw_browser(svg)
    draw_progress(svg)
    line(svg, 64, 855, 1736, 855)
    text(svg, 64, 897, "STATIC APP", 16, ACCENT, 400, True)
    text(svg, 265, 897, "file://  /  普通静态托管", 22, INK)
    text(svg, 1736, 897, "无需账号、后端或 API Key", 22, MUTED, 400, False, "end")
    return svg


def main():
    """Write bytes to keep vector output stable across operating systems."""
    target = Path(__file__).with_name("architecture.svg")
    document = ElementTree(build_svg())
    indent(document)
    target.write_bytes(tostring(document.getroot(), encoding="utf-8", xml_declaration=True))
    print(target)


if __name__ == "__main__":
    main()
