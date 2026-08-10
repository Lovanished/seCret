(() => {
  "use strict";

  const SAVE_KEY = "secretcorn_save_v1";

  const CODEX = [
    { id: "corn_1", tag: "알갱이", text: "시간은 아무것도 묻지 않고 옥수수를 놓고 간다. 그것이 이 자리의 유일한 규칙이다." },
    { id: "exchange_open", tag: "교환소", text: "안경 너머로 셈을 하는 자가 있었다. 그는 옥수수를 받고, 반짝이는 것을 내주었다. 값은 언제나 정직했다고 한다." },
    { id: "glasses_bought", tag: "안경", text: "안경을 쓰면, 원래 없던 순서가 보인다고 했다. 숫자들은 흩어져 있지만, 흩어져 있지 않다." },
    { id: "dungeon_open", tag: "지하실", text: "학교 지하에는 원래 없던 계단이 있다. 그 계단은 도면에 없고, 청소부도 모른다." },
    { id: "dungeon_explore_5", tag: "교장 P", text: "지하실의 주인은 교장이라 불렸다. 그는 학생들 몰래 무언가를 '만들고' 있었다." },
    { id: "dungeon_explore_15", tag: "9", text: "그것에게는 이름이 없었다. 사람들은 그냥 숫자로 불렀다. 아홉 번째였기 때문이라고." },
    { id: "ritual_open", tag: "협상", text: "염소는 죄가 없다. 그것은 그저 마지막 식사였을 뿐. 콧수염을 쓰다듬으며 그는 웃었다." },
    { id: "ritual_use_5", tag: "바포메트", text: "간디는 염소고기를 먹고, 바포메트의 힘을 빌려 영혼을 모으는 재주를 얻었다고 전해진다." },
    { id: "console_secret", tag: "수정구", text: "간디 수정구, 간디워리어, 간디숭배자. 세 이름 모두 같은 것을 가리킨다고도, 아니라고도 한다. 숫자는 늘 셋이었다." }
  ];

  const SHOP_ITEMS = [
    { id: "glasses", name: "안경", icon: "👓", cost: 50 },
    { id: "gold", name: "금", icon: "🪙", cost: 200 },
    { id: "diamond", name: "다이아몬드", icon: "💎", cost: 500 }
  ];

  const DUNGEON_FLAVORS = [
    "젖은 돌벽을 따라 발소리가 울린다. 아무도 없는데도.",
    "칠판에 알 수 없는 표가 그려져 있다. 지워지지 않는다.",
    "차가운 공기 속에서 옥수수 냄새가 난다. 여기까지 들어온 걸까.",
    "누군가 문에 손톱으로 무언가를 새겨두었다. 세 글자다.",
    "불빛이 잠깐 흔들렸다. 아무도 건드리지 않았는데도.",
    "먼 곳에서 낮은 울음소리가 들린다. 염소인지, 아닌지는 알 수 없다."
  ];

  const RITUAL_FLAVORS = [
    "촛불 세 개가 동시에 눕는다. 협상은 늘 조용히 시작된다.",
    "무언가 정중하게 손을 내민다. 손이 아닐 수도 있다.",
    "옥수수를 내놓자, 저편에서 옅은 한숨이 들렸다.",
    "거래는 성사되었다. 무엇을 내주었는지는 나중에 알게 될 것이다."
  ];

  const state = {
    corn: 0,
    unlocked: { exchange: false, dungeon: false, ritual: false },
    shop: { glasses: 0, gold: 0, diamond: 0 },
    dungeonRuns: 0,
    ritualRuns: 0,
    soulFragments: 0,
    codexFound: []
  };

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) Object.assign(state, JSON.parse(raw));
    } catch (e) { /* 조용히 무시 */ }
    const visits = parseInt(localStorage.getItem("secretcorn_visits") || "0", 10) + 1;
    localStorage.setItem("secretcorn_visits", String(visits));
    const vEl = document.getElementById("visitCount");
    if (vEl) vEl.textContent = String(visits);
  }

  function save() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._h);
    toast._h = setTimeout(() => t.classList.remove("show"), 2600);
  }

  function unveil(id) {
    if (state.codexFound.includes(id)) return;
    state.codexFound.push(id);
    save();
    renderCodex();
  }

  function unlockSeal(key, label) {
    if (state.unlocked[key]) return;
    state.unlocked[key] = true;
    save();
    const el = document.getElementById(
      key === "exchange" ? "seal-exchange" : key === "dungeon" ? "seal-dungeon" : "seal-ritual"
    );
    if (el) el.setAttribute("data-unlocked", "true");
    toast(`무언가 열렸다 · ${label}`);
    renderShop();
  }

  /* ---------------- rendering ---------------- */

  function renderCorn() {
    document.getElementById("cornCount").textContent = Math.floor(state.corn).toLocaleString("ko-KR");
  }

  function renderShop() {
    const grid = document.getElementById("shopGrid");
    grid.innerHTML = "";
    SHOP_ITEMS.forEach(item => {
      const div = document.createElement("div");
      div.className = "shop-item";
      div.innerHTML = `
        <div class="shop-icon">${item.icon}</div>
        <h3>${item.name}</h3>
        <div class="owned">보유 ${state.shop[item.id]} · ${item.cost} 알갱이</div>
        <button class="btn buy-btn" data-id="${item.id}">교환하기</button>
      `;
      grid.appendChild(div);
    });
    grid.querySelectorAll(".buy-btn").forEach(btn => {
      btn.addEventListener("click", () => buyItem(btn.dataset.id));
    });
  }

  function renderCodex() {
    document.getElementById("codexTotal").textContent = String(CODEX.length);
    document.getElementById("codexCount").textContent = String(state.codexFound.length);
    const list = document.getElementById("codexList");
    list.innerHTML = "";
    CODEX.forEach(entry => {
      const found = state.codexFound.includes(entry.id);
      const div = document.createElement("div");
      div.className = "codex-entry" + (found ? " found" : "");
      div.innerHTML = found
        ? `<span class="tag">${entry.tag}</span>${entry.text}`
        : `<span class="tag">???</span>아직 밝혀지지 않았다.`;
      list.appendChild(div);
    });
  }

  function renderAll() {
    renderCorn();
    ["exchange", "dungeon", "ritual"].forEach(k => {
      const el = document.getElementById(
        k === "exchange" ? "seal-exchange" : k === "dungeon" ? "seal-dungeon" : "seal-ritual"
      );
      if (el) el.setAttribute("data-unlocked", state.unlocked[k] ? "true" : "false");
    });
    renderShop();
    renderCodex();
  }

  /* ---------------- economy ---------------- */

  function buyItem(id) {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item || state.corn < item.cost) { toast("알갱이가 부족하다"); return; }
    state.corn -= item.cost;
    state.shop[id] += 1;
    if (id === "glasses" && state.shop.glasses === 1) unveil("glasses_bought");
    save();
    renderCorn();
    renderShop();
  }

  function exploreDungeon() {
    const COST = 10;
    if (state.corn < COST) { toast("알갱이가 부족하다"); return; }
    state.corn -= COST;
    state.dungeonRuns += 1;
    const log = document.getElementById("dungeonLog");
    const p = document.createElement("p");
    p.textContent = DUNGEON_FLAVORS[Math.floor(Math.random() * DUNGEON_FLAVORS.length)];
    log.prepend(p);
    while (log.children.length > 6) log.removeChild(log.lastChild);
    if (state.dungeonRuns === 5) unveil("dungeon_explore_5");
    if (state.dungeonRuns === 15) unveil("dungeon_explore_15");
    save();
    renderCorn();
  }

  function performRitual() {
    const COST = 66;
    if (state.corn < COST) { toast("알갱이가 부족하다"); return; }
    state.corn -= COST;
    state.ritualRuns += 1;
    state.soulFragments += 1;
    const log = document.getElementById("ritualLog");
    const p = document.createElement("p");
    p.textContent = RITUAL_FLAVORS[Math.floor(Math.random() * RITUAL_FLAVORS.length)]
      + ` (영혼 조각 ${state.soulFragments})`;
    log.prepend(p);
    while (log.children.length > 6) log.removeChild(log.lastChild);
    if (state.ritualRuns === 5) unveil("ritual_use_5");
    save();
    renderCorn();
  }

  /* ---------------- hidden mechanisms ---------------- */

  let keyBuffer = "";
  window.addEventListener("keydown", (e) => {
    if (e.key.length === 1) {
      keyBuffer = (keyBuffer + e.key).slice(-12);
      if (!state.unlocked.exchange && keyBuffer.includes("0123")) {
        unlockSeal("exchange", "교환소");
        unveil("exchange_open");
      }
      if (!state.unlocked.dungeon && keyBuffer.includes("8765")) {
        unlockSeal("dungeon", "던전");
        unveil("dungeon_open");
      }
    }
  });

  (function setupCornerRitual() {
    const glyph = document.querySelector(".corner-br");
    if (!glyph) return;
    let clicks = 0;
    let timer = null;
    glyph.addEventListener("click", () => {
      clicks += 1;
      clearTimeout(timer);
      timer = setTimeout(() => { clicks = 0; }, 2000);
      if (clicks >= 6) {
        clicks = 0;
        if (!state.unlocked.ritual) {
          unlockSeal("ritual", "영혼 협상");
          unveil("ritual_open");
        }
      }
    });
  })();

  // 콘솔을 들여다보는 자를 위한 문. 존재조차 언급되지 않는다.
  Object.defineProperty(window, "간디의수정구", {
    value: function () {
      unveil("console_secret");
      save();
      return "무언가 반짝였다.";
    },
    writable: false
  });

  /* ---------------- boot ---------------- */

  function tick() {
    state.corn += 1;
    renderCorn();
    save();
  }

  function init() {
    load();
    renderAll();
    document.getElementById("exploreBtn").addEventListener("click", exploreDungeon);
    document.getElementById("ritualBtn").addEventListener("click", performRitual);
    setInterval(tick, 1000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
