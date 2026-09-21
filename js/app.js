(() => {
  const byId = (id) => document.getElementById(id);
  const products = () => SK.products();
  const params = new URLSearchParams(location.search);

  const renderGrid = (el, list) => {
    if (!el) return;
    el.innerHTML = list.length
      ? list.map(SK.card).join("")
      : `<p class="empty">No finds in this filter yet. Try another category.</p>`;
  };

  const page = document.body.getAttribute("data-page");

  if (page === "home") {
    const homeIds = [
      "p-7647061883", "p-7761783432", "p-7702021889", "p-7650273597",
      "p-7772857134", "p-7765013688", "p-7773007666", "p-7764333058",
      "p-7772934670", "p-7772899302", "p-7769821047", "p-7770015629",
    ];
    const byIdMap = Object.fromEntries(products().map((p) => [p.id, p]));
    const homeList = homeIds.map((id) => byIdMap[id]).filter(Boolean);
    renderGrid(byId("latest-grid"), homeList);
    const cats = byId("cat-grid");
    if (cats) {
      cats.innerHTML = SK.categories.map((c) =>
        `<a class="cat-tile" href="${SK.catHref(c.slug)}">
          ${c.hot ? `<em class="hot">HOT</em>` : ""}
          <b>${c.emoji}</b>
          <div><h3>${c.label}</h3><span>${c.count} items</span></div>
        </a>`
      ).join("");
    }
    SK.mountFaqs(SK.faqs.en);
    document.querySelectorAll("[data-faq]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-faq]").forEach((b) => b.classList.remove("is-on"));
        btn.classList.add("is-on");
        SK.mountFaqs(SK.faqs[btn.getAttribute("data-faq")] || SK.faqs.en);
      });
    });
  }

  if (page === "spreadsheet" || page === "finds") {
    const all = page === "finds" ? products().filter((p) => p.featured) : products();
    const grid = byId("catalog-grid");
    const search = byId("catalog-search");
    const cat = byId("catalog-cat");
    const sort = byId("catalog-sort");
    const count = byId("result-count");

    if (cat) {
      const slugs = [...new Set(all.map((p) => p.category).filter(Boolean))].sort();
      slugs.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s.replace(/-/g, " ");
        cat.appendChild(opt);
      });
      const pre = params.get("cat");
      if (pre) cat.value = pre;
    }
    const q0 = params.get("q");
    if (q0 && search) search.value = q0;

    const apply = () => {
      const q = (search && search.value || "").trim().toLowerCase();
      const c = cat && cat.value;
      let list = all.slice();
      if (c) list = list.filter((p) => p.category === c);
      if (q) list = list.filter((p) => `${p.title} ${p.collection} ${p.sellerName}`.toLowerCase().includes(q));
      const s = sort && sort.value;
      if (s === "price-asc") list.sort((a, b) => a.price - b.price);
      else if (s === "price-desc") list.sort((a, b) => b.price - a.price);
      else if (s === "boosted") list.sort((a, b) => b.boosted - a.boosted);
      if (count) count.textContent = `Showing ${list.length} finds`;
      renderGrid(grid, list);
    };

    [search, cat, sort].forEach((el) => el && el.addEventListener("input", apply));
    apply();
  }

  if (page === "qc") {
    renderGrid(byId("qc-grid"), products().filter((p) => p.qc).slice(0, 18));
  }

  if (page === "coupons") {
    const copied = byId("coupon-copied");
    const copyCode = async (code) => {
      try {
        await navigator.clipboard.writeText(code);
      } catch (_) {
        const tmp = document.createElement("textarea");
        tmp.value = code;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand("copy");
        tmp.remove();
      }
      if (copied) {
        copied.hidden = false;
        copied.textContent = "Copied. Enter FINDS20 on the shipping page.";
      }
    };
    document.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", () => copyCode(btn.getAttribute("data-copy") || "FINDS20"));
    });
  }

  if (page === "item") {
    const pathSlug = (location.pathname.match(/\/item\/([^/]+)/) || [])[1];
    const id = params.get("id") || document.body.getAttribute("data-item-id");
    const list = products();
    let p = list.find((x) => x.id === id)
      || list.find((x) => x.slug === pathSlug)
      || list.find((x) => SK.itemSlug(x) === pathSlug);
    if (p && params.get("id") && !pathSlug) {
      location.replace(SK.itemHref(p));
      return;
    }
    const bindThumbs = () => {
      const mainImg = byId("item-main");
      const thumbs = byId("item-thumbs");
      if (!thumbs || !mainImg) return;
      thumbs.querySelectorAll("button").forEach((btn) => {
        const thumb = btn.querySelector("img");
        if (thumb) {
          thumb.addEventListener("error", () => {
            btn.classList.add("is-empty");
            btn.removeAttribute("data-src");
            thumb.remove();
          });
        }
        btn.addEventListener("click", () => {
          const src = btn.getAttribute("data-src");
          if (!src) return;
          mainImg.src = src;
          thumbs.querySelectorAll("button").forEach((el) => el.classList.toggle("is-on", el === btn));
        });
      });
    };
    const root = byId("item-root");
    if (root && root.querySelector("#item-main")) {
      bindThumbs();
      return;
    }
    if (!p || !root) return;
    document.title = `${p.title} — KakoBuy Spreadsheet`;
    const crumbs = byId("item-crumbs");
    if (crumbs) {
      crumbs.innerHTML = `<a href="${SK.asset("index.html")}">Home</a> / <a href="${SK.asset("spreadsheet.html")}">Spreadsheet</a> / <span>${p.collection || "Find"}</span>`;
    }
    const pid = String(p.id || "").replace(/^p-/, "");
    const mainSrc = SK.asset(p.image);
    const gallery = [mainSrc, SK.asset(`img/products/${pid}-2.webp`), SK.asset(`img/products/${pid}-3.webp`)];
    root.innerHTML = `
      <div class="item-gallery">
        <div class="item-shot"><img id="item-main" src="${mainSrc}" alt="${p.title}" /></div>
        <div class="item-thumbs" id="item-thumbs">
          ${gallery.map((src, i) => `<button type="button" data-src="${src}" class="${i === 0 ? "is-on" : ""}" aria-label="Photo ${i + 1}"><img src="${src}" alt="" /></button>`).join("")}
        </div>
      </div>
      <div class="buy-box">
        <h1>${p.title}</h1>
        <div class="price">${SK.money(p.price)}</div>
        <p>Hand-checked listing. Opens the live KakoBuy product page so you can pick size, pay, and review warehouse QC before shipping.</p>
        <div style="margin-top:22px">
          <a class="btn btn-solid" href="${SK.kakobuyUrl(p.sourceUrl)}" target="_blank" rel="noopener">View on KakoBuy →</a>
          <p class="buy-note">Link uses our KakoBuy referral code. How this site makes money.</p>
        </div>
      </div>`;
    bindThumbs();
    renderGrid(byId("related-grid"), list.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 8));
  }

  const form = byId("mail-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const note = byId("mail-note");
      if (note) note.textContent = "You're on the list. One email a week — unsubscribe anytime.";
      form.reset();
    });
  }
})();
