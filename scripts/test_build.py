"""Unit and end-to-end tests for the static site generator."""

from __future__ import annotations

import json
from pathlib import Path
import re
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET

_SCRIPTS_DIR = Path(__file__).resolve().parent
REPO_ROOT = _SCRIPTS_DIR.parent
for _path in (str(REPO_ROOT), str(_SCRIPTS_DIR)):
    if _path not in sys.path:
        sys.path.insert(0, _path)

from build import build_site, parse_post_date
from markdown_parser import build_toc_html, parse_frontmatter, render_markdown


class FrontmatterAndDateTests(unittest.TestCase):
    def test_parse_frontmatter_scalars_and_lists(self) -> None:
        raw = (
            '---\n'
            'title:  "Mac OS의 \\"숨은\\" 설정"\n'
            "excerpt: 'single quoted'\n"
            'comments: false\n'
            'toc: true\n'
            'categories:\n'
            '  - command\n'
            'tags: [macos, shell, command]\n'
            '---\n\nBody text\n'
        )
        fm, body = parse_frontmatter(raw)
        self.assertEqual(fm["title"], 'Mac OS의 "숨은" 설정')
        self.assertEqual(fm["excerpt"], "single quoted")
        self.assertIs(fm["comments"], False)
        self.assertIs(fm["toc"], True)
        self.assertEqual(fm["categories"], ["command"])
        self.assertEqual(fm["tags"], ["macos", "shell", "command"])
        self.assertEqual(body.strip(), "Body text")

    def test_parse_post_date_formats(self) -> None:
        dt1 = parse_post_date("2020-12-13 15:00:00+0900", "2020-12-13", "+09:00")
        self.assertEqual(dt1.isoformat(), "2020-12-13T15:00:00+09:00")

        dt2 = parse_post_date("2020-12-13 15:00:00 +0900", "2020-12-13", "+09:00")
        self.assertEqual(dt2.isoformat(), "2020-12-13T15:00:00+09:00")

        dt3 = parse_post_date("2026-09-18", "2026-09-18", "+09:00")
        self.assertEqual(dt3.isoformat(), "2026-09-18T00:00:00+09:00")


class MarkdownParserTests(unittest.TestCase):
    def test_gfm_table_with_raw_html_and_entities(self) -> None:
        md = (
            "| 표지 | 제목 |\n"
            "|---|---|\n"
            '| <a href="https://example.com?a=1&amp;b=2" target="_blank"><img src="//img.test/a_b.jpg" alt=""/></a> | '
            '<a href="https://example.com" class="aladdin_title">제목</a><br/>저자 |\n'
        )
        rendered, _ = render_markdown(md)
        self.assertIn("<table>", rendered)
        self.assertIn("<thead>", rendered)
        self.assertIn("<tbody>", rendered)
        self.assertIn('href="https://example.com?a=1&amp;b=2"', rendered)
        self.assertIn('class="aladdin_title"', rendered)
        self.assertNotIn("<em>", rendered)

    def test_linked_image_and_hard_line_break(self) -> None:
        md = (
            "[![img](https://example.com/a.jpg)](https://example.com/book)  \n"
            "[책 링크](https://example.com/item?id=1&amp;k=2)  \n"
            "저자"
        )
        rendered, _ = render_markdown(md)
        self.assertIn('<a href="https://example.com/book"><img src="https://example.com/a.jpg" alt="img" /></a><br />', rendered)
        self.assertIn('<a href="https://example.com/item?id=1&amp;k=2">책 링크</a><br />', rendered)

    def test_underscores_in_filenames_and_urls_not_italicized(self) -> None:
        md = "파일명은 `thumb_%04d.jpg` 또는 thumb_0001.jpg 이고 _강조_ 는 기울임입니다."
        rendered, _ = render_markdown(md)
        self.assertIn("thumb_0001.jpg", rendered)
        self.assertNotIn("<em>0001</em>", rendered)
        self.assertIn("<em>강조</em>", rendered)

    def test_fenced_code_escaping_and_highlighting(self) -> None:
        md = (
            "```python\n"
            "def f(x):\n"
            '    # check <script> & "quotes"\n'
            "    return x < 10\n"
            "```\n"
        )
        rendered, _ = render_markdown(md)
        self.assertIn('class="language-python highlighter-rouge"', rendered)
        self.assertIn('<span class="k">def</span>', rendered)
        self.assertIn('<span class="nf">f</span>', rendered)
        self.assertIn("&lt;script&gt;", rendered)
        self.assertNotIn("<script>", rendered)

    def test_inline_code_escapes_html(self) -> None:
        rendered, _ = render_markdown("Use `<script>alert(1)</script>` carefully.")
        self.assertIn('<code class="language-plaintext highlighter-rouge">&lt;script&gt;alert(1)&lt;/script&gt;</code>', rendered)
        self.assertNotIn("<script>", rendered)

    def test_nested_lists(self) -> None:
        md = (
            "- item 1\n"
            "  - nested a\n"
            "  - nested b\n"
            "- item 2\n"
        )
        rendered, _ = render_markdown(md)
        self.assertIn("<ul>\n<li>item 1\n<ul>\n<li>nested a</li>\n<li>nested b</li>\n</ul></li>\n<li>item 2</li>\n</ul>", rendered)

    def test_headings_slugs_and_toc_nesting(self) -> None:
        md = (
            "## 기본앱 관련 설정\n"
            "### 배터리 남은 잔량 % 표시하기\n"
            "### 번외편: Nvidia 하드웨어 인코딩 사용하기\n"
            "## 기본앱 관련 설정\n"
        )
        rendered, headings = render_markdown(md)
        self.assertEqual(headings[0][1], "기본앱-관련-설정")
        self.assertEqual(headings[1][1], "배터리-남은-잔량--표시하기")
        self.assertEqual(headings[2][1], "번외편-nvidia-하드웨어-인코딩-사용하기")
        self.assertEqual(headings[3][1], "기본앱-관련-설정-1")
        toc = build_toc_html(headings)
        self.assertIn('<ul class="toc__menu">', toc)
        self.assertIn('<li><a href="#기본앱-관련-설정">기본앱 관련 설정</a>\n<ul>', toc)
        self.assertIn('href="#배터리-남은-잔량--표시하기"', toc)
        self.assertIn('id="기본앱-관련-설정-1"', rendered)

    def test_gist_and_empty_highlight_liquid_tags(self) -> None:
        md = (
            "{% highlight bash linenos %}\n"
            "{% endhighlight %}\n\n"
            "{% gist nuridol/0decdece8c5bf86789b7229a9d7a7c58 %}\n"
        )
        rendered, _ = render_markdown(md)
        self.assertNotIn("{%", rendered)
        self.assertIn('<script src="https://gist.github.com/nuridol/0decdece8c5bf86789b7229a9d7a7c58.js"></script>', rendered)


class EndToEndBuildTests(unittest.TestCase):
    def test_full_site_build_outputs_and_integrity(self) -> None:
        self.assertTrue((REPO_ROOT / "_pages/about.md").is_file())
        self.assertFalse((REPO_ROOT / "_pages/abount.md").exists())

        with tempfile.TemporaryDirectory() as tmpdir:
            out = Path(tmpdir) / "_site"
            stats = build_site(REPO_ROOT, out)
            self.assertEqual(stats["posts"], 8)
            self.assertEqual(stats["pages"], 4)
            self.assertEqual(stats["home_pages"], 2)

            expected_files = [
                "index.html",
                "page2/index.html",
                "about/index.html",
                "categories/index.html",
                "tags/index.html",
                "year-archive/index.html",
                "blog/first-post/index.html",
                "command/ffmpeg/index.html",
                "command/mac-setting/index.html",
                "python/mitmproxy/index.html",
                "command/auto-git-commit/index.html",
                "python/selenium-tips/index.html",
                "book/algorithm-book/index.html",
                "app/switchim-2.0/index.html",
                "feed.xml",
                "sitemap.xml",
                "assets/css/main.css",
                "assets/js/site.js",
                "assets/js/search-data.js",
                "CNAME",
                "robots.txt",
                ".nojekyll",
                "tools/stock_kr.html",
                "if_convert.html",
            ]
            for rel in expected_files:
                self.assertTrue((out / rel).is_file(), f"Missing output file: {rel}")

            # Validate Atom feed XML
            feed_root = ET.fromstring((out / "feed.xml").read_text(encoding="utf-8"))
            ns = {"atom": "http://www.w3.org/2005/Atom"}
            entries = feed_root.findall("atom:entry", ns)
            self.assertEqual(len(entries), 8)

            # Validate sitemap XML
            sitemap_root = ET.fromstring((out / "sitemap.xml").read_text(encoding="utf-8"))
            sm_ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            locs = {el.text for el in sitemap_root.findall("sm:url/sm:loc", sm_ns)}
            self.assertIn("https://www.nuridol.net/app/switchim-2.0/", locs)
            self.assertIn("https://www.nuridol.net/command/ffmpeg/", locs)
            self.assertIn("https://www.nuridol.net/tools/stock_kr.html", locs)

            # Validate search index JSON
            search_js = (out / "assets/js/search-data.js").read_text(encoding="utf-8")
            self.assertTrue(search_js.startswith("window.__SEARCH_INDEX__ = "))
            json_payload = search_js.removeprefix("window.__SEARCH_INDEX__ = ").rstrip(";\n ")
            search_items = json.loads(json_payload)
            self.assertEqual(len(search_items), 8)
            self.assertEqual(search_items[0]["url"], "/app/switchim-2.0/")

            # Validate Disqus identifiers match legacy Jekyll values
            disqus_expectations = {
                "command/ffmpeg/index.html": 'this.page.identifier = "/command/ffmpeg"',
                "book/algorithm-book/index.html": 'this.page.identifier = "/book/algorithm-book"',
                "python/mitmproxy/index.html": 'this.page.identifier = "/python/mitmproxy"',
            }
            for rel, expected_id in disqus_expectations.items():
                content = (out / rel).read_text(encoding="utf-8")
                self.assertIn(expected_id, content)

            # Validate GTM, zero unrendered Liquid tags, and internal href resolution across blog HTML
            blog_html_files = [
                out / rel
                for rel in expected_files
                if rel.endswith(".html") and not rel.startswith("tools/") and rel != "if_convert.html"
            ]
            for html_file in blog_html_files:
                doc = html_file.read_text(encoding="utf-8")
                self.assertIn("GTM-WBXWKVDB", doc)
                self.assertIn("https://www.googletagmanager.com/ns.html?id=GTM-WBXWKVDB", doc)
                self.assertNotRegex(doc, r"\{%|\{\{", msg=f"Unrendered Liquid tag in {html_file}")
                self.assertNotRegex(
                    doc,
                    r"(?i)jekyll|minimal-mistakes|mademistakes\.com",
                    msg=f"Legacy Jekyll/theme reference found in {html_file}",
                )

                for href in re.findall(r'href="(/[^"]*)"', doc):
                    if href.startswith("//"):
                        continue
                    path_part = href.split("#", 1)[0].split("?", 1)[0]
                    target = out / path_part.lstrip("/")
                    resolved = target if target.is_file() else target / "index.html"
                    self.assertTrue(
                        resolved.is_file(),
                        f"Broken internal link {href!r} in {html_file.relative_to(out)}",
                    )

    def test_baseurl_prefixing(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            out = Path(tmpdir) / "_site_sub"
            build_site(REPO_ROOT, out, baseurl="/subpath")
            index_html = (out / "index.html").read_text(encoding="utf-8")
            self.assertIn('href="/subpath/about/"', index_html)
            self.assertIn('href="/subpath/assets/css/main.css"', index_html)
            self.assertIn('src="/subpath/assets/js/site.js"', index_html)
            self.assertIn('href="/subpath/feed.xml"', index_html)

            search_js = (out / "assets/js/search-data.js").read_text(encoding="utf-8")
            items = json.loads(search_js.removeprefix("window.__SEARCH_INDEX__ = ").rstrip(";\n "))
            self.assertTrue(items[0]["url"].startswith("/subpath/"))


if __name__ == "__main__":
    unittest.main()
