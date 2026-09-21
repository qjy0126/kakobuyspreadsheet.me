window.SK = window.SK || {};

SK.origin = "https://kakobuyspreadsheet.me";
SK.root = (() => {
  const el = document.querySelector('script[src*="js/site.js"]');
  const src = el ? (el.getAttribute("src") || "") : "";
  return src.replace(/js\/site\.js(\?.*)?$/, "");
})();
SK.asset = (path) => SK.root + String(path || "").replace(/^\//, "");
SK.signup = "https://www.kakobuy.com/register?affcode=9v88f";
SK.discord = "https://discord.gg/7DRMaMAADv";
SK.aff = "9v88f";

SK.site = {
  name: "kakobuy spreadsheet",
  email: "hello@kakobuyspreadsheet.me",
  updated: "21 Sept 2026",
};

SK.pages = [
  { href: "index.html", label: "Home", id: "home" },
  { href: "spreadsheet.html", label: "KakoBuy Spreadsheet", id: "spreadsheet" },
  { href: "articles.html", label: "Articles", id: "articles" },
  { href: "coupons.html", label: "Coupons", id: "coupons" },
  { href: "faq.html", label: "FAQ", id: "faq" },
  { href: "qc.html", label: "QC Images", id: "qc" },
];

SK.categories = [
  { slug: "shoes", label: "Designer Shoes", emoji: "👟", count: "745+", hot: true },
  { slug: "t-shirts", label: "Tees & Jerseys", emoji: "👕", count: "640+", hot: true },
  { slug: "accessories", label: "Premium Accessories", emoji: "💼", count: "690+" },
  { slug: "hoodies", label: "Verified Hoodies", emoji: "⭐", count: "360+", hot: true },
  { slug: "pants", label: "Pants", emoji: "👖", count: "390+" },
  { slug: "jackets", label: "Jackets & Outerwear", emoji: "🧥", count: "250+" },
  { slug: "jersey", label: "Jerseys", emoji: "⚽", count: "300+" },
  { slug: "watches", label: "Watches & Jewelry", emoji: "⌚", count: "120+" },
];

SK.money = (n) => "$" + Number(n || 0).toFixed(2);

SK.listing = (sourceUrl) => {
  const url = String(sourceUrl || "");
  const weidian = url.match(/itemID=(\d+)/i);
  if (weidian || /weidian\.com/i.test(url)) {
    const id = weidian ? weidian[1] : "";
    const raw = id ? `https://weidian.com/item.html?itemID=${id}` : url;
    return { id, channel: "weidian", url: raw };
  }
  return { id: "", channel: "weidian", url };
};

SK.kakobuyUrl = (sourceUrl) => {
  const L = SK.listing(sourceUrl);
  if (L.channel === "weidian" && L.id) {
    return `https://www.kakobuy.com/item/details?url=https%3A%2F%2Fweidian.com%2Fitem.html%3FitemID%3D${L.id}&affcode=${SK.aff}`;
  }
  return `https://www.kakobuy.com/item/details?url=${encodeURIComponent(L.url)}&affcode=${SK.aff}`;
};

SK.slugify = (text) => String(text || "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .replace(/-+/g, "-")
  .slice(0, 60);
SK.itemSlug = (p) => {
  if (p && p.slug) return p.slug;
  const id = String((p && p.id) || "").replace(/^p-/, "");
  const base = SK.slugify(p && p.title);
  return (base ? base + "-" : "") + id;
};
SK.itemHref = (p) => SK.asset("item/" + SK.itemSlug(p) + "/");
SK.catHref = (slug) => SK.asset("spreadsheet.html") + (slug ? "?cat=" + encodeURIComponent(slug) : "");

SK.products = () => (SK.catalog && SK.catalog.products) || [];

SK.card = (p) => {
  const tags = [
    p.popular ? `<span class="pill">Popular</span>` : "",
  ].filter(Boolean).join("");
  return `<a class="card" href="${SK.itemHref(p)}">
    <div class="card-media">
      <img src="${SK.asset(p.image)}" alt="${escapeHtml(p.title)}" width="400" height="400" loading="lazy" decoding="async" />
      ${tags ? `<span class="card-tags">${tags}</span>` : ""}
      <span class="price-chip">${SK.money(p.price)}</span>
    </div>
    <div class="card-body">
      <h3>${escapeHtml(p.title)}</h3>
      <div class="seller-row">
        <span>${escapeHtml(p.sellerName || "Verified seller")}</span>
        ${p.sales ? `<span>${p.sales}k</span>` : ""}
      </div>
    </div>
  </a>`;
};

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

SK.mountChrome = (page) => {
  const promo = document.getElementById("promo");
  if (promo) {
    promo.innerHTML = `<a class="promo-track" href="${SK.signup}" target="_blank" rel="noopener"><img src="${SK.asset("img/promo-banner.png")}" alt="Kakobuy Exclusive: ¥3000 FREE +20% OFF Shipping" /></a>`;
  }

  const header = document.getElementById("site-header");
  if (header) {
    const links = SK.pages.map((p) =>
      `<a class="${p.id === page ? "is-on" : ""}" href="${SK.asset(p.href)}">${p.label}</a>`
    ).join("");
    header.innerHTML = `<div class="wrap header-row">
      <div class="header-left">
        <a class="brand" href="${SK.asset("index.html")}">
          <span class="brand-mark"><img src="${SK.asset("img/logo-k.png")}" alt="" width="26" height="32" /></span>
          <span class="brand-copy"><strong><span>kakobuy</span> spreadsheet</strong></span>
        </a>
        <a class="btn btn-discord" href="${SK.discord}" target="_blank" rel="noopener" aria-label="Discord">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.01.05-.01.07 0 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07 0 .11.09.22.17.33.26.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.68 1.19 1.07 1.74.02.02.06.03.09.02 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12z"/></svg>
        </a>
      </div>
      <nav class="nav-links">${links}</nav>
      <div class="header-cta">
        <div class="header-search">
          <button class="btn btn-solid" type="button" id="search-open" aria-label="Search products">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="16" height="16"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
            Search
          </button>
          <div class="search-pop" id="search-pop" hidden>
            <input id="header-search" type="search" placeholder="Search shoes, hoodies, brands…" autocomplete="off" />
            <div class="search-hits" id="search-hits"></div>
          </div>
        </div>
        <button class="menu-btn" data-open="nav" aria-label="Menu">☰</button>
      </div>
    </div>`;
  }

  const mobile = document.getElementById("mobile-nav");
  if (mobile) {
    mobile.innerHTML = SK.pages.map((p) =>
      `<a href="${SK.asset(p.href)}">${p.label}</a>`
    ).join("") + `<a href="${SK.signup}" target="_blank" rel="noopener">Sign up for KakoBuy</a>`;
  }

  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.innerHTML = `<div class="wrap">
      <div class="footer-grid">
        <div class="footer-col">
          <a class="brand" href="${SK.asset("index.html")}">
            <span class="brand-copy"><strong><span>kakobuy</span> spreadsheet</strong></span>
          </a>
          <p>Independently curated list of 4,000+ KakoBuy replica links. Started in 2024. Not affiliated with KakoBuy.com.</p>
        </div>
        <div class="footer-col">
          <h3>Site</h3>
          <a href="${SK.asset("spreadsheet.html")}">Browse spreadsheet</a>
          <a href="${SK.asset("coupons.html")}">Coupons</a>
          <a href="${SK.asset("qc.html")}">QC photos</a>
          <a href="${SK.asset("articles.html")}">Articles</a>
        </div>
        <div class="footer-col">
          <h3>Guides</h3>
          <a href="${SK.asset("faq.html")}">FAQ</a>
          <a href="${SK.asset("articles/is-kakobuy-legit.html")}">Is KakoBuy legit?</a>
          <a href="${SK.asset("articles/shipping-customs.html")}">Shipping &amp; customs</a>
          <a href="${SK.asset("articles/kakobuy-vs-cnfans.html")}">KakoBuy vs CNFans</a>
          <a href="${SK.asset("pl.html")}">Polska</a>
          <a href="${SK.asset("de.html")}">Deutschland</a>
        </div>
        <div class="footer-col">
          <h3>KakoBuy</h3>
          <a href="${SK.signup}" target="_blank" rel="noopener">Official KakoBuy</a>
          <a href="${SK.discord}" target="_blank" rel="noopener">Join Discord</a>
          <a href="mailto:${SK.site.email}">${SK.site.email}</a>
        </div>
      </div>
      <div class="legal">
        <p><strong>Affiliate disclosure.</strong> This site earns a small referral commission when you order through a KakoBuy link. Browsing is free. No paywall.</p>
        <p>© 2026 Spreadsheet Kakobuy. All rights reserved. Available worldwide · <a href="${SK.asset("pl.html")}">Polski</a> · <a href="${SK.asset("de.html")}">Deutsch</a></p>
      </div>
    </div>`;
  }

  const overlay = document.getElementById("overlay");
  const openBtn = document.querySelector("[data-open=nav]");
  const closeNav = () => {
    if (mobile) mobile.classList.remove("is-on");
    if (overlay) overlay.classList.remove("is-on");
  };
  if (openBtn && mobile) {
    openBtn.addEventListener("click", () => {
      mobile.classList.add("is-on");
      if (overlay) overlay.classList.add("is-on");
    });
  }
  if (overlay) overlay.addEventListener("click", closeNav);
  SK.bindHeaderSearch();
};

SK.searchTerms = () => {
  if (SK._terms) return SK._terms;
  const count = new Map();
  const add = (raw) => {
    const t = String(raw || "").replace(/[^\w\s&+-]/g, " ").replace(/\s+/g, " ").trim();
    if (t.length < 2 || /^\d+$/.test(t)) return;
    const key = t.toLowerCase();
    count.set(key, (count.get(key) || 0) + 1);
  };
  SK.products().forEach((p) => {
    add(p.collection);
    add(p.category);
    add(`${p.collection || ""} ${p.category || ""}`);
    const words = String(p.title || "").split(/[\s,/|]+/).filter((w) => w.length > 2);
    words.forEach(add);
    for (let i = 0; i < words.length - 1; i++) add(`${words[i]} ${words[i + 1]}`);
  });
  (SK.categories || []).forEach((c) => add(c.label));
  SK._terms = [...count.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t]) => t);
  return SK._terms;
};

SK.suggest = (q, limit) => {
  const s = String(q || "").trim().toLowerCase();
  if (!s) return [];
  const terms = SK.searchTerms();
  const starts = [];
  const contains = [];
  for (let i = 0; i < terms.length; i++) {
    const t = terms[i];
    if (t === s) continue;
    if (t.startsWith(s)) starts.push(t);
    else if (t.includes(s)) contains.push(t);
    if (starts.length >= limit) break;
  }
  return [s, ...starts, ...contains].filter((t, i, arr) => arr.indexOf(t) === i).slice(0, limit);
};

SK.bindHeaderSearch = () => {
  const open = document.getElementById("search-open");
  const pop = document.getElementById("search-pop");
  const input = document.getElementById("header-search");
  const hits = document.getElementById("search-hits");
  if (!open || !pop || !input || !hits) return;
  let active = -1;

  const go = (q) => {
    const s = String(q || "").trim();
    if (s) location.href = SK.asset("spreadsheet.html") + "?q=" + encodeURIComponent(s);
  };
  const close = () => { pop.hidden = true; active = -1; };
  const mark = () => {
    hits.querySelectorAll(".search-suggest").forEach((el, i) => {
      el.classList.toggle("is-on", i === active);
    });
  };
  const render = (q) => {
    const s = String(q || "").trim().toLowerCase();
    active = -1;
    if (!s) {
      hits.innerHTML = `<p class="search-empty">Type a brand, item, or category.</p>`;
      return;
    }
    const list = SK.suggest(s, 8);
    if (!list.length) {
      hits.innerHTML = `<p class="search-empty">No suggestions.</p>`;
      return;
    }
    hits.innerHTML = list.map((term) => {
      const i = term.toLowerCase().indexOf(s);
      const label = i >= 0
        ? `${escapeHtml(term.slice(0, i))}<b>${escapeHtml(term.slice(i, i + s.length))}</b>${escapeHtml(term.slice(i + s.length))}`
        : escapeHtml(term);
      return `<button type="button" class="search-suggest" data-q="${escapeHtml(term)}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <span>${label}</span>
      </button>`;
    }).join("");
    hits.querySelectorAll(".search-suggest").forEach((btn) => {
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        go(btn.getAttribute("data-q"));
      });
    });
  };

  open.addEventListener("click", (e) => {
    e.stopPropagation();
    if (pop.hidden) {
      pop.hidden = false;
      input.focus();
      render(input.value);
    } else close();
  });
  input.addEventListener("input", () => render(input.value));
  input.addEventListener("keydown", (e) => {
    const items = [...hits.querySelectorAll(".search-suggest")];
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!items.length) return;
      active = (active + 1) % items.length;
      mark();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!items.length) return;
      active = (active - 1 + items.length) % items.length;
      mark();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && items[active]) go(items[active].getAttribute("data-q"));
      else go(input.value);
    } else if (e.key === "Escape") close();
  });
  pop.addEventListener("click", (e) => e.stopPropagation());
  document.addEventListener("click", () => close());
};

SK.mountFaqs = (list, target) => {
  const el = document.getElementById(target || "faq-list");
  if (!el) return;
  el.innerHTML = list.map((f, i) =>
    `<article class="faq-item${i === 0 ? " is-open" : ""}">
      <button type="button">${escapeHtml(f.q)} <span>+</span></button>
      <p>${escapeHtml(f.a)}</p>
    </article>`
  ).join("");
  el.querySelectorAll(".faq-item button").forEach((btn) => {
    btn.addEventListener("click", () => btn.parentElement.classList.toggle("is-open"));
  });
};

SK.faqs = {
  en: [
    { q: "What is the KakoBuy Spreadsheet?", a: "It is an independently maintained qualityreps list of 4,000+ Kakobuy replicas. Each entry links to a Taobao, Weidian or 1688 seller through KakoBuy's referral system and includes QC photos when available." },
    { q: "Is it free?", a: "Yes. No signup, no paywall. The site earns a small referral commission when you place an order through a link — this is disclosed on every page." },
    { q: "How often is it updated?", a: "New finds are added several times per week. The last full review of the list was on 21 September 2026. Dead or wrong links can be reported by email." },
    { q: "Are the products authentic?", a: "Most items listed are replica products. They are not produced or authorised by the original brand owners. Buying replicas may be illegal in your country — check before ordering. QC photos help you see what will ship before you commit." },
    { q: "How does shipping to Europe work?", a: "Typical transit times: DHL Express 7–14 working days, EMS 10–18 working days, Sea Mail 30–45 days. EU customs can inspect any package and may apply VAT plus a handling fee on packages over €150. We never promise customs-free delivery." },
    { q: "How do I get 20% off shipping?", a: "Open the Coupons page, copy code FINDS20, then paste it in the coupon field when you pay for international shipping on KakoBuy. It takes 20% off the shipping fee." },
  ],
  pl: [
    { q: "Czy KakoBuy Spreadsheet działa w Polsce?", a: "Tak. Większość naszych użytkowników jest z Polski. Wysyłka EMS lub DHL do Polski trwa zwykle 10–18 dni roboczych. Cła i VAT mogą zostać naliczone — nie obiecujemy, że paczki przejdą bez kontroli." },
    { q: "Czy lista jest darmowa?", a: "Tak. Bez rejestracji i paywalla. Serwis zarabia małą prowizję, gdy złożysz zamówienie przez link polecający." },
    { q: "Jak wygląda cło?", a: "Polski urząd celny może sprawdzić każdą paczkę. Towary z logo marek bywają zatrzymywane. Podajemy realistyczne czasy, nie obietnice." },
  ],
  de: [
    { q: "Wie funktioniert der Versand nach Deutschland?", a: "DHL Express 7–14 Werktage, EMS 12–18 Werktage. Seit ICS2 (2023) prüft der deutsche Zoll Pakete aus China routinemäßig. Bei Markenprodukten kann das Paket beschlagnahmt werden." },
    { q: "Ist die Liste kostenlos?", a: "Ja. Keine Anmeldung, keine Paywall. Die Seite verdient eine kleine Provision, wenn du über einen Link bestellst." },
    { q: "Ist KakoBuy seriös?", a: "KakoBuy ist ein etablierter Einkaufsagent: er kauft, lagert, fotografiert (QC) und verschickt. Diese Seite verkauft nichts selbst." },
  ],
};

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.getAttribute("data-page") || "home";
  SK.mountChrome(page);
});
