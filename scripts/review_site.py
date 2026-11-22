#!/usr/bin/env python3
"""Check the shipped HTML and its local resources without calling the network."""

import argparse
from collections import Counter, defaultdict
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import unquote, urljoin, urlsplit


HTML_EXTENSIONS = {".htm", ".html"}
URL_ATTRS = {
    "a": ("href",), "area": ("href",), "audio": ("src",), "embed": ("src",),
    "form": ("action",), "iframe": ("src",), "image": ("href", "xlink:href"),
    "img": ("src",), "input": ("src",), "link": ("href",), "object": ("data",),
    "script": ("src",), "source": ("src",), "track": ("src",),
    "use": ("href", "xlink:href"), "video": ("src", "poster"),
}
LABELABLE = {"input", "select", "textarea"}
UNLABELLED_TYPES = {"button", "image", "submit", "reset", "hidden"}
CSS_COMMENTS = re.compile(r"/\*.*?\*/", re.S)
CSS_URLS = re.compile(r'''url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)'\"]+))\s*\)''', re.I)
TEXT_FRAGMENT = ":~:text="


@dataclass(frozen=True)
class Finding:
    severity: str
    file: Path
    line: int
    detail: str


def srcset_urls(value):
    """Read URL tokens and skip descriptors, including data URLs with commas."""
    while value := value.lstrip(" ,\t\r\n\f"):
        token = re.match(r"\S+", value)[0]
        yield token.rstrip(",")
        value = value[len(token):]
        if not token.endswith(","):
            _, _, value = value.partition(",")


def css_refs(text, offset=0):
    css = CSS_COMMENTS.sub(lambda match: re.sub(r"[^\n]", " ", match[0]), text)
    for match in CSS_URLS.finditer(css):
        url = next(group for group in match.groups() if group is not None)
        if not url.startswith("#") and "\\" not in url:
            yield url, offset + css.count("\n", 0, match.start()) + 1


class Page(HTMLParser):
    def __init__(self, file, text):
        super().__init__(convert_charrefs=True)
        self.file = file
        self.refs = []
        self.findings = []
        self.ids = {}
        self.anchors = set()
        self.labels = set()
        self.fields = []
        self.label_depth = 0
        self.title = []
        self.in_title = False
        self.in_style = False
        self.h1_count = 0
        self.lang = False
        self.meta = set()
        self.base_href = None
        self.feed(text)
        self.close()
        self.check_metadata()

    def add(self, severity, line, detail):
        self.findings.append(Finding(severity, self.file, line, detail))

    def handle_starttag(self, tag, attributes):
        attrs = {name: value or "" for name, value in attributes}
        line, _ = self.getpos()
        element_id = attrs.get("id")
        if element_id:
            if element_id in self.ids:
                self.add("ERROR", line, f"Duplicate ID {element_id!r}, first used on line {self.ids[element_id]}.")
            self.ids.setdefault(element_id, line)
        if tag == "a" and attrs.get("name"):
            self.anchors.add(attrs["name"])
        if tag == "html":
            self.lang = bool(attrs.get("lang", "").strip())
        if tag == "meta" and attrs.get("content", "").strip():
            self.meta.add(attrs.get("name", "").lower())
        if tag == "base" and "href" in attrs and self.base_href is None:
            self.base_href = attrs["href"]
        if tag == "title":
            self.in_title = True
        if tag == "style":
            self.in_style = True
        if tag == "h1":
            self.h1_count += 1
        if tag == "img" and "alt" not in attrs:
            self.add("WARNING", line, "Image is missing alt text. Check whether it is meaningful or decorative.")
        if tag == "label":
            self.label_depth += 1
            if attrs.get("for"):
                self.labels.add(attrs["for"])
        if tag in LABELABLE and attrs.get("type", "").lower() not in UNLABELLED_TYPES:
            if not (self.label_depth or attrs.get("aria-label", "").strip()):
                self.fields.append((line, element_id, attrs.get("aria-labelledby", "").split()))

        for key in URL_ATTRS.get(tag, ()):
            if key in attrs:
                self.refs.append((attrs[key], line, tag in {"a", "area"}))
        if tag in {"img", "source", "link"}:
            for name in ("srcset", "imagesrcset"):
                self.refs.extend((url, line, False) for url in srcset_urls(attrs.get(name, "")))
        self.refs.extend((url, css_line, False) for url, css_line in css_refs(attrs.get("style", ""), line - 1))

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "style":
            self.in_style = False
        if tag == "label":
            self.label_depth = max(0, self.label_depth - 1)

    def handle_data(self, data):
        if self.in_title:
            self.title.append(data)
        if self.in_style:
            line, _ = self.getpos()
            self.refs.extend((url, css_line, False) for url, css_line in css_refs(data, line - 1))

    def check_metadata(self):
        for condition, message in (
            (not self.lang, "Set the document language on the HTML element."),
            (not "".join(self.title).strip(), "Add a descriptive page title."),
            ("description" not in self.meta, "Add a page description if this page is intended for search."),
            ("viewport" not in self.meta, "Check the viewport meta tag and test the mobile layout."),
            (self.h1_count != 1, f"Found {self.h1_count} H1 headings. Check the page's heading hierarchy."),
        ):
            if condition:
                self.add("WARNING", 1, message)
        for line, element_id, labelledby in self.fields:
            if element_id not in self.labels and not any(label in self.ids for label in labelledby):
                self.add("WARNING", line, "Form field has no detectable accessible label.")


def shipped_files(root):
    for file in root.rglob("*"):
        relative = file.relative_to(root)
        if any(part.startswith(".") for part in relative.parts):
            continue
        if file.is_file() and file.resolve().is_relative_to(root):
            yield file


def check_ref(root, mount, pages, source, ref, line, is_link, base_href=None):
    ref = ref.strip()
    if not ref or ref in {"#", "#/"}:
        if is_link:
            return Finding("WARNING", source, line, f"Check whether the navigation link {ref!r} is a placeholder.")
        return None
    try:
        url = urlsplit(ref)
    except ValueError:
        return Finding("WARNING", source, line, f"Check malformed URL {ref!r}.")
    if url.scheme or url.netloc:
        return None
    if base_href:
        try:
            base = urljoin(f"{mount}{source.relative_to(root).as_posix()}", base_href)
            url = urlsplit(urljoin(base, ref))
        except ValueError:
            return Finding("WARNING", source, line, f"Check URL {ref!r} and its base URL.")
        if url.scheme or url.netloc:
            return None

    path = unquote(url.path)
    if "\x00" in path:
        return Finding("ERROR", source, line, f"Local reference {ref!r} contains a null character.")
    if path.startswith("/"):
        if path + "/" == mount:
            path = mount
        if not path.startswith(mount):
            return Finding("WARNING", source, line, f"Confirm {ref!r} on the host. It points outside {mount}.")
        target = root / path.removeprefix(mount)
    else:
        target = source.parent / path if path else source
    target = target.resolve()
    if not target.is_relative_to(root):
        return Finding("WARNING", source, line, f"Confirm {ref!r} on the host. It points outside the site directory.")
    if target.is_dir():
        target /= "index.html"
    if not target.is_file() and not target.suffix and not path.endswith("/"):
        clean_url_target = target.with_suffix(".html")
        if clean_url_target.is_file():
            return Finding("WARNING", source, line, f"Verify hosting routes {ref!r} to {clean_url_target.name}.")
    if not target.resolve().is_relative_to(root) or not target.is_file():
        return Finding("ERROR", source, line, f"Local reference {ref!r} has no published target.")
    if is_link and url.fragment and target in pages:
        fragment = unquote(url.fragment).split(TEXT_FRAGMENT, 1)[0]
        page = pages[target]
        if fragment and fragment.lower() != "top" and fragment not in page.ids and fragment not in page.anchors:
            return Finding("WARNING", source, line, f"Check fragment {ref!r}. No matching anchor exists in the static HTML.")
    return None


def review(root, mount):
    findings = []
    pages = {}
    styles = {}
    if not (root / "index.html").is_file():
        findings.append(Finding("ERROR", root / "index.html", 1, "The site homepage is missing."))
    for file in sorted(shipped_files(root)):
        suffix = file.suffix.lower()
        if suffix not in {*HTML_EXTENSIONS, ".css"}:
            continue
        try:
            text = file.read_text(encoding="utf-8-sig")
        except (OSError, UnicodeError) as error:
            findings.append(Finding("ERROR", file, 1, f"Cannot read as UTF-8 ({error})."))
            continue
        if suffix in HTML_EXTENSIONS:
            pages[file] = Page(file, text)
        else:
            styles[file] = text

    titles = defaultdict(list)
    for file, page in pages.items():
        findings.extend(page.findings)
        title = " ".join("".join(page.title).split())
        if title:
            titles[title.casefold()].append(file)
        for ref, line, is_link in page.refs:
            finding = check_ref(root, mount, pages, file, ref, line, is_link, page.base_href)
            if finding:
                findings.append(finding)
    for file, text in styles.items():
        for ref, line in css_refs(text):
            finding = check_ref(root, mount, pages, file, ref, line, False)
            if finding:
                findings.append(finding)
    for files in titles.values():
        if len(files) > 1:
            for file in files:
                findings.append(Finding("WARNING", file, 1, "A second HTML page uses this page title."))
    return len(pages), len(styles), findings


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", type=Path, default=Path("."))
    parser.add_argument("--mount", default="/clearframe-web/", help="Site base path on the host")
    args = parser.parse_args()
    root = args.root.resolve()
    if not root.is_dir():
        parser.error(f"site directory does not exist: {root}")
    mount = "/" + args.mount.strip("/") + "/" if args.mount.strip("/") else "/"
    page_count, style_count, findings = review(root, mount)
    for finding in sorted(findings, key=lambda item: (item.severity, item.file, item.line, item.detail)):
        detail = " ".join(finding.detail.split())
        print(f"{finding.severity} {finding.file.relative_to(root).as_posix()!r}:{finding.line} {detail}")
    counts = Counter(finding.severity for finding in findings)
    print(f"Checked {page_count} HTML pages and {style_count} stylesheets. "
          f"{counts['ERROR']} errors, {counts['WARNING']} items for manual review.")
    return int(bool(counts["ERROR"]))


if __name__ == "__main__":
    raise SystemExit(main())
