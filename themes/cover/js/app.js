const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
async function getMenu() {
  return QRM.data.menu;
}
function $(id) {
  return document.getElementById(id);
}

const COLORS = ["#7a2e3a", "#2f5d4a", "#2b5566", "#5a3a6e", "#8a5a1f", "#334a7a", "#95461f", "#3f6b3a"];

function colorFor(name) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return COLORS[sum % COLORS.length];
}

function monogram(name) {
  const words = name.trim().split(/\s+/);
  const first = words[0] ? words[0][0] : "";
  const second = words[1] ? words[1][0] : "";
  return (first + second).toLocaleUpperCase("tr-TR");
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
const BADGE_CLASS = { "Şefin Seçimi": "chef", "Popüler": "pop", "Yeni": "new" };

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
let allCategories = [];
 currentItem = null;

async function start() {
  const menu = await getMenu();
  allCategories = menu.categories;

  menu.categories.forEach((cat) => {
    cat.items.forEach((item) => {
      item.category = cat.name;
      itemsById[item.id] = item;
    });
  });

  renderMenu(menu);
  setupCover();
  setupEvents();
  renderCart();
  updateThemeButton();
}

function badgeHTML(highlight) {
  if (!highlight) return "";
  const star = highlight === "Şefin Seçimi" ? "★ " : "";
  return `<span class="badge badge--${BADGE_CLASS[highlight]}">${star}${highlight}</span>`;
}

function dietHTML(diet) {
  if (!diet || !diet.length) return "";
  const icons = diet.map((d) => `<span title="${d}">${DIET_ICON[d] || ""}</span>`).join("");
  return `<span class="diet">${icons}</span>`;
}

function cardHTML(item) {
  return `<button class="card" data-item data-id="${esc(item.id)}">
    <span class="card__tile" style="background:${colorFor(item.name)}" aria-hidden="true">${badgeHTML(item.highlight)}${monogram(item.name)}<span class="card__kcal">${formatKcal(item.calories)}</span>${dietHTML(item.diet)}</span>
    <span class="card__body"><span class="card__name">${esc(item.name)}</span><span class="card__price">${formatPrice(item.price)}</span></span>
  </button>`;
}

function renderMenu(menu) {
  const categories = menu.categories;
  const cats = categories.map((cat) => {
    const icon = CATEGORY_ICON[cat.name] || monogram(cat.name);
    return `<button class="ccat" data-cover-cat="${esc(cat.id)}">
      <span class="ccat__tile" style="background:${colorFor(cat.name)}" aria-hidden="true">${icon}</span>
      <span class="ccat__info"><strong>${esc(cat.name)}</strong><small>${cat.items.length} ürün</small></span>
    </button>`;
  }).join("");

  const panels = categories.map((cat) => {
    const cards = cat.items.map(cardHTML).join("");
    return `<div class="cover__panel" data-cover-panel="${esc(cat.id)}" hidden>
      <div class="cover__head"><span>${cat.items.length} ürün</span><h1>${categoryIcon(cat.name)}${esc(cat.name)}</h1></div>
      <div class="grid">${cards}</div>
    </div>`;
  }).join("");

  $("app").innerHTML = `
    <div class="cover">
      <header class="cover__bar">
        <button class="cover__back" id="coverBack" type="button" hidden aria-label="Geri">←</button>
        <div class="cover__brand">
          <span class="cover__logo">
            <img src="logo.png" alt="${esc(menu.restaurantName)} logosu" onerror="this.remove();document.getElementById('logoFb').hidden=false">
            <span id="logoFb" hidden aria-hidden="true">${monogram(menu.restaurantName)}</span>
          </span>
          <span class="cover__brand-text"><strong>${esc(menu.restaurantName)}</strong><small>${esc(menu.menuName)}</small></span>
        </div>
        <button class="cover__btn" id="searchBtn" type="button" aria-label="Ürün ara">${SEARCH_ICON}</button>
        <button class="cover__btn" id="themeToggle" type="button" aria-label="Tema değiştir"></button>
      </header>
      <main>
        <section class="cover__home" id="coverHome">
          <div class="cover__head"><span>Keşfet</span><h1>Kategoriler</h1></div>
          ${menu.description ? `<p class="cover__desc">${esc(menu.description)}</p>` : ""}
          <div class="cover__cats">${cats}</div>
        </section>
        <section class="cover__cat" id="coverCat" hidden>${panels}</section>
      </main>
      <footer>Önizleme · Salihli Belediyesi kimliği · test verisi</footer>
    </div>`;
}

function playIntro(container) {
  if (reduceMotion) return;
  container.querySelectorAll(".card").forEach((card, i) => {
    const delay = Math.min(i, 12) * 0.035;
    card.style.animation = "none";
    void card.offsetWidth; // animasyonu baştan oynatmak için reflow
    card.style.animation = `cardIn .42s var(--ease) ${delay}s both`;
  });
}

function setupCover() {
  document.querySelectorAll("[data-cover-cat]").forEach((btn) => {
    btn.addEventListener("click", () => showCategory(btn.dataset.coverCat));
  });
  $("coverBack").addEventListener("click", showHome);
}

function showCategory(catId) {
  $("coverHome").hidden = true;
  $("coverCat").hidden = false;
  $("coverBack").hidden = false;

  let target = null;
  document.querySelectorAll("[data-cover-panel]").forEach((panel) => {
    const show = panel.dataset.coverPanel === catId;
    panel.hidden = !show;
    if (show) target = panel;
  });

  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  if (target) playIntro(target);
}

function showHome() {
  $("coverCat").hidden = true;
  $("coverHome").hidden = false;
  $("coverBack").hidden = true;
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}

function setupEvents() {
  document.querySelectorAll("[data-item]").forEach((btn) => {
    btn.addEventListener("click", () => openItem(itemsById[btn.dataset.id]));
  });

  $("themeToggle").addEventListener("click", toggleTheme);
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
    if (!document.documentElement.dataset.theme) updateThemeButton();
  });

  ["itemModal", "allergenModal", "cartModal", "searchModal"].forEach((id) => {
    $(id).querySelectorAll("[data-close]").forEach((el) => {
      el.addEventListener("click", () => closeModal($(id)));
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = [...document.querySelectorAll(".modal.is-open")];
    if (open.length) closeModal(open[open.length - 1]);
  });

  $("btnAdd").addEventListener("click", addCurrentToPlate);
  $("btnAllergens").addEventListener("click", () => openAllergens(currentItem));

  $("cbOpen").addEventListener("click", () => openModal($("cartModal")));
  $("btnClear").addEventListener("click", cartClear);
  $("cartList").addEventListener("click", (e) => {
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    if (inc) cartChange(inc.dataset.inc, +1);
    if (dec) cartChange(dec.dataset.dec, -1);
  });

  $("searchBtn").addEventListener("click", openSearch);
  $("searchInput").addEventListener("input", (e) => runSearch(e.target.value));
  $("searchResults").addEventListener("click", (e) => {
    const catBtn = e.target.closest("[data-scat]");
    if (catBtn) {
      closeModal($("searchModal"));
      setTimeout(() => goToCategory(catBtn.dataset.scat), 280);
      return;
    }
    const btn = e.target.closest("[data-sid]");
    if (!btn) return;
    const item = itemsById[btn.dataset.sid];
    closeModal($("searchModal"));
    setTimeout(() => openItem(item), 150);
  });
}

function openModal(el) {
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add("is-open"));
  document.body.style.overflow = "hidden";
  el.querySelector("[data-close]")?.focus();
}

function closeModal(el) {
  el.classList.remove("is-open");
  setTimeout(() => {
    el.hidden = true;
    // başka açık modal kalmadıysa sayfa kaydırmayı geri aç
    if (!document.querySelector(".modal.is-open")) document.body.style.overflow = "";
  }, 260);
}

let addResetTimer = null;

function openItem(item) {
  currentItem = item;

  const media = $("mMedia");
  media.textContent = monogram(item.name);
  media.style.background = colorFor(item.name);

  $("mCat").textContent = item.category;
  $("mName").textContent = item.name;

  const tags = [];
  if (item.highlight) tags.push(`<span class="tag tag--${BADGE_CLASS[item.highlight]}">${item.highlight}</span>`);
  (item.diet || []).forEach((d) => tags.push(`<span class="tag tag--diet">${DIET_ICON[d] || ""} ${d}</span>`));
  tags.push(`<span class="tag tag--kcal">${formatKcal(item.calories)}</span>`);
  $("mTags").innerHTML = tags.join("");

  $("mPrice").textContent = formatPrice(item.price);

  const desc = $("mDesc");
  desc.textContent = item.description || "";
  desc.style.display = item.description ? "" : "none";

  resetAddButton();
  openModal($("itemModal"));
}

function addCurrentToPlate() {
  if (!currentItem) return;
  cartAdd(currentItem);

  const btn = $("btnAdd");
  btn.textContent = "Tabağıma Eklendi ✓";
  btn.classList.add("is-added");
  clearTimeout(addResetTimer);
  addResetTimer = setTimeout(resetAddButton, 1400);
}

function resetAddButton() {
  const btn = $("btnAdd");
  btn.textContent = "Tabağıma Ekle";
  btn.classList.remove("is-added");
}

function openAllergens(item) {
  $("alItem").textContent = item.name;
  const tags = $("alTags");
  const warn = $("alWarn");

  if (item.allergens && item.allergens.length) {
    tags.innerHTML = item.allergens.map((a) => `<span class="allergen">⚠ ${esc(a)}</span>`).join("");
    warn.textContent = "Bu ürün yukarıdaki alerjenleri içerebilir. Gıda hassasiyetiniz varsa lütfen sipariş öncesi personele danışın.";
  } else {
    tags.innerHTML = `<p class="amodal__none">Bu ürün için bilinen bir alerjen kaydı bulunmuyor.</p>`;
    warn.textContent = "Yine de üretim ortamında çapraz bulaşma olabilir. Emin değilseniz personele danışın.";
  }

  openModal($("allergenModal"));
}

function openSearch() {
  $("searchInput").value = "";
  runSearch("");
  openModal($("searchModal"));
  setTimeout(() => $("searchInput").focus(), 80);
}

function runSearch(query) {
  query = query.trim().toLocaleLowerCase("tr-TR");

  let cats = [], items = [];
  if (query) {
    cats = allCategories.filter((c) => c.name.toLocaleLowerCase("tr-TR").includes(query));
    items = Object.values(itemsById).filter((item) => {
      const text = (item.name + " " + (item.description || "") + " " + item.category).toLocaleLowerCase("tr-TR");
      return text.includes(query);
    }).slice(0, 30);
  }

  const catRows = cats.map((c) => `<button class="sresult sresult--cat" data-scat="${esc(c.id)}">
      <span class="sresult__mono" style="background:${colorFor(c.name)}">${CATEGORY_ICON[c.name] || monogram(c.name)}</span>
      <span class="sresult__info"><strong>${esc(c.name)}</strong><span>Kategori · ${c.items.length} ürün</span></span>
      <span class="sresult__go" aria-hidden="true">→</span>
    </button>`).join("");

  const itemRows = items.map((item) => `<button class="sresult" data-sid="${esc(item.id)}">
      <span class="sresult__mono" style="background:${colorFor(item.name)}">${monogram(item.name)}</span>
      <span class="sresult__info"><strong>${esc(item.name)}</strong><span>${categoryIcon(item.category)}${esc(item.category)} · ${formatKcal(item.calories)}</span></span>
      <span class="sresult__price">${formatPrice(item.price)}</span>
    </button>`).join("");

  $("searchResults").innerHTML = catRows + itemRows;
  $("searchEmpty").hidden = !(query && !cats.length && !items.length);
}

function goToCategory(catId) {
  showCategory(catId);
}

const cart = {};
let lastCount = 0;
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
  const bar = $("cartbar");

  if (totals.count > 0) {
    if (bar.hidden) {
      bar.hidden = false;
      if (!reduceMotion) {
        bar.classList.remove("enter");
        void bar.offsetWidth;
        bar.classList.add("enter");
      }
    }
  } else {
    bar.hidden = true;
  }

  $("cbCount").textContent = totals.count + " ürün";
  $("cbTotals").innerHTML = formatNumber(totals.calories) + " kcal · <b>" + formatPrice(totals.price) + "</b>";

  if (!reduceMotion && !bar.hidden && totals.count > lastCount) {
    const el = $("cbCount");
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }
  lastCount = totals.count;

  const list = $("cartList");
  const lines = Object.values(cart);
  if (!lines.length) {
    list.innerHTML = `<p class="cart__empty"><span class="cart__empty-ic">🍽️</span>Tabağın henüz boş.<small>Beğendiğin ürünleri ekle; kalori ve tutar burada toplansın.</small></p>`;
  } else {
    list.innerHTML = lines.map((line) => `<div class="cartline">
      <div class="cartline__info"><strong>${esc(line.item.name)}</strong><span>${formatNumber(line.item.calories)} kcal · <b>${formatPrice(line.item.price)}</b></span></div>
      <div class="qty">
        <button data-dec="${esc(line.item.id)}" aria-label="${esc(line.item.name)} adet azalt">−</button>
        <span aria-live="polite">${line.qty}</span>
        <button data-inc="${esc(line.item.id)}" aria-label="${esc(line.item.name)} adet artır">+</button>
      </div></div>`).join("");
  }

  $("cartKcal").textContent = formatNumber(totals.calories) + " kcal";
  $("cartMoney").textContent = formatPrice(totals.price);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
