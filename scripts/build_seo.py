#!/usr/bin/env python3
"""Build catalog, crawlable item pages, sitemap, robots, and OG image for kakobuyspreadsheet.me."""
from __future__ import annotations

import json
import os
import re
import shutil
from collections import defaultdict
from datetime import date
from html import escape
from pathlib import Path
from urllib.parse import quote

ORIGIN = "https://kakobuyspreadsheet.me"
AFF = "9v88f"
TODAY = date.today().isoformat()
ROOT = Path(__file__).resolve().parents[1]
HUNT = ROOT.parent / "kakobuyhunt"
SELLERS = {"wen": "Wen Studio", "li": "LJR-Christine", "other": "Verified seller"}


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower())
    s = re.sub(r"^-+|-+$", "", s)
    s = re.sub(r"-+", "-", s)
    return s[:60]


def item_id(p: dict) -> str:
    return re.sub(r"^p-", "", str(p.get("id") or ""), count=1)


def item_slug(p: dict) -> str:
    if p.get("slug"):
        return str(p["slug"])
    base = slugify(str(p.get("title") or ""))
    num = item_id(p)
    return f"{base}-{num}" if base else num


def kakobuy_url(source_url: str) -> str:
    url = source_url or ""
    weidian = re.search(r"itemID=(\d+)", url, re.I)
    if weidian or "weidian.com" in url.lower():
        if weidian:
            return (
                "https://www.kakobuy.com/item/details?url="
                f"https%3A%2F%2Fweidian.com%2Fitem.html%3FitemID%3D{weidian.group(1)}"
                f"&affcode={AFF}"
            )
    return f"https://www.kakobuy.com/item/details?url={quote(url, safe='')}&affcode={AFF}"


def load_hunt() -> list[dict]:
    raw = (HUNT / "js" / "catalog.js").read_text(encoding="utf-8")
    start = raw.index("KF.products = ") + len("KF.products = ")
    products, _ = json.JSONDecoder().raw_decode(raw[start:])
    return products


def link_or_copy(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists() or dst.is_symlink():
        return
    try:
        os.link(src, dst)
    except OSError:
        shutil.copy2(src, dst)


def copy_images(products: list[dict]) -> None:
    src_dir = HUNT / "img" / "products"
    dst_dir = ROOT / "img" / "products"
    dst_dir.mkdir(parents=True, exist_ok=True)
    n = 0
    for p in products:
        pid = item_id(p)
        for name in (f"{pid}.webp", f"{pid}-2.webp", f"{pid}-3.webp"):
            src = src_dir / name
            if src.exists():
                link_or_copy(src, dst_dir / name)
                n += 1
    print(f"images linked/copied: {n}")


def write_products(products: list[dict]) -> list[dict]:
    slim = []
    for p in products:
        slug = item_slug(p)
        slim.append({
            "id": p.get("id"),
            "title": p.get("title") or "Find",
            "price": p.get("price") or 0,
            "rating": p.get("rating") or 4.5,
            "category": p.get("category") or "other",
            "collection": p.get("collection") or "Find",
            "qc": bool(p.get("qc")),
            "featured": bool(p.get("featured")),
            "sourceUrl": p.get("sourceUrl") or "",
            "image": f"img/products/{item_id(p)}.webp",
            "popular": bool(p.get("featured") or (p.get("rating") or 0) >= 4.8),
            "sellerName": SELLERS.get(str(p.get("seller") or "other"), "Verified seller"),
            "slug": slug,
        })
    payload = {
        "updated": "21 Sept 2026",
        "countLabel": "4,000+",
        "count": len(slim),
        "products": slim,
    }
    out = ROOT / "js" / "products.js"
    out.write_text(
        "window.SK = window.SK || {};\nSK.catalog = "
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(f"products.js: {len(slim)} items, {out.stat().st_size // 1024} KB")
    return slim


def card_html(p: dict, prefix: str) -> str:
    pill = '<span class="pill">Popular</span>' if p.get("popular") else ""
    tags = f'<span class="card-tags">{pill}</span>' if pill else ""
    title = escape(p["title"])
    return (
        f'<a class="card" href="{prefix}item/{p["slug"]}/">'
        f'<div class="card-media">'
        f'<img src="{prefix}{p["image"]}" alt="{title}" width="400" height="400" loading="lazy" decoding="async" />'
        f"{tags}"
        f'<span class="price-chip">${float(p["price"]):.2f}</span>'
        f"</div>"
        f'<div class="card-body"><h3>{title}</h3>'
        f'<div class="seller-row"><span>{escape(p.get("sellerName") or "Verified seller")}</span></div>'
        f"</div></a>"
    )


def thumbs_html(p: dict, prefix: str) -> str:
    pid = item_id(p)
    imgs = [f"img/products/{pid}.webp"]
    for n in (2, 3):
        if (ROOT / "img" / "products" / f"{pid}-{n}.webp").exists():
            imgs.append(f"img/products/{pid}-{n}.webp")
    while len(imgs) < 3:
        imgs.append("")
    bits = []
    for i, src in enumerate(imgs):
        cls = "is-on" if i == 0 else ""
        if src:
            bits.append(
                f'<button type="button" data-src="{prefix}{src}" class="{cls}" aria-label="Photo {i + 1}">'
                f'<img src="{prefix}{src}" alt="" /></button>'
            )
        else:
            bits.append(f'<button type="button" class="is-empty" aria-label="Photo {i + 1}"></button>')
    return "".join(bits)


def item_page(p: dict, related: list[dict]) -> str:
    prefix = "../../"
    slug = p["slug"]
    url = f"{ORIGIN}/item/{slug}/"
    title = p["title"]
    desc = (
        f"{title} replica on KakoBuy Spreadsheet. "
        f"${float(p['price']):.2f} USD, QC photos, direct KakoBuy link. QualityReps find."
    )
    img = f"{ORIGIN}/{p['image']}"
    schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": title,
        "image": img,
        "description": desc,
        "brand": {"@type": "Brand", "name": p.get("collection") or "Find"},
        "offers": {
            "@type": "Offer",
            "price": f"{float(p['price']):.2f}",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock",
            "url": url,
        },
    }
    related_html = "".join(card_html(x, prefix) for x in related)
    buy = kakobuy_url(p.get("sourceUrl") or "")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escape(title)} — KakoBuy Spreadsheet Replicas</title>
  <meta name="description" content="{escape(desc)}" />
  <meta name="keywords" content="replicas, qualityreps, Kakobuy Spreadsheet, {escape(title)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="{url}" />
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="kakobuy spreadsheet" />
  <meta property="og:title" content="{escape(title)} — KakoBuy Spreadsheet" />
  <meta property="og:description" content="{escape(desc)}" />
  <meta property="og:url" content="{url}" />
  <meta property="og:image" content="{img}" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
  <link rel="icon" href="{prefix}img/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="{prefix}css/style.css" />
</head>
<body data-page="item" data-item-id="{escape(str(p['id']))}">
  <div class="promo-bar" id="promo"></div>
  <header class="site-header" id="site-header"></header>
  <div class="overlay" id="overlay"></div>
  <aside class="mobile-nav" id="mobile-nav"></aside>
  <main>
    <section class="section">
      <div class="wrap">
        <div class="crumbs" id="item-crumbs"><a href="{prefix}index.html">Home</a> / <a href="{prefix}spreadsheet.html">Spreadsheet</a> / <span>{escape(p.get("collection") or "Find")}</span></div>
        <div class="item-grid" id="item-root">
          <div class="item-gallery">
            <div class="item-shot"><img id="item-main" src="{prefix}{p['image']}" alt="{escape(title)}" /></div>
            <div class="item-thumbs" id="item-thumbs">{thumbs_html(p, prefix)}</div>
          </div>
          <div class="buy-box">
            <h1>{escape(title)}</h1>
            <div class="price">${float(p['price']):.2f}</div>
            <p>Hand-checked replica listing. Opens the live KakoBuy product page so you can pick size, pay, and review warehouse QC before shipping.</p>
            <div style="margin-top:22px">
              <a class="btn btn-solid" href="{escape(buy)}" target="_blank" rel="noopener">View on KakoBuy →</a>
              <p class="buy-note">Link uses our KakoBuy referral code. How this site makes money.</p>
            </div>
          </div>
        </div>
        <aside class="qc-tips">
          <h2>What to check in the QC photos</h2>
          <ol>
            <li>Check the seller's QC photos before accepting at the KakoBuy warehouse.</li>
            <li>Compare against retail images for color and material accuracy.</li>
            <li>Verify size labels and any logos for spelling or placement issues.</li>
          </ol>
        </aside>
      </div>
    </section>
    <section class="section soft">
      <div class="wrap">
        <div class="section-head"><div><h2>Related finds</h2><p>Same category, other listings.</p></div></div>
        <div class="product-grid" id="related-grid">{related_html}</div>
      </div>
    </section>
  </main>
  <footer class="site-footer" id="site-footer"></footer>
  <script src="{prefix}js/site.js"></script>
  <script src="{prefix}js/app.js"></script>
</body>
</html>
"""


def write_items(products: list[dict]) -> None:
    by_cat = defaultdict(list)
    for p in products:
        by_cat[p["category"]].append(p)
    item_root = ROOT / "item"
    if item_root.exists():
        shutil.rmtree(item_root)
    n = 0
    for p in products:
        related = [x for x in by_cat[p["category"]] if x["id"] != p["id"]][:8]
        folder = item_root / p["slug"]
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "index.html").write_text(item_page(p, related), encoding="utf-8")
        n += 1
        if n % 500 == 0:
            print(f"  item pages {n}/{len(products)}")
    print(f"item pages: {n}")


def write_sitemap(products: list[dict]) -> None:
    pages = [
        "/",
        "/spreadsheet.html",
        "/coupons.html",
        "/faq.html",
        "/qc.html",
        "/articles.html",
        "/pl.html",
        "/de.html",
        "/articles/is-kakobuy-legit.html",
        "/articles/kakobuy-vs-cnfans.html",
        "/articles/shipping-customs.html",
    ]
    urls = []
    for path in pages:
        urls.append(
            f"  <url><loc>{ORIGIN}{path}</loc><lastmod>{TODAY}</lastmod><changefreq>weekly</changefreq></url>"
        )
    for p in products:
        urls.append(
            f"  <url><loc>{ORIGIN}/item/{p['slug']}/</loc><lastmod>{TODAY}</lastmod><changefreq>weekly</changefreq></url>"
        )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>\n"
    )
    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
    print(f"sitemap.xml: {len(urls)} urls")


def write_robots() -> None:
    (ROOT / "robots.txt").write_text(
        f"""User-agent: *
Allow: /
Disallow: /scripts/

Sitemap: {ORIGIN}/sitemap.xml

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /
""",
        encoding="utf-8",
    )
    print("robots.txt")


def write_og() -> None:
    from PIL import Image, ImageDraw, ImageFont

    w, h = 1200, 630
    img = Image.new("RGB", (w, h), "#f6f3ec")
    logo = Image.open(ROOT / "img" / "logo-k.png").convert("RGBA")
    logo = logo.resize((180, 230), Image.Resampling.LANCZOS)
    img.paste(logo, (80, 200), logo)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 64)
        small = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 32)
    except OSError:
        font = ImageFont.load_default()
        small = font
    draw.text((300, 230), "kakobuy spreadsheet", fill="#141210", font=font)
    draw.text((300, 320), "4,000+ replicas with QC photos", fill="#f05a00", font=small)
    out = ROOT / "img" / "og.png"
    img.save(out, "PNG", optimize=True)
    print(f"og.png {out.stat().st_size // 1024} KB")


HREFLANG = f"""  <link rel="alternate" hreflang="en" href="{ORIGIN}/" />
  <link rel="alternate" hreflang="pl" href="{ORIGIN}/pl.html" />
  <link rel="alternate" hreflang="de" href="{ORIGIN}/de.html" />
  <link rel="alternate" hreflang="x-default" href="{ORIGIN}/" />"""

SITE_SCHEMA = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            "@id": f"{ORIGIN}/#org",
            "name": "kakobuy spreadsheet",
            "url": f"{ORIGIN}/",
            "logo": f"{ORIGIN}/img/logo-k.png",
            "email": "hello@kakobuyspreadsheet.me",
            "sameAs": ["https://discord.gg/7DRMaMAADv"],
        },
        {
            "@type": "WebSite",
            "@id": f"{ORIGIN}/#website",
            "url": f"{ORIGIN}/",
            "name": "KakoBuy Spreadsheet 2026",
            "publisher": {"@id": f"{ORIGIN}/#org"},
            "inLanguage": "en",
            "potentialAction": {
                "@type": "SearchAction",
                "target": f"{ORIGIN}/spreadsheet.html?q={{search_term_string}}",
                "query-input": "required name=search_term_string",
            },
        },
    ],
}


def upsert_head(path: Path, canonical: str, extra: str = "", hreflang: bool = False) -> None:
    html = path.read_text(encoding="utf-8")
    html = re.sub(r'\s*<link rel="canonical"[^>]*>', "", html)
    html = re.sub(r'\s*<link rel="alternate" hreflang=[^>]*>', "", html)
    html = re.sub(r'\s*<meta property="og:url"[^>]*>', "", html)
    html = re.sub(r'\s*<meta property="og:image"[^>]*>', "", html)
    html = re.sub(r'\s*<meta name="twitter:card"[^>]*>', "", html)
    html = re.sub(r'\s*<meta name="robots"[^>]*>', "", html)
    html = re.sub(
        r'\s*<script type="application/ld\+json">.*?</script>',
        "",
        html,
        flags=re.S,
    )
    html = html.replace("https://spreadsheet-kakobuy.com", ORIGIN)
    html = html.replace("10,000+", "4,000+")
    block = [
        f'  <meta name="robots" content="index, follow, max-image-preview:large" />',
        f'  <link rel="canonical" href="{canonical}" />',
        f'  <meta property="og:url" content="{canonical}" />',
        f'  <meta property="og:image" content="{ORIGIN}/img/og.png" />',
        '  <meta name="twitter:card" content="summary_large_image" />',
    ]
    if hreflang:
        block.append(HREFLANG)
    if extra:
        block.append(extra)
    inject = "\n".join(block) + "\n"
    html = html.replace("  <link rel=\"icon\"", inject + "  <link rel=\"icon\"", 1)
    path.write_text(html, encoding="utf-8")


def patch_pages() -> None:
    schema = f'  <script type="application/ld+json">{json.dumps(SITE_SCHEMA, ensure_ascii=False)}</script>'
    pages = {
        "index.html": (f"{ORIGIN}/", True, schema),
        "spreadsheet.html": (f"{ORIGIN}/spreadsheet.html", False, schema),
        "coupons.html": (f"{ORIGIN}/coupons.html", False, ""),
        "faq.html": (f"{ORIGIN}/faq.html", False, ""),
        "qc.html": (f"{ORIGIN}/qc.html", False, ""),
        "articles.html": (f"{ORIGIN}/articles.html", False, ""),
        "pl.html": (f"{ORIGIN}/pl.html", True, schema),
        "de.html": (f"{ORIGIN}/de.html", True, schema),
        "finds.html": (f"{ORIGIN}/finds.html", False, ""),
        "item.html": (f"{ORIGIN}/item.html", False, ""),
        "articles/is-kakobuy-legit.html": (f"{ORIGIN}/articles/is-kakobuy-legit.html", False, ""),
        "articles/kakobuy-vs-cnfans.html": (f"{ORIGIN}/articles/kakobuy-vs-cnfans.html", False, ""),
        "articles/shipping-customs.html": (f"{ORIGIN}/articles/shipping-customs.html", False, ""),
    }
    for rel, (canon, hreflang, extra) in pages.items():
        path = ROOT / rel
        if path.exists():
            upsert_head(path, canon, extra, hreflang)
            print("patched", rel)


def main() -> None:
    print("loading hunt catalog…")
    hunt = load_hunt()
    print("hunt products", len(hunt))
    copy_images(hunt)
    products = write_products(hunt)
    write_items(products)
    write_sitemap(products)
    write_robots()
    write_og()
    patch_pages()
    print("done")


if __name__ == "__main__":
    main()
