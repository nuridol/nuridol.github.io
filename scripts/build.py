#!/usr/bin/env python3
"""Zero-dependency Python static site generator for nuridol.github.io."""

from __future__ import annotations

import argparse
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from functools import partial
import html
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
import shutil
import sys
from typing import Any
from urllib.parse import quote_plus

try:
    from scripts.markdown_parser import build_toc_html, parse_frontmatter, render_markdown, strip_html
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from markdown_parser import build_toc_html, parse_frontmatter, render_markdown, strip_html


_POST_FILENAME_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})-(.+)\.md$")
_ROOT_STATIC_FILES = [
    "CNAME",
    "robots.txt",
    "favicon.ico",
    "favicon-16x16.png",
    "favicon-32x32.png",
    "apple-touch-icon.png",
    "android-chrome-192x192.png",
    "android-chrome-512x512.png",
    "mstile-150x150.png",
    "safari-pinned-tab.svg",
    "site.webmanifest",
    "browserconfig.xml",
    "if_convert.html",
    "ut_convert.html",
    "twitter.html",
]
_TOOLS_EXCLUDES = {".DS_Store", "_config.yml", "AGENTS.md", "DESIGN.md", "scripts"}


@dataclass
class Post:
    title: str
    slug: str
    date: datetime
    categories: list[str]
    tags: list[str]
    url_path: str
    post_id: str
    html_content: str
    headings: list[tuple[int, str, str]]
    plain_text: str
    word_count: int
    read_time_label: str
    excerpt: str
    toc: bool = True
    toc_sticky: bool = True
    comments: bool = True
    share: bool = True
    related: bool = True
    author_profile: bool = True
    teaser: str | None = None
    last_modified_at: datetime | None = None


@dataclass
class Page:
    title: str
    permalink: str
    layout: str
    html_content: str
    headings: list[tuple[int, str, str]]
    author_profile: bool = True
    toc: bool = False
    toc_sticky: bool = False
    comments: bool = False
    share: bool = True
    read_time: bool = False


def normalize_baseurl(raw_baseurl: str) -> str:
    cleaned = (raw_baseurl or "").strip()
    if not cleaned or cleaned == "/":
        return ""
    if not cleaned.startswith("/"):
        cleaned = "/" + cleaned
    return cleaned.rstrip("/")


def make_rel_url(path: str, baseurl: str) -> str:
    if path.startswith(("http://", "https://", "//", "mailto:", "#")):
        return path
    normalized = path if path.startswith("/") else "/" + path
    return f"{baseurl}{normalized}"


def make_abs_url(path: str, site_url: str, baseurl: str) -> str:
    if path.startswith(("http://", "https://")):
        return path
    return site_url.rstrip("/") + make_rel_url(path, baseurl)


def _parse_tz_offset(tz_str: str) -> timezone:
    m = re.match(r"^([+-])(\d{2}):?(\d{2})$", tz_str.strip())
    if not m:
        return timezone(timedelta(hours=9))
    sign = 1 if m.group(1) == "+" else -1
    hours = int(m.group(2))
    minutes = int(m.group(3))
    return timezone(sign * timedelta(hours=hours, minutes=minutes))


def parse_post_date(raw_date: Any, fallback_ymd: str, default_tz_str: str) -> datetime:
    default_tz = _parse_tz_offset(default_tz_str)
    if isinstance(raw_date, datetime):
        return raw_date if raw_date.tzinfo else raw_date.replace(tzinfo=default_tz)

    text = str(raw_date or fallback_ymd).strip()
    # Normalize "YYYY-MM-DD HH:MM:SS +0900" or "+0900" to ISO-8601
    iso_candidate = re.sub(r"\s+([+-]\d{2}:?\d{2})$", r"\1", text)
    iso_candidate = re.sub(r"([+-]\d{2})(\d{2})$", r"\1:\2", iso_candidate)
    iso_candidate = iso_candidate.replace(" ", "T", 1)

    try:
        dt = datetime.fromisoformat(iso_candidate)
        return dt if dt.tzinfo else dt.replace(tzinfo=default_tz)
    except ValueError:
        pass

    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            dt = datetime.strptime(text, fmt)
            return dt.replace(tzinfo=default_tz)
        except ValueError:
            continue

    dt = datetime.strptime(fallback_ymd, "%Y-%m-%d")
    return dt.replace(tzinfo=default_tz)


def _as_str_list(val: Any) -> list[str]:
    if isinstance(val, list):
        return [str(item).strip() for item in val if str(item).strip()]
    if isinstance(val, str) and val.strip():
        return [val.strip()]
    return []


def _format_read_time(word_count: int, wpm: int) -> str:
    if word_count < wpm:
        return "최대 1 분 소요"
    if word_count == wpm:
        return "1 분 소요"
    return f"{word_count // wpm} 분 소요"


def _format_long_date(dt: datetime) -> str:
    return f"{dt.strftime('%B')} {dt.day}, {dt.year}"


def _format_short_date(dt: datetime) -> str:
    return dt.strftime("%Y/%m/%d")


def _slugify_taxonomy(name: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", name.lower().strip(), flags=re.UNICODE)
    return re.sub(r"\s+", "-", cleaned) or "item"


def load_posts(root: Path, config: dict[str, Any], include_drafts: bool) -> list[Post]:
    dirs = [root / "_posts"]
    if include_drafts and (root / "_drafts").is_dir():
        dirs.append(root / "_drafts")

    wpm = int(config.get("words_per_minute", 150))
    tz_str = str(config.get("timezone", "+09:00"))
    posts: list[Post] = []

    for post_dir in dirs:
        if not post_dir.is_dir():
            continue
        for md_path in sorted(post_dir.glob("*.md")):
            m = _POST_FILENAME_RE.match(md_path.name)
            if m:
                fallback_ymd, slug = m.group(1), m.group(2)
            else:
                fallback_ymd = datetime.now().strftime("%Y-%m-%d")
                slug = md_path.stem

            raw_text = md_path.read_text(encoding="utf-8")
            fm, body = parse_frontmatter(raw_text)
            title = str(fm.get("title", slug)).strip()
            dt = parse_post_date(fm.get("date"), fallback_ymd, tz_str)
            categories = _as_str_list(fm.get("categories") or fm.get("category"))
            tags = _as_str_list(fm.get("tags") or fm.get("tag"))

            if fm.get("permalink"):
                url_path = str(fm["permalink"]).strip()
                if not url_path.startswith("/"):
                    url_path = "/" + url_path
                if not url_path.endswith("/") and not url_path.endswith(".html"):
                    url_path += "/"
            elif categories:
                cat_path = "/".join(_slugify_taxonomy(c) for c in categories)
                url_path = f"/{cat_path}/{slug}/"
            else:
                url_path = f"/{slug}/"

            post_id = url_path.rstrip("/") or "/"
            html_content, headings = render_markdown(body)
            plain_text = strip_html(html_content)
            word_count = len(plain_text.split())
            read_time_label = _format_read_time(word_count, wpm)

            raw_excerpt = fm.get("excerpt")
            if raw_excerpt:
                excerpt = strip_html(str(raw_excerpt))
            else:
                first_p = re.search(r"<p>(.*?)</p>", html_content, re.DOTALL)
                excerpt = strip_html(first_p.group(1)) if first_p else plain_text[:160]

            last_mod = None
            if fm.get("last_modified_at"):
                last_mod = parse_post_date(fm["last_modified_at"], fallback_ymd, tz_str)

            posts.append(
                Post(
                    title=title,
                    slug=slug,
                    date=dt,
                    categories=categories,
                    tags=tags,
                    url_path=url_path,
                    post_id=post_id,
                    html_content=html_content,
                    headings=headings,
                    plain_text=plain_text,
                    word_count=word_count,
                    read_time_label=read_time_label,
                    excerpt=excerpt,
                    toc=bool(fm.get("toc", True)),
                    toc_sticky=bool(fm.get("toc_sticky", True)),
                    comments=bool(fm.get("comments", True)),
                    share=bool(fm.get("share", True)),
                    related=bool(fm.get("related", True)),
                    author_profile=bool(fm.get("author_profile", True)),
                    teaser=str(fm["teaser"]) if fm.get("teaser") else None,
                    last_modified_at=last_mod,
                )
            )

    posts.sort(key=lambda p: (p.date, p.slug), reverse=True)
    return posts


def load_pages(root: Path) -> list[Page]:
    pages_dir = root / "_pages"
    if not pages_dir.is_dir():
        return []

    pages: list[Page] = []
    for md_path in sorted(pages_dir.glob("*.md")):
        raw_text = md_path.read_text(encoding="utf-8")
        fm, body = parse_frontmatter(raw_text)
        title = str(fm.get("title", md_path.stem)).strip()
        permalink = str(fm.get("permalink", f"/{md_path.stem}/")).strip()
        if not permalink.startswith("/"):
            permalink = "/" + permalink
        if not permalink.endswith("/") and not permalink.endswith(".html"):
            permalink += "/"

        html_content, headings = render_markdown(body)
        pages.append(
            Page(
                title=title,
                permalink=permalink,
                layout=str(fm.get("layout", "single")).strip(),
                html_content=html_content,
                headings=headings,
                author_profile=bool(fm.get("author_profile", True)),
                toc=bool(fm.get("toc", False)),
                toc_sticky=bool(fm.get("toc_sticky", False)),
                comments=bool(fm.get("comments", False)),
                share=bool(fm.get("share", True)),
                read_time=bool(fm.get("read_time", False)),
            )
        )
    return pages


def _render_sidebar(config: dict[str, Any], baseurl: str) -> str:
    author = config["author"]
    avatar = html.escape(make_rel_url(author["avatar"], baseurl), quote=True)
    name = html.escape(author["name"], quote=False)
    bio = html.escape(author["bio"], quote=False)
    location = html.escape(author.get("location", ""), quote=False)

    link_items: list[str] = []
    if location:
        link_items.append(
            f'      <li itemprop="homeLocation" itemscope itemtype="https://schema.org/Place">'
            f'<i class="fas fa-fw fa-map-marker-alt" aria-hidden="true"></i> '
            f'<span itemprop="name">{location}</span></li>'
        )
    for item in author.get("links", []):
        href = html.escape(item["url"], quote=True)
        icon = html.escape(item["icon"], quote=True)
        label = html.escape(item["label"], quote=False)
        link_items.append(
            f'      <li><a href="{href}" rel="nofollow noopener noreferrer">'
            f'<i class="{icon}" aria-hidden="true"></i><span class="label">{label}</span></a></li>'
        )
    hits_url = config.get("hits_badge_url")
    if hits_url:
        link_items.append(
            '      <li><a href="https://hits.seeyoufarm.com">'
            f'<img src="{html.escape(hits_url, quote=True)}" '
            'style="width:100px;height:20px;" alt="hits" /></a></li>'
        )

    return (
        '<div class="sidebar sticky">\n'
        '  <div itemscope itemtype="https://schema.org/Person">\n'
        '    <div class="author__avatar">\n'
        f'      <img src="{avatar}" alt="{name}" itemprop="image">\n'
        '    </div>\n'
        '    <div class="author__content">\n'
        f'      <h3 class="author__name" itemprop="name">{name}</h3>\n'
        f'      <div class="author__bio" itemprop="description"><p>{bio}</p></div>\n'
        '    </div>\n'
        '    <div class="author__urls-wrapper">\n'
        '      <button class="btn btn--inverse">팔로우</button>\n'
        '      <ul class="author__urls social-icons">\n'
        + "\n".join(link_items)
        + "\n      </ul>\n"
        "    </div>\n"
        "  </div>\n"
        "</div>"
    )


def _render_entry_card(post: Post, baseurl: str, card_type: str = "list") -> str:
    url = html.escape(make_rel_url(post.url_path, baseurl), quote=True)
    title = html.escape(post.title, quote=False)
    excerpt = post.excerpt[:157] + "..." if len(post.excerpt) > 160 else post.excerpt
    excerpt_html = f'<p class="archive__item-excerpt" itemprop="description">{html.escape(excerpt, quote=False)}</p>' if excerpt else ""
    teaser_html = ""
    if card_type == "grid" and post.teaser:
        teaser_src = html.escape(make_rel_url(post.teaser, baseurl), quote=True)
        teaser_html = f'<div class="archive__item-teaser"><img src="{teaser_src}" alt=""></div>'

    return (
        f'<div class="{card_type}__item">\n'
        '  <article class="archive__item" itemscope itemtype="https://schema.org/CreativeWork">\n'
        f'    {teaser_html}'
        '    <h2 class="archive__item-title no_toc" itemprop="headline">\n'
        f'      <a href="{url}" rel="permalink">{title}</a>\n'
        '    </h2>\n'
        '    <p class="page__meta">\n'
        '      <span class="page__meta-readtime">\n'
        '        <i class="far fa-clock" aria-hidden="true"></i>\n'
        f'        {html.escape(post.read_time_label, quote=False)}\n'
        '      </span>\n'
        '    </p>\n'
        f'    <p class="page__meta"><i class="far fa-fw fa-calendar-alt" aria-hidden="true"></i> {_format_short_date(post.date)}</p>\n'
        f'    {excerpt_html}\n'
        '  </article>\n'
        '</div>'
    )


def _render_share_section(title: str, canonical_url: str, buymeacoffee_url: str) -> str:
    encoded_url = quote_plus(canonical_url)
    encoded_text = quote_plus(title)
    bmc_html = ""
    if buymeacoffee_url:
        bmc_html = (
            f'\n  <a href="{html.escape(buymeacoffee_url, quote=True)}" target="_blank" rel="noopener noreferrer">'
            '<img src="https://cdn.buymeacoffee.com/buttons/default-yellow.png" alt="Buy Me A Coffee" height="35" width="150"></a>'
        )
    return (
        '<section class="page__share">\n'
        '  <h4 class="page__share-title">공유하기</h4>\n'
        f'  <a href="https://twitter.com/intent/tweet?text={encoded_text}%20{encoded_url}" class="btn btn--twitter" '
        'onclick="window.open(this.href, \'window\', \'left=20,top=20,width=500,height=500,toolbar=1,resizable=0\'); return false;" '
        'title="공유하기 Twitter"><i class="fab fa-fw fa-twitter" aria-hidden="true"></i><span> Twitter</span></a>\n'
        f'  <a href="https://www.facebook.com/sharer/sharer.php?u={encoded_url}" class="btn btn--facebook" '
        'onclick="window.open(this.href, \'window\', \'left=20,top=20,width=500,height=500,toolbar=1,resizable=0\'); return false;" '
        'title="공유하기 Facebook"><i class="fab fa-fw fa-facebook" aria-hidden="true"></i><span> Facebook</span></a>\n'
        f'  <a href="https://www.linkedin.com/shareArticle?mini=true&amp;url={encoded_url}" class="btn btn--linkedin" '
        'onclick="window.open(this.href, \'window\', \'left=20,top=20,width=500,height=500,toolbar=1,resizable=0\'); return false;" '
        'title="공유하기 LinkedIn"><i class="fab fa-fw fa-linkedin" aria-hidden="true"></i><span> LinkedIn</span></a>'
        f"{bmc_html}\n"
        "</section>"
    )


def _render_shell(
    *,
    config: dict[str, Any],
    baseurl: str,
    page_title: str,
    seo_title: str,
    og_title: str,
    description: str,
    url_path: str,
    og_type: str,
    layout_class: str,
    main_html: str,
    published_iso: str | None = None,
    prev_url_path: str | None = None,
    next_url_path: str | None = None,
    disqus_config: tuple[str, str] | None = None,
) -> str:
    site_url = config["url"]
    site_title = config["title"]
    gtm_id = config["gtm_id"]
    canonical = make_abs_url(url_path, site_url, baseurl)
    og_image = make_abs_url(config["og_image"], site_url, baseurl)
    current_year = datetime.now(_parse_tz_offset(config.get("timezone", "+09:00"))).year

    prev_link = f'\n  <link rel="prev" href="{html.escape(make_abs_url(prev_url_path, site_url, baseurl), quote=True)}">' if prev_url_path else ""
    next_link = f'\n  <link rel="next" href="{html.escape(make_abs_url(next_url_path, site_url, baseurl), quote=True)}">' if next_url_path else ""
    published_meta = f'\n  <meta property="article:published_time" content="{html.escape(published_iso, quote=True)}">' if published_iso else ""

    nav_links_html = "".join(
        f'<li class="masthead__menu-item"><a href="{html.escape(make_rel_url(item["url"], baseurl), quote=True)}">{html.escape(item["title"], quote=False)}</a></li>'
        for item in config["navigation"]
    )
    footer_links_html = "\n".join(
        f'          <li><a href="{html.escape(item["url"], quote=True)}" rel="nofollow noopener noreferrer">'
        f'<i class="{html.escape(item["icon"], quote=True)}" aria-hidden="true"></i> {html.escape(item["label"], quote=False)}</a></li>'
        for item in config["footer_links"]
    )

    ld_json = json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": config["name"],
            "url": make_abs_url("/", site_url, baseurl),
        },
        ensure_ascii=False,
    )

    disqus_script = ""
    if disqus_config and config.get("disqus_shortname"):
        d_url, d_id = disqus_config
        shortname = config["disqus_shortname"]
        disqus_script = (
            "\n  <script>\n"
            "    var disqus_config = function () {\n"
            f'      this.page.url = {json.dumps(d_url)};\n'
            f'      this.page.identifier = {json.dumps(d_id)};\n'
            "    };\n"
            "    (function() {\n"
            "      var d = document, s = d.createElement('script');\n"
            f"      s.src = 'https://{shortname}.disqus.com/embed.js';\n"
            "      s.setAttribute('data-timestamp', +new Date());\n"
            "      (d.head || d.body).appendChild(s);\n"
            "    })();\n"
            "  </script>\n"
            '  <noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>'
        )

    rel = partial(make_rel_url, baseurl=baseurl)

    return f"""<!doctype html>
<html lang="{html.escape(config.get("lang", "ko"), quote=True)}" class="no-js">
  <head>
    <meta charset="utf-8">

<!-- begin seo -->
<title>{html.escape(seo_title, quote=False)}</title>
<meta name="description" content="{html.escape(description, quote=True)}">
<meta name="author" content="{html.escape(config["name"], quote=True)}">
<meta property="og:type" content="{html.escape(og_type, quote=True)}">
<meta property="og:locale" content="{html.escape(config.get("locale", "ko-KR").replace("-", "_"), quote=True)}">
<meta property="og:site_name" content="{html.escape(site_title, quote=True)}">
<meta property="og:title" content="{html.escape(og_title, quote=True)}">
<meta property="og:url" content="{html.escape(canonical, quote=True)}">
<meta property="og:description" content="{html.escape(description, quote=True)}">
<meta property="og:image" content="{html.escape(og_image, quote=True)}">{published_meta}
<link rel="canonical" href="{html.escape(canonical, quote=True)}">{prev_link}{next_link}
<script type="application/ld+json">{ld_json}</script>
<!-- end seo -->

<link href="{html.escape(rel("/feed.xml"), quote=True)}" type="application/atom+xml" rel="alternate" title="{html.escape(site_title, quote=True)} Feed">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script>
  document.documentElement.className = document.documentElement.className.replace(/\\bno-js\\b/g, '') + ' js ';
</script>

<link rel="stylesheet" href="{html.escape(rel("/assets/css/main.css"), quote=True)}">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5/css/all.min.css">

<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){{w[l]=w[l]||[];w[l].push({{'gtm.start':
new Date().getTime(),event:'gtm.js'}});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
}})(window,document,'script','dataLayer','{html.escape(gtm_id, quote=True)}');</script>
<!-- End Google Tag Manager -->

<link rel="apple-touch-icon" sizes="180x180" href="{html.escape(rel("/apple-touch-icon.png"), quote=True)}">
<link rel="icon" type="image/png" sizes="32x32" href="{html.escape(rel("/favicon-32x32.png"), quote=True)}">
<link rel="icon" type="image/png" sizes="16x16" href="{html.escape(rel("/favicon-16x16.png"), quote=True)}">
<link rel="manifest" href="{html.escape(rel("/site.webmanifest"), quote=True)}">
<link rel="mask-icon" href="{html.escape(rel("/safari-pinned-tab.svg"), quote=True)}" color="#5bbad5">
<meta name="msapplication-TileColor" content="#da532c">
<meta name="theme-color" content="#ffffff">
  </head>

  <body class="layout--{html.escape(layout_class, quote=True)}">
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id={html.escape(gtm_id, quote=True)}"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->

    <nav class="skip-links">
      <h2 class="screen-reader-text">Skip links</h2>
      <ul>
        <li><a href="#site-nav" class="screen-reader-shortcut">Skip to primary navigation</a></li>
        <li><a href="#main" class="screen-reader-shortcut">Skip to content</a></li>
        <li><a href="#footer" class="screen-reader-shortcut">Skip to footer</a></li>
      </ul>
    </nav>

    <div class="masthead">
      <div class="masthead__inner-wrap">
        <div class="masthead__menu">
          <nav id="site-nav" class="greedy-nav">
            <a class="site-title" href="{html.escape(rel("/"), quote=True)}">{html.escape(site_title, quote=False)}</a>
            <ul class="visible-links">{nav_links_html}</ul>
            <button class="search__toggle" type="button">
              <span class="visually-hidden">Toggle search</span>
              <svg class="icon" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.99 16">
                <path d="M15.5,13.12L13.19,10.8a1.69,1.69,0,0,0-1.28-.55l-0.06-.06A6.5,6.5,0,0,0,5.77,0,6.5,6.5,0,0,0,2.46,11.59a6.47,6.47,0,0,0,7.74.26l0.05,0.05a1.65,1.65,0,0,0,.5,1.24l2.38,2.38A1.68,1.68,0,0,0,15.5,13.12ZM6.4,2A4.41,4.41,0,1,1,2,6.4,4.43,4.43,0,0,1,6.4,2Z" transform="translate(-.01)"></path>
              </svg>
            </button>
            <button class="greedy-nav__toggle hidden" type="button">
              <span class="visually-hidden">토글 메뉴</span>
              <div class="navicon"></div>
            </button>
            <ul class="hidden-links hidden"></ul>
          </nav>
        </div>
      </div>
    </div>

    <div class="initial-content">
      {main_html}
    </div>

    <div class="search-content">
      <div class="search-content__inner-wrap">
        <form class="search-content__form" onkeydown="return event.key != 'Enter';">
          <label class="sr-only" for="search">Enter your search term...</label>
          <input type="search" id="search" class="search-input" tabindex="-1" placeholder="검색어를 입력하세요..." />
        </form>
        <div id="results" class="results"></div>
      </div>
    </div>

    <div id="footer" class="page__footer">
      <footer>
        <div class="page__footer-follow">
          <ul class="social-icons">
            <li><strong>팔로우:</strong></li>
{footer_links_html}
            <li><a href="{html.escape(rel("/feed.xml"), quote=True)}"><i class="fas fa-fw fa-rss-square" aria-hidden="true"></i> 피드</a></li>
          </ul>
        </div>
        <div class="page__footer-copyright">&copy; {current_year} {html.escape(config["name"], quote=False)}. Favicon icon made by <a href="https://www.flaticon.com/authors/dinosoftlabs" title="DinosoftLabs">DinosoftLabs</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
      </footer>
    </div>

    <script src="{html.escape(rel("/assets/js/search-data.js"), quote=True)}"></script>
    <script src="{html.escape(rel("/assets/js/site.js"), quote=True)}"></script>{disqus_script}
  </body>
</html>
"""


def _render_home_pagination(page_num: int, total_pages: int, baseurl: str) -> str:
    if total_pages <= 1:
        return ""

    def _page_url(n: int) -> str:
        return make_rel_url("/" if n == 1 else f"/page{n}/", baseurl)

    items: list[str] = []
    if page_num > 1:
        items.append(f'<li><a href="{html.escape(_page_url(page_num - 1), quote=True)}">이전</a></li>')
    else:
        items.append('<li><a href="#" class="disabled"><span aria-hidden="true">이전</span></a></li>')

    for n in range(1, total_pages + 1):
        if n == page_num:
            items.append(f'<li><a href="#" class="disabled current">{n}</a></li>')
        else:
            items.append(f'<li><a href="{html.escape(_page_url(n), quote=True)}">{n}</a></li>')

    if page_num < total_pages:
        items.append(f'<li><a href="{html.escape(_page_url(page_num + 1), quote=True)}">다음</a></li>')
    else:
        items.append('<li><a href="#" class="disabled"><span aria-hidden="true">다음</span></a></li>')

    return '<nav class="pagination">\n  <ul>\n    ' + "\n    ".join(items) + "\n  </ul>\n</nav>"


def render_home_pages(posts: list[Post], config: dict[str, Any], baseurl: str) -> dict[str, str]:
    per_page = int(config.get("paginate", 5))
    total_pages = max(1, (len(posts) + per_page - 1) // per_page)
    sidebar_html = _render_sidebar(config, baseurl)
    site_title = config["title"]
    sep = config.get("title_separator", "-")
    outputs: dict[str, str] = {}

    for page_num in range(1, total_pages + 1):
        chunk = posts[(page_num - 1) * per_page : page_num * per_page]
        entries_html = "\n".join(_render_entry_card(p, baseurl, "list") for p in chunk)
        pagination_html = _render_home_pagination(page_num, total_pages, baseurl)

        main_html = (
            '<div id="main" role="main">\n'
            f"  {sidebar_html}\n"
            '  <div class="archive">\n'
            '    <h1 id="page-title" class="page__title"></h1>\n'
            '    <h3 class="archive__subtitle">최근 포스트</h3>\n'
            f'    <div class="entries-list">\n{entries_html}\n    </div>\n'
            f"    {pagination_html}\n"
            "  </div>\n"
            "</div>"
        )

        url_path = "/" if page_num == 1 else f"/page{page_num}/"
        seo_title = site_title if page_num == 1 else f"{site_title} {sep} 페이지 {page_num}"
        prev_path = None if page_num == 1 else ("/" if page_num == 2 else f"/page{page_num - 1}/")
        next_path = f"/page{page_num + 1}/" if page_num < total_pages else None
        out_rel = "index.html" if page_num == 1 else f"page{page_num}/index.html"

        outputs[out_rel] = _render_shell(
            config=config,
            baseurl=baseurl,
            page_title=site_title,
            seo_title=seo_title,
            og_title=site_title,
            description=config["description"],
            url_path=url_path,
            og_type="website",
            layout_class="home",
            main_html=main_html,
            prev_url_path=prev_path,
            next_url_path=next_path,
        )

    return outputs


def render_single_post(
    post: Post,
    older_post: Post | None,
    newer_post: Post | None,
    recent_posts: list[Post],
    config: dict[str, Any],
    baseurl: str,
) -> str:
    sidebar_html = _render_sidebar(config, baseurl)
    toc_html = ""
    if post.toc and post.headings:
        toc_menu = build_toc_html(post.headings)
        if toc_menu:
            sticky_cls = " sticky" if post.toc_sticky else ""
            toc_html = (
                f'<aside class="sidebar__right{sticky_cls}">\n'
                '  <nav class="toc">\n'
                '    <header><h4 class="nav__title"><i class="fas fa-file-alt"></i> On This Page</h4></header>\n'
                f"    {toc_menu}\n"
                "  </nav>\n"
                "</aside>\n"
            )

    tags_html = ""
    if post.tags:
        tag_links = '<span class="sep">, </span>'.join(
            f'<a href="{html.escape(make_rel_url("/tags/#" + _slugify_taxonomy(t), baseurl), quote=True)}" '
            f'class="page__taxonomy-item" rel="tag">{html.escape(t, quote=False)}</a>'
            for t in post.tags
        )
        tags_html = (
            '<p class="page__taxonomy">\n'
            '  <strong><i class="fas fa-fw fa-tags" aria-hidden="true"></i> 태그: </strong>\n'
            f'  <span itemprop="keywords">{tag_links}</span>\n'
            "</p>"
        )

    cats_html = ""
    if post.categories:
        cat_links = '<span class="sep">, </span>'.join(
            f'<a href="{html.escape(make_rel_url("/categories/#" + _slugify_taxonomy(c), baseurl), quote=True)}" '
            f'class="page__taxonomy-item" rel="tag">{html.escape(c, quote=False)}</a>'
            for c in post.categories
        )
        cats_html = (
            '<p class="page__taxonomy">\n'
            '  <strong><i class="fas fa-fw fa-folder-open" aria-hidden="true"></i> 카테고리: </strong>\n'
            f'  <span itemprop="keywords">{cat_links}</span>\n'
            "</p>"
        )

    canonical_url = make_abs_url(post.url_path, config["url"], baseurl)
    share_html = _render_share_section(post.title, canonical_url, config.get("buymeacoffee_url", "")) if post.share else ""

    pager_html = ""
    if older_post or newer_post:
        prev_btn = (
            f'<a href="{html.escape(make_rel_url(older_post.url_path, baseurl), quote=True)}" '
            f'class="pagination--pager" title="{html.escape(older_post.title, quote=True)}">이전</a>'
            if older_post
            else '<a href="#" class="pagination--pager disabled">이전</a>'
        )
        next_btn = (
            f'<a href="{html.escape(make_rel_url(newer_post.url_path, baseurl), quote=True)}" '
            f'class="pagination--pager" title="{html.escape(newer_post.title, quote=True)}">다음</a>'
            if newer_post
            else '<a href="#" class="pagination--pager disabled">다음</a>'
        )
        pager_html = f'<nav class="pagination">\n  {prev_btn}\n  {next_btn}\n</nav>'

    comments_html = ""
    disqus_cfg = None
    if post.comments and config.get("disqus_shortname"):
        comments_html = (
            '<div class="page__comments">\n'
            '  <h4 class="page__comments-title">댓글남기기</h4>\n'
            '  <section id="disqus_thread"></section>\n'
            "</div>"
        )
        disqus_cfg = (canonical_url, post.post_id)

    related_html = ""
    if post.related:
        other_posts = [p for p in recent_posts if p.post_id != post.post_id][:4]
        if other_posts:
            grid_cards = "\n".join(_render_entry_card(p, baseurl, "grid") for p in other_posts)
            related_html = (
                '<div class="page__related">\n'
                '  <h4 class="page__related-title">참고</h4>\n'
                f'  <div class="grid__wrapper">\n{grid_cards}\n  </div>\n'
                "</div>"
            )

    display_date = post.last_modified_at or post.date
    main_html = (
        '<div id="main" role="main">\n'
        f"  {sidebar_html}\n"
        '  <article class="page" itemscope itemtype="https://schema.org/CreativeWork">\n'
        f'    <meta itemprop="headline" content="{html.escape(post.title, quote=True)}">\n'
        f'    <meta itemprop="description" content="{html.escape(post.excerpt, quote=True)}">\n'
        f'    <meta itemprop="datePublished" content="{html.escape(post.date.isoformat(), quote=True)}">\n'
        '    <div class="page__inner-wrap">\n'
        '      <header>\n'
        f'        <h1 id="page-title" class="page__title" itemprop="headline">{html.escape(post.title, quote=False)}</h1>\n'
        '        <p class="page__meta">\n'
        '          <span class="page__meta-readtime">\n'
        '            <i class="far fa-clock" aria-hidden="true"></i>\n'
        f'            {html.escape(post.read_time_label, quote=False)}\n'
        '          </span>\n'
        '        </p>\n'
        f'        <p class="page__meta"><i class="far fa-fw fa-calendar-alt" aria-hidden="true"></i> {_format_short_date(post.date)}</p>\n'
        '      </header>\n'
        '      <section class="page__content" itemprop="text">\n'
        f"        {toc_html}{post.html_content}\n"
        '      </section>\n'
        '      <footer class="page__meta">\n'
        f"        {tags_html}\n"
        f"        {cats_html}\n"
        f'        <p class="page__date"><strong><i class="fas fa-fw fa-calendar-alt" aria-hidden="true"></i> 업데이트:</strong> '
        f'<time datetime="{html.escape(display_date.isoformat(), quote=True)}">{_format_long_date(display_date)}</time></p>\n'
        '      </footer>\n'
        f"      {share_html}\n"
        f"      {pager_html}\n"
        "    </div>\n"
        f"    {comments_html}\n"
        "  </article>\n"
        f"  {related_html}\n"
        "</div>"
    )

    sep = config.get("title_separator", "-")
    seo_title = f"{post.title} {sep} {config['title']}"
    return _render_shell(
        config=config,
        baseurl=baseurl,
        page_title=post.title,
        seo_title=seo_title,
        og_title=post.title,
        description=post.excerpt or config["description"],
        url_path=post.url_path,
        og_type="article",
        layout_class="single",
        main_html=main_html,
        published_iso=post.date.isoformat(),
        disqus_config=disqus_cfg,
    )


def _render_taxonomy_archive(
    page: Page,
    groups: list[tuple[str, str, list[Post]]],
    config: dict[str, Any],
    baseurl: str,
) -> str:
    sidebar_html = _render_sidebar(config, baseurl) if page.author_profile else ""
    index_links = "\n".join(
        f'  <li><a href="#{html.escape(gid, quote=True)}"><strong>{html.escape(label, quote=False)}</strong> '
        f'<span class="taxonomy__count">{len(items)}</span></a></li>'
        for gid, label, items in groups
    )
    sections = []
    for gid, label, items in groups:
        cards = "\n".join(_render_entry_card(p, baseurl, "list") for p in items)
        sections.append(
            f'<section id="{html.escape(gid, quote=True)}" class="taxonomy__section">\n'
            f'  <h2 class="archive__subtitle">{html.escape(label, quote=False)}</h2>\n'
            f'  <div class="entries-list">\n{cards}\n  </div>\n'
            '  <a href="#page-title" class="back-to-top">맨 위로 이동 &uarr;</a>\n'
            "</section>"
        )

    main_html = (
        '<div id="main" role="main">\n'
        f"  {sidebar_html}\n"
        '  <div class="archive">\n'
        f'    <h1 id="page-title" class="page__title">{html.escape(page.title, quote=False)}</h1>\n'
        f"    {page.html_content}\n"
        f'    <ul class="taxonomy__index">\n{index_links}\n    </ul>\n'
        + "\n".join(sections)
        + "\n  </div>\n</div>"
    )

    sep = config.get("title_separator", "-")
    return _render_shell(
        config=config,
        baseurl=baseurl,
        page_title=page.title,
        seo_title=f"{page.title} {sep} {config['title']}",
        og_title=page.title,
        description=config["description"],
        url_path=page.permalink,
        og_type="website",
        layout_class=page.layout,
        main_html=main_html,
    )


def render_page(page: Page, posts: list[Post], config: dict[str, Any], baseurl: str) -> str:
    if page.layout == "categories":
        cat_map: dict[str, list[Post]] = defaultdict(list)
        for p in posts:
            for c in p.categories:
                cat_map[c].append(p)
        sorted_cats = sorted(cat_map.items(), key=lambda kv: (-len(kv[1]), kv[0].lower()))
        groups = [(_slugify_taxonomy(k), k, v) for k, v in sorted_cats]
        return _render_taxonomy_archive(page, groups, config, baseurl)

    if page.layout == "tags":
        tag_map: dict[str, list[Post]] = defaultdict(list)
        for p in posts:
            for t in p.tags:
                tag_map[t].append(p)
        sorted_tags = sorted(tag_map.items(), key=lambda kv: (-len(kv[1]), kv[0].lower()))
        groups = [(_slugify_taxonomy(k), k, v) for k, v in sorted_tags]
        return _render_taxonomy_archive(page, groups, config, baseurl)

    if page.layout == "posts":
        year_map: dict[str, list[Post]] = defaultdict(list)
        for p in posts:
            year_map[str(p.date.year)].append(p)
        sorted_years = sorted(year_map.items(), key=lambda kv: kv[0], reverse=True)
        groups = [(y, y, v) for y, v in sorted_years]
        return _render_taxonomy_archive(page, groups, config, baseurl)

    sidebar_html = _render_sidebar(config, baseurl) if page.author_profile else ""
    canonical_url = make_abs_url(page.permalink, config["url"], baseurl)
    share_html = _render_share_section(page.title, canonical_url, config.get("buymeacoffee_url", "")) if page.share else ""
    toc_html = ""
    if page.toc and page.headings:
        toc_menu = build_toc_html(page.headings)
        if toc_menu:
            sticky_cls = " sticky" if page.toc_sticky else ""
            toc_html = (
                f'<aside class="sidebar__right{sticky_cls}">\n'
                '  <nav class="toc">\n'
                '    <header><h4 class="nav__title"><i class="fas fa-file-alt"></i> On This Page</h4></header>\n'
                f"    {toc_menu}\n"
                "  </nav>\n"
                "</aside>\n"
            )

    main_html = (
        '<div id="main" role="main">\n'
        f"  {sidebar_html}\n"
        '  <article class="page" itemscope itemtype="https://schema.org/CreativeWork">\n'
        f'    <meta itemprop="headline" content="{html.escape(page.title, quote=True)}">\n'
        '    <div class="page__inner-wrap">\n'
        '      <header>\n'
        f'        <h1 id="page-title" class="page__title" itemprop="headline">{html.escape(page.title, quote=False)}</h1>\n'
        '      </header>\n'
        '      <section class="page__content" itemprop="text">\n'
        f"        {toc_html}{page.html_content}\n"
        '      </section>\n'
        '      <footer class="page__meta"></footer>\n'
        f"      {share_html}\n"
        "    </div>\n"
        "  </article>\n"
        "</div>"
    )
    sep = config.get("title_separator", "-")
    return _render_shell(
        config=config,
        baseurl=baseurl,
        page_title=page.title,
        seo_title=f"{page.title} {sep} {config['title']}",
        og_title=page.title,
        description=config["description"],
        url_path=page.permalink,
        og_type="website",
        layout_class=page.layout,
        main_html=main_html,
    )


def build_atom_feed(posts: list[Post], config: dict[str, Any], baseurl: str) -> str:
    site_url = config["url"]
    feed_url = make_abs_url("/feed.xml", site_url, baseurl)
    home_url = make_abs_url("/", site_url, baseurl)
    updated_iso = posts[0].date.isoformat() if posts else datetime.now(_parse_tz_offset(config.get("timezone", "+09:00"))).isoformat()

    entries: list[str] = []
    for p in posts:
        post_abs_url = make_abs_url(p.url_path, site_url, baseurl)
        post_abs_id = make_abs_url(p.post_id, site_url, baseurl)
        terms = list(dict.fromkeys(p.categories + p.tags))
        cat_tags = "".join(f'<category term="{html.escape(term, quote=True)}" />' for term in terms)
        entries.append(
            "<entry>"
            f'<title type="html">{html.escape(p.title, quote=False)}</title>'
            f'<link href="{html.escape(post_abs_url, quote=True)}" rel="alternate" type="text/html" title="{html.escape(p.title, quote=True)}" />'
            f"<published>{html.escape(p.date.isoformat(), quote=False)}</published>"
            f"<updated>{html.escape((p.last_modified_at or p.date).isoformat(), quote=False)}</updated>"
            f"<id>{html.escape(post_abs_id, quote=False)}</id>"
            f'<content type="html" xml:base="{html.escape(post_abs_url, quote=True)}">{html.escape(p.html_content, quote=False)}</content>'
            f"<author><name>{html.escape(config['name'], quote=False)}</name></author>"
            f"{cat_tags}"
            f'<summary type="html">{html.escape(p.excerpt, quote=False)}</summary>'
            "</entry>"
        )

    return (
        '<?xml version="1.0" encoding="utf-8"?>'
        '<feed xmlns="http://www.w3.org/2005/Atom">'
        '<generator uri="https://www.python.org/">Python Static Site Generator</generator>'
        f'<link href="{html.escape(feed_url, quote=True)}" rel="self" type="application/atom+xml" />'
        f'<link href="{html.escape(home_url, quote=True)}" rel="alternate" type="text/html" />'
        f"<updated>{html.escape(updated_iso, quote=False)}</updated>"
        f"<id>{html.escape(feed_url, quote=False)}</id>"
        f'<title type="html">{html.escape(config["title"], quote=False)}</title>'
        f"<subtitle>{html.escape(config['description'], quote=False)}</subtitle>"
        f"<author><name>{html.escape(config['name'], quote=False)}</name></author>"
        + "".join(entries)
        + "</feed>\n"
    )


def build_sitemap(
    posts: list[Post],
    pages: list[Page],
    home_paths: list[str],
    output_dir: Path,
    config: dict[str, Any],
    baseurl: str,
) -> str:
    site_url = config["url"]
    tz = _parse_tz_offset(config.get("timezone", "+09:00"))
    url_entries: list[tuple[str, str | None]] = []
    seen_locs: set[str] = set()

    def _add(path: str, lastmod: str | None = None) -> None:
        loc = make_abs_url(path, site_url, baseurl)
        if loc not in seen_locs:
            seen_locs.add(loc)
            url_entries.append((loc, lastmod))

    for p in posts:
        _add(p.url_path, (p.last_modified_at or p.date).isoformat())
    for pg in pages:
        _add(pg.permalink)
    for hp in home_paths:
        url_path = "/" if hp == "index.html" else "/" + hp.removesuffix("index.html")
        _add(url_path)

    for root_html in ["if_convert.html", "twitter.html", "ut_convert.html"]:
        f = output_dir / root_html
        if f.is_file():
            mtime = datetime.fromtimestamp(f.stat().st_mtime, tz=tz).isoformat()
            _add("/" + root_html, mtime)

    tools_out = output_dir / "tools"
    if tools_out.is_dir():
        for html_file in sorted(tools_out.rglob("*.html")):
            rel = html_file.relative_to(output_dir).as_posix()
            if rel.startswith("tools/test_data/"):
                continue
            canonical_rel = "/" + (rel.removesuffix("index.html") if rel.endswith("/index.html") else rel)
            mtime = datetime.fromtimestamp(html_file.stat().st_mtime, tz=tz).isoformat()
            _add(canonical_rel, mtime)

    rows = []
    for loc, lastmod in url_entries:
        lastmod_tag = f"<lastmod>{html.escape(lastmod, quote=False)}</lastmod>" if lastmod else ""
        rows.append(f"<url><loc>{html.escape(loc, quote=False)}</loc>{lastmod_tag}</url>")

    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
        'xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 '
        'http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" '
        'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(rows)
        + "\n</urlset>\n"
    )


def build_search_data_js(posts: list[Post], baseurl: str) -> str:
    records = [
        {
            "title": p.title,
            "excerpt": p.excerpt,
            "content": p.plain_text,
            "categories": p.categories,
            "tags": p.tags,
            "url": make_rel_url(p.url_path, baseurl),
            "date": _format_short_date(p.date),
            "teaser": make_rel_url(p.teaser, baseurl) if p.teaser else None,
        }
        for p in posts
    ]
    return "window.__SEARCH_INDEX__ = " + json.dumps(records, ensure_ascii=False) + ";\n"


def _write_output(output_dir: Path, rel_path: str, content: str) -> None:
    target = output_dir / rel_path.lstrip("/")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def _copy_static_assets(root: Path, output_dir: Path) -> None:
    for filename in _ROOT_STATIC_FILES:
        src = root / filename
        if src.is_file():
            shutil.copy2(src, output_dir / filename)

    assets_src = root / "assets"
    if assets_src.is_dir():
        shutil.copytree(
            assets_src,
            output_dir / "assets",
            ignore=shutil.ignore_patterns(".DS_Store"),
            dirs_exist_ok=True,
        )

    tools_src = root / "tools"
    if tools_src.is_dir():
        shutil.copytree(
            tools_src,
            output_dir / "tools",
            ignore=shutil.ignore_patterns(*_TOOLS_EXCLUDES),
            dirs_exist_ok=True,
        )


def build_site(
    root_dir: Path,
    output_dir: Path,
    baseurl: str = "",
    include_drafts: bool = False,
) -> dict[str, int]:
    """Build the full static site into output_dir and return artifact counts."""
    config_path = root_dir / "site_config.json"
    config = json.loads(config_path.read_text(encoding="utf-8"))
    norm_baseurl = normalize_baseurl(baseurl)

    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    _copy_static_assets(root_dir, output_dir)

    posts = load_posts(root_dir, config, include_drafts=include_drafts)
    pages = load_pages(root_dir)

    home_pages = render_home_pages(posts, config, norm_baseurl)
    for rel_path, html_doc in home_pages.items():
        _write_output(output_dir, rel_path, html_doc)

    for idx, post in enumerate(posts):
        newer = posts[idx - 1] if idx > 0 else None
        older = posts[idx + 1] if idx + 1 < len(posts) else None
        post_html = render_single_post(post, older, newer, posts, config, norm_baseurl)
        out_rel = post.url_path.strip("/") + "/index.html"
        _write_output(output_dir, out_rel, post_html)

    for pg in pages:
        page_html = render_page(pg, posts, config, norm_baseurl)
        stripped = pg.permalink.strip("/")
        out_rel = "index.html" if not stripped else (stripped if stripped.endswith(".html") else f"{stripped}/index.html")
        _write_output(output_dir, out_rel, page_html)

    _write_output(output_dir, "feed.xml", build_atom_feed(posts, config, norm_baseurl))
    _write_output(output_dir, "assets/js/search-data.js", build_search_data_js(posts, norm_baseurl))
    _write_output(
        output_dir,
        "sitemap.xml",
        build_sitemap(posts, pages, list(home_pages.keys()), output_dir, config, norm_baseurl),
    )
    _write_output(output_dir, ".nojekyll", "")

    return {
        "posts": len(posts),
        "pages": len(pages),
        "home_pages": len(home_pages),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build nuridol.github.io static site.")
    parser.add_argument("--output", default="_site", help="Output directory (default: _site)")
    parser.add_argument("--baseurl", default="", help="Base URL path prefix")
    parser.add_argument("--drafts", action="store_true", help="Include posts from _drafts")
    parser.add_argument("--serve", action="store_true", help="Serve built site over HTTP")
    parser.add_argument("--port", type=int, default=4000, help="Port for --serve (default: 4000)")
    args = parser.parse_args(argv)

    root_dir = Path(__file__).resolve().parent.parent
    output_path = Path(args.output)
    if not output_path.is_absolute():
        output_path = root_dir / output_path

    stats = build_site(
        root_dir=root_dir,
        output_dir=output_path,
        baseurl=args.baseurl,
        include_drafts=args.drafts,
    )
    print(
        f"Built site into {output_path}: "
        f"{stats['posts']} posts, {stats['pages']} pages, {stats['home_pages']} index pages."
    )

    if args.serve:
        handler = partial(SimpleHTTPRequestHandler, directory=str(output_path))
        server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
        print(f"Serving on http://127.0.0.1:{args.port}/ (Ctrl+C to stop)")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            server.server_close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
