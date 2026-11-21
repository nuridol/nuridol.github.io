"""Zero-dependency Markdown, frontmatter, TOC, and syntax highlighting parser."""

from __future__ import annotations

import html
import re
from typing import Any

_FRONTMATTER_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*(?:\n|\Z)", re.DOTALL)
_HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*#*\s*$")
_HR_RE = re.compile(r"^(?:[-*_]\s*){3,}$")
_FENCE_OPEN_RE = re.compile(r"^(`{3,}|~{3,})\s*([A-Za-z0-9_+-]*)\s*$")
_GIST_TAG_RE = re.compile(r"^\{%\s*gist\s+([^\s%]+)\s*%\}\s*$")
_HIGHLIGHT_OPEN_RE = re.compile(r"^\{%\s*highlight\s+([A-Za-z0-9_+-]+)(?:\s+[^%]*)?%\}\s*$")
_HIGHLIGHT_CLOSE_RE = re.compile(r"^\{%\s*endhighlight\s*%\}\s*$")
_UL_ITEM_RE = re.compile(r"^(\s*)[-*+]\s+(.*)$")
_OL_ITEM_RE = re.compile(r"^(\s*)\d+\.\s+(.*)$")
_TABLE_SEP_RE = re.compile(r"^\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$")
_RAW_HTML_BLOCK_RE = re.compile(
    r"^<(?:table|thead|tbody|tr|th|td|div|section|article|aside|header|footer|nav|figure|"
    r"figcaption|details|summary|script|noscript|style|iframe|blockquote|pre|ul|ol|li|p|hr|br|!--)\b",
    re.IGNORECASE,
)

_INLINE_CODE_RE = re.compile(r"(``+)([^\n]*?)\1|`([^`\n]+)`")
_HTML_TAG_OR_COMMENT_RE = re.compile(
    r"<!--.*?-->|</?[A-Za-z][A-Za-z0-9-]*(?:\s+[^<>]*)?/?>",
    re.DOTALL,
)
_HTML_ENTITY_RE = re.compile(r"&(?:#\d+|#x[0-9A-Fa-f]+|[A-Za-z][A-Za-z0-9]+);")
_LINKED_IMAGE_RE = re.compile(
    r"\[!\[([^\]]*)\]\(((?:[^()\s]|\([^()\s]*\))+)(?:\s+\"([^\"]*)\")?\)\]\(((?:[^()\s]|\([^()\s]*\))+)(?:\s+\"([^\"]*)\")?\)"
)
_IMAGE_RE = re.compile(
    r"!\[([^\]]*)\]\(((?:[^()\s]|\([^()\s]*\))+)(?:\s+\"([^\"]*)\")?\)"
)
_LINK_RE = re.compile(
    r"\[([^\[\]]+(?:\[[^\]]*\][^\[\]]*)*)\]\(((?:[^()\s]|\([^()\s]*\))+)(?:\s+\"([^\"]*)\")?\)"
)

_BASH_KEYWORDS = {
    "if", "then", "else", "elif", "fi", "for", "in", "do", "done",
    "while", "until", "case", "esac", "function", "return", "export",
    "alias", "local", "declare", "readonly", "unset",
}
_BASH_BUILTINS = {
    "echo", "printf", "cd", "pwd", "ls", "mkdir", "rm", "cp", "mv", "cat",
    "grep", "sed", "awk", "chmod", "chown", "sudo", "brew", "git", "ffmpeg",
    "ffmpegu", "defaults", "killall", "openssl", "xattr", "python3", "curl",
    "source", "test", "true", "false", "exit",
}
_BASH_TOKEN_RE = re.compile(
    r"(?P<comment>#[^\n]*)"
    r"|(?P<s2>\"(?:\\.|[^\"\\])*\")"
    r"|(?P<s1>'[^']*')"
    r"|(?P<var>\$\{[^}]+\}|\$[A-Za-z_][A-Za-z0-9_]*)"
    r"|(?P<flag>(?<=\s)--?[A-Za-z0-9][A-Za-z0-9_-]*)"
    r"|(?P<word>\b[A-Za-z_][A-Za-z0-9_-]*\b)"
    r"|(?P<num>\b\d+(?:\.\d+)?\b)"
)

_PY_KEYWORDS = {
    "False", "None", "True", "and", "as", "assert", "async", "await",
    "break", "class", "continue", "def", "del", "elif", "else", "except",
    "finally", "for", "from", "global", "if", "import", "in", "is",
    "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try",
    "while", "with", "yield",
}
_PY_BUILTINS = {
    "abs", "all", "any", "bool", "bytes", "dict", "enumerate", "Exception",
    "filter", "float", "int", "isinstance", "len", "list", "map", "max",
    "min", "open", "print", "range", "set", "sorted", "str", "sum",
    "tuple", "type", "zip",
}
_PY_TOKEN_RE = re.compile(
    r"(?P<comment>#[^\n]*)"
    r"|(?P<triple>\"\"\"[\s\S]*?\"\"\"|'''[\s\S]*?''')"
    r"|(?P<s2>\"(?:\\.|[^\"\\\n])*\")"
    r"|(?P<s1>'(?:\\.|[^'\\\n])*')"
    r"|(?P<word>\b[A-Za-z_][A-Za-z0-9_]*\b)"
    r"|(?P<num>\b\d+(?:\.\d+)?\b)"
    r"|(?P<op>==|!=|<=|>=|<<|>>|\*\*|//|[+\-*/%=<>|&~^])"
)


def _unquote_yaml_scalar(value: str) -> Any:
    trimmed = value.strip()
    if not trimmed:
        return ""
    if len(trimmed) >= 2 and trimmed[0] == '"' and trimmed[-1] == '"':
        inner = trimmed[1:-1]
        return inner.replace('\\"', '"').replace("\\\\", "\\")
    if len(trimmed) >= 2 and trimmed[0] == "'" and trimmed[-1] == "'":
        return trimmed[1:-1].replace("''", "'")
    lower = trimmed.lower()
    if lower == "true":
        return True
    if lower == "false":
        return False
    return trimmed


def parse_frontmatter(raw_text: str) -> tuple[dict[str, Any], str]:
    """Extract YAML frontmatter metadata and return (metadata, body)."""
    normalized = raw_text.replace("\r\n", "\n")
    match = _FRONTMATTER_RE.match(normalized)
    if not match:
        return {}, normalized

    fm_block = match.group(1)
    body = normalized[match.end():]
    data: dict[str, Any] = {}
    current_list_key: str | None = None

    for raw_line in fm_block.split("\n"):
        if not raw_line.strip() or raw_line.lstrip().startswith("#"):
            continue

        list_match = re.match(r"^\s*-\s+(.*)$", raw_line)
        if list_match and current_list_key is not None:
            existing = data.get(current_list_key)
            if not isinstance(existing, list):
                existing = []
                data[current_list_key] = existing
            existing.append(_unquote_yaml_scalar(list_match.group(1)))
            continue

        kv_match = re.match(r"^([A-Za-z0-9_-]+)\s*:\s*(.*)$", raw_line)
        if not kv_match:
            current_list_key = None
            continue

        key = kv_match.group(1).strip()
        val_raw = kv_match.group(2).strip()
        if not val_raw:
            data[key] = []
            current_list_key = key
        elif val_raw.startswith("[") and val_raw.endswith("]"):
            inner = val_raw[1:-1].strip()
            data[key] = [
                _unquote_yaml_scalar(part)
                for part in inner.split(",")
                if part.strip()
            ] if inner else []
            current_list_key = None
        else:
            data[key] = _unquote_yaml_scalar(val_raw)
            current_list_key = None

    return data, body


def strip_html(html_text: str) -> str:
    """Remove HTML tags and collapse whitespace into single spaces."""
    unescaped = html.unescape(re.sub(r"<[^>]+>", " ", html_text))
    return re.sub(r"\s+", " ", unescaped).strip()


def slugify_heading(text: str, seen: dict[str, int]) -> str:
    """Generate Kramdown-compatible Korean/English heading IDs with deduplication."""
    plain = strip_html(text).lower()
    # Keep Unicode word chars, whitespace, and hyphens; drop punctuation like ':' or '%'
    cleaned = re.sub(r"[^\w\s-]", "", plain, flags=re.UNICODE)
    slug = cleaned.replace(" ", "-") or "section"
    count = seen.get(slug, 0)
    seen[slug] = count + 1
    return slug if count == 0 else f"{slug}-{count}"


def _escape_url(raw_url: str) -> str:
    return html.escape(html.unescape(raw_url.strip()), quote=True)


def highlight_code(code: str, lang: str) -> str:
    """Highlight bash or python code with Rouge-compatible spans, safely HTML-escaped."""
    lang_norm = (lang or "").strip().lower()
    if lang_norm in {"bash", "sh", "shell", "zsh"}:
        token_re = _BASH_TOKEN_RE
        mode = "bash"
    elif lang_norm in {"python", "py"}:
        token_re = _PY_TOKEN_RE
        mode = "python"
    else:
        return html.escape(code, quote=False)

    parts: list[str] = []
    pos = 0
    prev_word = ""

    for m in token_re.finditer(code):
        if m.start() > pos:
            parts.append(html.escape(code[pos:m.start()], quote=False))

        kind = m.lastgroup
        lexeme = m.group(0)
        escaped = html.escape(lexeme, quote=False)

        if kind == "comment":
            parts.append(f'<span class="c">{escaped}</span>')
        elif kind in {"s1", "s2", "triple"}:
            cls = "s" if kind == "triple" else kind
            parts.append(f'<span class="{cls}">{escaped}</span>')
        elif kind == "var":
            parts.append(f'<span class="nv">{escaped}</span>')
        elif kind == "flag":
            parts.append(f'<span class="nt">{escaped}</span>')
        elif kind == "num":
            parts.append(f'<span class="m">{escaped}</span>')
        elif kind == "op":
            parts.append(f'<span class="o">{escaped}</span>')
        elif kind == "word":
            if mode == "bash":
                if lexeme in _BASH_KEYWORDS:
                    parts.append(f'<span class="k">{escaped}</span>')
                elif lexeme in _BASH_BUILTINS:
                    parts.append(f'<span class="nb">{escaped}</span>')
                else:
                    parts.append(escaped)
            else:
                if lexeme in _PY_KEYWORDS:
                    parts.append(f'<span class="k">{escaped}</span>')
                elif lexeme in _PY_BUILTINS:
                    parts.append(f'<span class="nb">{escaped}</span>')
                elif prev_word == "def":
                    parts.append(f'<span class="nf">{escaped}</span>')
                elif prev_word == "class":
                    parts.append(f'<span class="nc">{escaped}</span>')
                else:
                    parts.append(escaped)
            prev_word = lexeme
            pos = m.end()
            continue

        prev_word = ""
        pos = m.end()

    if pos < len(code):
        parts.append(html.escape(code[pos:], quote=False))
    return "".join(parts)


class _PlaceholderStore:
    def __init__(self) -> None:
        self.items: list[str] = []

    def put(self, value: str) -> str:
        idx = len(self.items)
        self.items.append(value)
        return f"\x00PH{idx}\x00"

    def restore(self, text: str) -> str:
        # Reverse order resolves nested placeholders inserted recursively.
        for idx in range(len(self.items) - 1, -1, -1):
            token = f"\x00PH{idx}\x00"
            if token in text:
                text = text.replace(token, self.items[idx])
        return text


def _apply_emphasis(text: str) -> str:
    text = re.sub(r"\*\*\*([^\n*](?:.*?[^\n*])?)\*\*\*", r"<strong><em>\1</em></strong>", text)
    text = re.sub(r"\*\*([^\n*](?:.*?[^\n*])?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\w)__([^\n_](?:.*?[^\n_])?)__(?!\w)", r"<strong>\1</strong>", text)
    text = re.sub(r"~~([^\n~](?:.*?[^\n~])?)~~", r"<del>\1</del>", text)
    text = re.sub(r"(?<!\*)\*([^\s*](?:[^\n*]*?[^\s*])?)\*(?!\*)", r"<em>\1</em>", text)
    text = re.sub(r"(?<!\w)_([^\s_](?:[^\n_]*?[^\s_])?)_(?!\w)", r"<em>\1</em>", text)
    return text


def render_inline(text: str) -> str:
    """Render inline Markdown (code, links, images, emphasis) while preserving raw HTML."""
    store = _PlaceholderStore()

    def _replace_code(m: re.Match[str]) -> str:
        content = m.group(2) if m.group(1) else m.group(3)
        escaped = html.escape(content, quote=False)
        return store.put(f'<code class="language-plaintext highlighter-rouge">{escaped}</code>')

    work = _INLINE_CODE_RE.sub(_replace_code, text)
    work = _HTML_TAG_OR_COMMENT_RE.sub(lambda m: store.put(m.group(0)), work)
    work = _HTML_ENTITY_RE.sub(lambda m: store.put(m.group(0)), work)

    def _replace_linked_image(m: re.Match[str]) -> str:
        alt = html.escape(html.unescape(m.group(1)), quote=True)
        img_url = _escape_url(m.group(2))
        img_title = f' title="{html.escape(m.group(3), quote=True)}"' if m.group(3) else ""
        link_url = _escape_url(m.group(4))
        link_title = f' title="{html.escape(m.group(5), quote=True)}"' if m.group(5) else ""
        return store.put(
            f'<a href="{link_url}"{link_title}><img src="{img_url}" alt="{alt}"{img_title} /></a>'
        )

    work = _LINKED_IMAGE_RE.sub(_replace_linked_image, work)

    def _replace_image(m: re.Match[str]) -> str:
        alt = html.escape(html.unescape(m.group(1)), quote=True)
        img_url = _escape_url(m.group(2))
        img_title = f' title="{html.escape(m.group(3), quote=True)}"' if m.group(3) else ""
        return store.put(f'<img src="{img_url}" alt="{alt}"{img_title} />')

    work = _IMAGE_RE.sub(_replace_image, work)

    def _replace_link(m: re.Match[str]) -> str:
        label_html = _apply_emphasis(html.escape(m.group(1), quote=False))
        url = _escape_url(m.group(2))
        title_attr = f' title="{html.escape(m.group(3), quote=True)}"' if m.group(3) else ""
        return store.put(f'<a href="{url}"{title_attr}>{label_html}</a>')

    work = _LINK_RE.sub(_replace_link, work)
    work = html.escape(work, quote=False)
    work = _apply_emphasis(work)
    return store.restore(work)


def _split_table_row(line: str) -> list[str]:
    stripped = line.strip()
    if stripped.startswith("|"):
        stripped = stripped[1:]
    if stripped.endswith("|"):
        stripped = stripped[:-1]
    cells: list[str] = []
    buf: list[str] = []
    in_code = False
    i = 0
    while i < len(stripped):
        ch = stripped[i]
        if ch == "\\" and i + 1 < len(stripped) and stripped[i + 1] == "|":
            buf.append("|")
            i += 2
            continue
        if ch == "`":
            in_code = not in_code
            buf.append(ch)
        elif ch == "|" and not in_code:
            cells.append("".join(buf).strip())
            buf = []
        else:
            buf.append(ch)
        i += 1
    cells.append("".join(buf).strip())
    return cells


def _parse_alignments(sep_line: str) -> list[str]:
    alignments: list[str] = []
    for cell in _split_table_row(sep_line):
        left = cell.startswith(":")
        right = cell.endswith(":")
        if left and right:
            alignments.append("center")
        elif right:
            alignments.append("right")
        elif left:
            alignments.append("left")
        else:
            alignments.append("")
    return alignments


def _format_code_block(code: str, lang: str) -> str:
    lang_clean = re.sub(r"[^A-Za-z0-9_+-]", "", (lang or "").strip().lower()) or "plaintext"
    highlighted = highlight_code(code, lang_clean)
    return (
        f'<div class="language-{lang_clean} highlighter-rouge">'
        f'<div class="highlight"><pre class="highlight"><code>{highlighted}</code></pre></div>'
        f"</div>"
    )


def _join_paragraph_lines(lines: list[str]) -> str:
    rendered_parts: list[str] = []
    for idx, line in enumerate(lines):
        has_hard_break = idx < len(lines) - 1 and (line.endswith("  ") or line.endswith("\\"))
        clean_line = line[:-1] if line.endswith("\\") else line.rstrip()
        rendered_parts.append(render_inline(clean_line))
        if idx < len(lines) - 1:
            rendered_parts.append("<br />\n" if has_hard_break else "\n")
    return f"<p>{''.join(rendered_parts)}</p>"


def _is_block_boundary(line: str, next_line: str | None) -> bool:
    stripped = line.strip()
    if not stripped:
        return True
    if (
        _FENCE_OPEN_RE.match(line)
        or _HEADING_RE.match(line)
        or _HR_RE.match(stripped)
        or _GIST_TAG_RE.match(stripped)
        or _HIGHLIGHT_OPEN_RE.match(stripped)
        or stripped.startswith(">")
        or _UL_ITEM_RE.match(line)
        or _OL_ITEM_RE.match(line)
        or _RAW_HTML_BLOCK_RE.match(stripped)
    ):
        return True
    if "|" in line and next_line is not None and _TABLE_SEP_RE.match(next_line.strip()):
        return True
    return False


def _parse_list(
    lines: list[str],
    start: int,
    ordered: bool,
    base_indent: int,
) -> tuple[str, int]:
    tag = "ol" if ordered else "ul"
    item_re = _OL_ITEM_RE if ordered else _UL_ITEM_RE
    items_html: list[str] = []
    i = start
    n = len(lines)

    while i < n:
        line = lines[i]
        if not line.strip():
            # Blank line ends list unless another item at same indent follows immediately.
            if i + 1 < n:
                nxt = item_re.match(lines[i + 1])
                if nxt and len(nxt.group(1)) == base_indent:
                    i += 1
                    continue
            break

        m = item_re.match(line)
        if not m:
            break
        indent = len(m.group(1))
        if indent < base_indent:
            break
        if indent > base_indent:
            sub_html, i = _parse_list(lines, i, ordered, indent)
            if items_html:
                items_html[-1] = items_html[-1][:-5] + "\n" + sub_html + "</li>"
            continue

        item_lines = [m.group(2).strip()]
        i += 1
        nested_parts: list[str] = []
        while i < n:
            cur = lines[i]
            if not cur.strip():
                break
            sub_ul = _UL_ITEM_RE.match(cur)
            sub_ol = _OL_ITEM_RE.match(cur)
            if sub_ul and len(sub_ul.group(1)) > base_indent:
                sub_html, i = _parse_list(lines, i, False, len(sub_ul.group(1)))
                nested_parts.append(sub_html)
                continue
            if sub_ol and len(sub_ol.group(1)) > base_indent:
                sub_html, i = _parse_list(lines, i, True, len(sub_ol.group(1)))
                nested_parts.append(sub_html)
                continue
            if sub_ul or sub_ol or _is_block_boundary(cur, lines[i + 1] if i + 1 < n else None):
                break
            if cur.startswith("  ") or cur.startswith("\t"):
                item_lines.append(cur.strip())
                i += 1
                continue
            break

        text_html = render_inline(" ".join(item_lines))
        if nested_parts:
            items_html.append(f"<li>{text_html}\n" + "\n".join(nested_parts) + "</li>")
        else:
            items_html.append(f"<li>{text_html}</li>")

    return f"<{tag}>\n" + "\n".join(items_html) + f"\n</{tag}>", i


def _render_blocks(
    lines: list[str],
    headings: list[tuple[int, str, str]],
    seen_ids: dict[str, int],
) -> list[str]:
    blocks: list[str] = []
    i = 0
    n = len(lines)

    while i < n:
        line = lines[i]
        stripped = line.strip()
        if not stripped:
            i += 1
            continue

        fence = _FENCE_OPEN_RE.match(line)
        if fence:
            fence_char = fence.group(1)[0]
            fence_len = len(fence.group(1))
            lang = fence.group(2)
            code_lines: list[str] = []
            i += 1
            close_re = re.compile(rf"^{re.escape(fence_char)}{{{fence_len},}}\s*$")
            while i < n and not close_re.match(lines[i]):
                code_lines.append(lines[i])
                i += 1
            if i < n:
                i += 1
            code_text = "\n".join(code_lines)
            if code_text:
                code_text += "\n"
            blocks.append(_format_code_block(code_text, lang))
            continue

        hl_open = _HIGHLIGHT_OPEN_RE.match(stripped)
        if hl_open:
            lang = hl_open.group(1)
            code_lines = []
            i += 1
            while i < n and not _HIGHLIGHT_CLOSE_RE.match(lines[i].strip()):
                code_lines.append(lines[i])
                i += 1
            if i < n:
                i += 1
            code_text = "\n".join(code_lines)
            if code_text.strip():
                blocks.append(_format_code_block(code_text + "\n", lang))
            continue

        gist_m = _GIST_TAG_RE.match(stripped)
        if gist_m:
            gist_id = html.escape(gist_m.group(1), quote=True)
            blocks.append(
                f'<script src="https://gist.github.com/{gist_id}.js"></script>\n'
                f'<noscript><p><a href="https://gist.github.com/{gist_id}">View Gist: {gist_id}</a></p></noscript>'
            )
            i += 1
            continue

        h_m = _HEADING_RE.match(line)
        if h_m:
            level = len(h_m.group(1))
            raw_title = h_m.group(2)
            rendered_title = render_inline(raw_title)
            heading_id = slugify_heading(rendered_title, seen_ids)
            plain_title = strip_html(rendered_title)
            headings.append((level, heading_id, plain_title))
            blocks.append(f'<h{level} id="{html.escape(heading_id, quote=True)}">{rendered_title}</h{level}>')
            i += 1
            continue

        if _HR_RE.match(stripped):
            blocks.append("<hr />")
            i += 1
            continue

        if "|" in line and i + 1 < n and _TABLE_SEP_RE.match(lines[i + 1].strip()):
            headers = _split_table_row(line)
            alignments = _parse_alignments(lines[i + 1].strip())
            i += 2
            rows: list[list[str]] = []
            while i < n and lines[i].strip() and "|" in lines[i]:
                rows.append(_split_table_row(lines[i]))
                i += 1

            thead_cells = []
            for idx, cell in enumerate(headers):
                align = alignments[idx] if idx < len(alignments) else ""
                align_attr = f' style="text-align: {align}"' if align else ""
                thead_cells.append(f"<th{align_attr}>{render_inline(cell)}</th>")

            tbody_rows = []
            for row in rows:
                td_cells = []
                for idx in range(len(headers)):
                    cell_val = row[idx] if idx < len(row) else ""
                    align = alignments[idx] if idx < len(alignments) else ""
                    align_attr = f' style="text-align: {align}"' if align else ""
                    td_cells.append(f"<td{align_attr}>{render_inline(cell_val)}</td>")
                tbody_rows.append("<tr>\n" + "\n".join(td_cells) + "\n</tr>")

            table_html = (
                "<table>\n<thead>\n<tr>\n"
                + "\n".join(thead_cells)
                + "\n</tr>\n</thead>\n<tbody>\n"
                + "\n".join(tbody_rows)
                + "\n</tbody>\n</table>"
            )
            blocks.append(table_html)
            continue

        if stripped.startswith(">"):
            quote_lines: list[str] = []
            while i < n and lines[i].strip().startswith(">"):
                quote_lines.append(re.sub(r"^\s*>\s?", "", lines[i], count=1))
                i += 1
            inner_blocks = _render_blocks(quote_lines, headings, seen_ids)
            blocks.append("<blockquote>\n" + "\n".join(inner_blocks) + "\n</blockquote>")
            continue

        ul_m = _UL_ITEM_RE.match(line)
        if ul_m:
            list_html, i = _parse_list(lines, i, False, len(ul_m.group(1)))
            blocks.append(list_html)
            continue

        ol_m = _OL_ITEM_RE.match(line)
        if ol_m:
            list_html, i = _parse_list(lines, i, True, len(ol_m.group(1)))
            blocks.append(list_html)
            continue

        if _RAW_HTML_BLOCK_RE.match(stripped):
            raw_lines = [line]
            i += 1
            while i < n and lines[i].strip():
                raw_lines.append(lines[i])
                i += 1
            blocks.append("\n".join(raw_lines))
            continue

        para_lines = [line]
        i += 1
        while i < n:
            nxt = lines[i + 1] if i + 1 < n else None
            if _is_block_boundary(lines[i], nxt):
                break
            para_lines.append(lines[i])
            i += 1
        blocks.append(_join_paragraph_lines(para_lines))

    return blocks


def render_markdown(text: str) -> tuple[str, list[tuple[int, str, str]]]:
    """Convert Markdown text into HTML and extract headings [(level, id, title)]."""
    lines = text.replace("\r\n", "\n").split("\n")
    headings: list[tuple[int, str, str]] = []
    seen_ids: dict[str, int] = {}
    blocks = _render_blocks(lines, headings, seen_ids)
    return "\n\n".join(blocks), headings


def build_toc_html(headings: list[tuple[int, str, str]]) -> str:
    """Build nested <ul class="toc__menu"> HTML from headings."""
    if not headings:
        return ""

    min_level = min(level for level, _, _ in headings)
    root_items: list[dict[str, Any]] = []
    stack: list[tuple[int, list[dict[str, Any]]]] = [(min_level, root_items)]

    for level, hid, title in headings:
        node: dict[str, Any] = {"id": hid, "title": title, "children": []}
        while len(stack) > 1 and level < stack[-1][0]:
            stack.pop()
        if level > stack[-1][0] and stack[-1][1]:
            parent = stack[-1][1][-1]
            stack.append((level, parent["children"]))
        stack[-1][1].append(node)

    def _render_items(items: list[dict[str, Any]]) -> str:
        out: list[str] = []
        for item in items:
            href = html.escape(item["id"], quote=True)
            label = html.escape(item["title"], quote=False)
            if item["children"]:
                children_html = _render_items(item["children"])
                out.append(f'<li><a href="#{href}">{label}</a>\n<ul>\n{children_html}\n</ul>\n</li>')
            else:
                out.append(f'<li><a href="#{href}">{label}</a></li>')
        return "\n".join(out)

    return f'<ul class="toc__menu">\n{_render_items(root_items)}\n</ul>'
