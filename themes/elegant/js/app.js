const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
async function getMenu() {
  return QRM.data.menu;
}

function $(id) {
  return document.getElementById(id);
}

function monogram(name) {
  const words = name.trim().split(/\s+/);
  const first = words[0] ? words[0][0] : "";
  const second = words[1] ? words[1][0] : "";
  return (first + second).toLocaleUpperCase("tr-TR");
}

function firstLetter(name) {
  return name.trim().charAt(0).toLocaleUpperCase("tr-TR");
}

function formatNumber(n) {
  return Number(n).toLocaleString("tr-TR");
}

function formatPrice(value) {
  const n = Number(value);
  if (Number.isInteger(n)) return formatNumber(n) + " ₺";
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺";
}

function formatKcal(value) {
  return "≈" + formatNumber(value) + " kcal";
}

function esc(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[m]));
}

const CATEGORY_ICON = {
  "Ana Yemek": "🍽️", "Fast Food": "🍔", "İçecek": "🥤", "Kahvaltı": "🍳",
  "Makarna": "🍝", "Pizza": "🍕", "Salata": "🥗", "Tatlı": "🍰",
};
const DIET_ICON = { "Acı": "🌶", "Vejetaryen": "🌱" };

function categoryIcon(name) {
  return CATEGORY_ICON[name] ? CATEGORY_ICON[name] + " " : "";
}

const SEARCH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`;
const SUN_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M3.5 3.5l1.7 1.7M18.8 18.8l1.7 1.7M2 12h2.4M19.6 12H22M3.5 20.5l1.7-1.7M18.8 5.2l1.7-1.7"/></svg>`;
const MOON_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.9A9 9 0 1 1 11.1 3 7 7 0 0 0 21 12.9z"/></svg>`;

const THEME_KEY = "qrm-theme";

function isDark() {
  const set = document.documentElement.dataset.theme;
  if (set === "dark") return true;
  if (set === "light") return false;
  return matchMedia("(prefers-color-scheme: dark)").matches;
}

function updateThemeButton() {
  const btn = $("themeToggle");
  if (!btn) return;
  btn.innerHTML = isDark() ? SUN_ICON : MOON_ICON;
  btn.setAttribute("aria-label", isDark() ? "Açık temaya geç" : "Koyu temaya geç");
}

function toggleTheme() {
  const next = isDark() ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  updateThemeButton();
}

const itemsById = {};

async function start() {
  const menu = await getMenu();

  menu.categories.forEach((cat) => {
    cat.items.forEach((item) => {
      item.category = cat.name;
      itemsById[item.id] = item;
    });
  });

  renderMenu(menu);
  setupElegant();
  renderCart();
  updateThemeButton();
}

function lineHTML(item) {
  const search = (item.name + " " + (item.description || "") + " " + item.category);

  const chips = [`<span class="echip echip--kcal">${formatKcal(item.calories)}</span>`];
  (item.diet || []).forEach((d) => chips.push(`<span class="echip echip--diet" title="${esc(d)}">${DIET_ICON[d] || esc(d)}</span>`));

  return `<article class="eline" data-search="${esc(search)}">
    <div class="eline__top">
      <h3 class="eline__name">${esc(item.name)}</h3>
      <span class="eline__dots" aria-hidden="true"></span>
      <span class="eline__price">${formatPrice(item.price)}</span>
    </div>
    ${item.description ? `<p class="eline__desc">${esc(item.description)}</p>` : ""}
    <div class="eline__meta">
      <div class="eline__chips">
        ${chips.join("")}
        <button class="eline__allerg-btn" type="button" data-allerg="${esc(item.id)}">⚠ Alerjen</button>
      </div>
      <button class="eline__add" type="button" data-add="${esc(item.id)}">+ Ekle</button>
    </div>
  </article>`;
}

function categoryHTML(cat) {
  const lines = cat.items.map(lineHTML).join("");
  return `<section class="ecat" data-cat="${esc(cat.id)}">
    <header class="ecat__head"><span>${cat.items.length} ürün</span><h2>${categoryIcon(cat.name)}${esc(cat.name)}</h2></header>
    <div class="ecat__lines">${lines}</div>
  </section>`;
}

function renderMenu(menu) {
  const categories = menu.categories;
  const cats = categories.map(categoryHTML).join("");

  const indexItems = categories.map((cat) =>
    `<button class="catindex__item" type="button" data-cat-index="${esc(cat.id)}" aria-label="${esc(cat.name)}">${CATEGORY_ICON[cat.name] || firstLetter(cat.name)}</button>`
  ).join("");

  $("app").innerHTML = `
    <header class="ehead">
      <button class="ehead__theme" id="themeToggle" type="button" aria-label="Tema değiştir"></button>
      <span class="ehead__logo">
        <img src="logo.png" alt="${esc(menu.restaurantName)} logosu" onerror="this.remove();document.getElementById('logoFb').hidden=false">
        <span id="logoFb" hidden aria-hidden="true">${monogram(menu.restaurantName)}</span>
      </span>
      <p class="ehead__menu">${esc(menu.menuName)}</p>
      <h1 class="ehead__name">${esc(menu.restaurantName)}</h1>
      ${menu.description ? `<p class="ehead__desc">${esc(menu.description)}</p>` : ""}
      <label class="esearch">
        ${SEARCH_ICON}
        <input type="search" id="searchInput" placeholder="Menüde ara…" autocomplete="off" aria-label="Menüde ara">
      </label>
    </header>
    <main class="emenu" id="emenu">${cats}</main>
    <p class="eempty" id="eempty" hidden>Sonuç bulunamadı.</p>
    <footer class="efoot">Önizleme · Salihli Belediyesi kimliği · test verisi</footer>
    <nav class="catindex" id="catIndex" aria-label="Kategorilere hızlı geçiş">${indexItems}</nav>
    <div class="catindex__bubble" id="catIndexBubble" hidden aria-hidden="true"></div>`;
}

function setupElegant() {
  $("emenu").addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) { cartAdd(itemsById[add.dataset.add]); flashAdd(add); return; }
    const allerg = e.target.closest("[data-allerg]");
    if (allerg) openAllergens(itemsById[allerg.dataset.allerg]);
  });
  $("asheet").addEventListener("click", (e) => {
    if (e.target.closest("[data-asheet-close]")) closeAsheet();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("asheet").classList.contains("is-open")) closeAsheet();
  });

  $("plateBar").addEventListener("click", togglePlate);
  $("btnClear").addEventListener("click", cartClear);
  $("cartList").addEventListener("click", (e) => {
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    if (inc) cartChange(inc.dataset.inc, +1);
    if (dec) cartChange(dec.dataset.dec, -1);
  });

  $("themeToggle").addEventListener("click", toggleTheme);
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
    if (!document.documentElement.dataset.theme) updateThemeButton();
  });

  $("searchInput").addEventListener("input", (e) => runFilter(e.target.value));

  setupCatIndex();
}

function setupCatIndex() {
  const bar = $("catIndex");
  const bubble = $("catIndexBubble");
  if (!bar) return;
  const items = [...bar.querySelectorAll("[data-cat-index]")];
  let dragging = false;
  let hideTimer = null;

  const arcMid = (items.length - 1) / 2;
  const ARC_AMP = 3;
  function arcX(i) {
    if (!arcMid) return 0;
    const t = 1 - Math.pow((i - arcMid) / arcMid, 2);
    return -ARC_AMP * t;
  }
  function layoutArc() {
    items.forEach((el, i) => { el.style.transform = `translateX(${arcX(i).toFixed(1)}px)`; el.style.opacity = ""; });
  }

  function showBar() {
    bar.classList.add("is-visible");
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { if (!dragging) bar.classList.remove("is-visible"); }, 1200);
  }
  const DOCK_R = 66;
  const DOCK_MAX = 0.4;
  function applyDock(y) {
    if (reduceMotion) return;
    items.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const c = (r.top + r.bottom) / 2;
      const t = Math.max(0, 1 - Math.abs(y - c) / DOCK_R);
      const boost = t * t * (3 - 2 * t);            // yumuşak geçiş (smoothstep)
      el.style.transform = `translateX(${arcX(i).toFixed(1)}px) scale(${(1 + DOCK_MAX * boost).toFixed(3)})`;
      el.style.opacity = (0.6 + 0.4 * boost).toFixed(2);
    });
  }
  function resetDock() { layoutArc(); }

  function itemAt(y) {
    let best = items[0], bestDist = Infinity;
    for (const el of items) {
      const r = el.getBoundingClientRect();
      if (y >= r.top && y <= r.bottom) return el;
      const d = Math.abs(y - (r.top + r.bottom) / 2);
      if (d < bestDist) { bestDist = d; best = el; }
    }
    return best;
  }

  function jump(el) {
    const section = document.querySelector('.ecat[data-cat="' + el.dataset.catIndex + '"]');
    if (!section || section.hidden) return;
    window.scrollTo(0, window.scrollY + section.getBoundingClientRect().top - 10);
    items.forEach((x) => x.classList.toggle("is-active", x === el));
    if (bubble) {
      const r = el.getBoundingClientRect();
      bubble.textContent = section.querySelector(".ecat__head h2").textContent;
      bubble.style.top = Math.round((r.top + r.bottom) / 2) + "px";
      bubble.hidden = false;
    }
  }

  bar.addEventListener("pointerdown", (e) => {
    dragging = true;
    bar.classList.add("is-visible");
    clearTimeout(hideTimer);
    bar.setPointerCapture?.(e.pointerId);
    applyDock(e.clientY);
    jump(itemAt(e.clientY));
  });
  bar.addEventListener("pointermove", (e) => {
    showBar();
    applyDock(e.clientY);
    if (!dragging) return;
    e.preventDefault();
    jump(itemAt(e.clientY));
  });
  bar.addEventListener("pointerenter", (e) => { showBar(); applyDock(e.clientY); });
  bar.addEventListener("pointerleave", () => { if (!dragging) resetDock(); });
  function end() { dragging = false; if (bubble) bubble.hidden = true; resetDock(); showBar(); }
  bar.addEventListener("pointerup", end);
  bar.addEventListener("pointercancel", end);

  function nearRightEdge(e) { return e.clientX >= window.innerWidth - 46; }
  window.addEventListener("pointermove", (e) => { if (nearRightEdge(e)) showBar(); }, { passive: true });
  window.addEventListener("pointerdown", (e) => { if (nearRightEdge(e)) showBar(); }, { passive: true });

  let ticking = false;
  function syncActive() {
    ticking = false;
    if (bar.hidden) return;
    let current = items[0];
    document.querySelectorAll(".ecat").forEach((sec) => {
      if (!sec.hidden && sec.getBoundingClientRect().top <= 80) {
        const el = items.find((x) => x.dataset.catIndex === sec.dataset.cat);
        if (el) current = el;
      }
    });
    items.forEach((x) => x.classList.toggle("is-active", x === current));
  }
  window.addEventListener("scroll", () => {
    showBar();
    if (!ticking) { ticking = true; requestAnimationFrame(syncActive); }
  }, { passive: true });
  layoutArc();
  syncActive();
}

let flashTimer = null;
let flashBtn = null;
function flashAdd(btn) {
  if (flashBtn) resetFlash();
  flashBtn = btn;
  btn.textContent = "✓ Eklendi";
  btn.classList.add("is-added");
  clearTimeout(flashTimer);
  flashTimer = setTimeout(resetFlash, 1200);
}
function resetFlash() {
  if (!flashBtn) return;
  flashBtn.textContent = "+ Ekle";
  flashBtn.classList.remove("is-added");
  flashBtn = null;
}

function openAllergens(item) {
  $("asItem").textContent = item.name;
  const tags = $("asTags");
  if (item.allergens && item.allergens.length) {
    tags.innerHTML = item.allergens.map((a) => `<span class="asheet__allergen">⚠ ${esc(a)}</span>`).join("");
    $("asWarn").textContent = "Bu ürün yukarıdaki alerjenleri içerebilir. Gıda hassasiyetiniz varsa lütfen sipariş öncesi personele danışın.";
  } else {
    tags.innerHTML = `<p class="asheet__none">Bu ürün için bilinen bir alerjen kaydı bulunmuyor.</p>`;
    $("asWarn").textContent = "Yine de üretim ortamında çapraz bulaşma olabilir. Emin değilseniz personele danışın.";
  }
  openAsheet();
}

function openAsheet() {
  const s = $("asheet");
  s.hidden = false;
  requestAnimationFrame(() => s.classList.add("is-open"));
  document.body.style.overflow = "hidden";
}

function closeAsheet() {
  const s = $("asheet");
  s.classList.remove("is-open");
  setTimeout(() => { s.hidden = true; document.body.style.overflow = ""; }, 280);
}

function togglePlate() {
  const bar = $("plateBar");
  const open = bar.getAttribute("aria-expanded") === "true";
  bar.setAttribute("aria-expanded", String(!open));
  $("plateDrawer").hidden = open;
}

function runFilter(query) {
  query = query.trim().toLocaleLowerCase("tr-TR");
  let anyVisible = false;

  document.querySelectorAll(".ecat").forEach((cat) => {
    let catHas = false;
    cat.querySelectorAll(".eline").forEach((line) => {
      const show = !query || line.dataset.search.toLocaleLowerCase("tr-TR").includes(query);
      line.hidden = !show;
      if (show) catHas = true;
    });
    cat.hidden = !catHas;
    if (catHas) anyVisible = true;
  });

  $("eempty").hidden = anyVisible;
  if ($("catIndex")) $("catIndex").hidden = query.length > 0;
}

const cart = {};

function cartAdd(item) {
  if (cart[item.id]) cart[item.id].qty++;
  else cart[item.id] = { item: item, qty: 1 };
  renderCart();
}

function cartChange(id, delta) {
  const line = cart[id];
  if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) delete cart[id];
  renderCart();
}

function cartClear() {
  for (const id in cart) delete cart[id];
  renderCart();
}

function cartTotals() {
  let count = 0, price = 0, calories = 0;
  for (const id in cart) {
    const line = cart[id];
    count += line.qty;
    price += line.qty * (line.item.price || 0);
    calories += line.qty * (line.item.calories || 0);
  }
  return { count, price, calories };
}

function renderCart() {
  const totals = cartTotals();
  const plate = $("plate");

  plate.hidden = totals.count === 0;
  if (totals.count === 0) {
    $("plateDrawer").hidden = true;
    $("plateBar").setAttribute("aria-expanded", "false");
  }

  $("cbCount").textContent = totals.count + " ürün";
  $("cbTotals").innerHTML = formatNumber(totals.calories) + " kcal · <b>" + formatPrice(totals.price) + "</b>";

  const lines = Object.values(cart);
  $("cartList").innerHTML = lines.map((line) => `<div class="cartline">
    <div class="cartline__info"><strong>${esc(line.item.name)}</strong><span>${formatNumber(line.item.calories)} kcal · <b>${formatPrice(line.item.price)}</b></span></div>
    <div class="qty">
      <button data-dec="${esc(line.item.id)}" aria-label="${esc(line.item.name)} adet azalt">−</button>
      <span aria-live="polite">${line.qty}</span>
      <button data-inc="${esc(line.item.id)}" aria-label="${esc(line.item.name)} adet artır">+</button>
    </div></div>`).join("");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
