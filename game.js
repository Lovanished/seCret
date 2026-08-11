(() => {
  "use strict";

  const SAVE_KEY = "secretcorn_save_v3";

  /* ---------------- lightweight checksum (평문 정답을 소스에 남기지 않기 위함) ---------------- */
  function hashStr(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(16);
  }

  /* ---------------- gate registry ---------------- */
  const GATES = [
    { id: "dial",   rune: "🔒", name: "자물쇠" },
    { id: "lens",   rune: "👓", name: "안경" },
    { id: "scale",  rune: "⚖",  name: "저울" },
    { id: "cards",  rune: "🂠", name: "패" },
    { id: "sigil",  rune: "⛧",  name: "표식" },
    { id: "timing", rune: "🕕", name: "시계" },
    { id: "maze",   rune: "▦",  name: "도면" },
    { id: "kernel", rune: "?",  name: "???" },
    { id: "riddle", rune: "❦",  name: "수수께끼" }
  ];

  const MAIN_MAP = { dial: "exchange", lens: "dungeon", scale: "ritual" };

  const CODEX = [
    { id: "codex_dial",   tag: "교환소",   text: "안경 너머로 셈을 하는 자가 있었다. 옥수수를 받고, 반짝이는 것을 내주었다." },
    { id: "codex_lens",   tag: "지하실",   text: "학교 지하에는 원래 없던 계단이 있다. 도면에도, 청소부의 기억에도 없다." },
    { id: "codex_scale",  tag: "협상",     text: "염소는 죄가 없다. 그것은 그저 마지막 식사였을 뿐. 콧수염을 쓰다듬으며 그는 웃었다." },
    { id: "codex_cards",  tag: "협상의 격", text: "그는 금도, 다이아몬드도 물리쳤다. 오직 염소 한 마리만이 그의 마음을 움직였다." },
    { id: "codex_sigil",  tag: "바포메트", text: "다섯 개의 뿔을 가진 표식. 한 번의 선으로 그려야 응답한다고 했다." },
    { id: "codex_timing", tag: "숫자",     text: "666은 우연히 멈추는 숫자가 아니다. 노려서 멈춰야 하는 숫자다." },
    { id: "codex_maze",   tag: "9",        text: "그것에게는 이름이 없었다. 사람들은 그냥 숫자로 불렀다. 아홉 번째였기 때문이라고." },
    { id: "codex_kernel", tag: "흐릿한 것", text: "모든 것이 또렷하게 보이는 곳에는, 오히려 아무것도 숨지 않는다." },
    { id: "codex_riddle", tag: "간디 수정구", text: "간디 수정구, 간디워리어, 간디숭배자. 세 이름 모두 같은 것을 가리킨다고도, 아니라고도 한다." },
    { id: "corn_1",             tag: "알갱이",   text: "시간은 아무것도 묻지 않고 옥수수를 놓고 간다. 그것이 이 자리의 유일한 규칙이다." },
    { id: "glasses_bought",     tag: "안경",     text: "안경을 쓰면, 원래 없던 순서가 보인다고 했다. 숫자들은 흩어져 있지만, 흩어져 있지 않다." },
    { id: "dungeon_explore_5",  tag: "교장 P",   text: "지하실의 주인은 교장이라 불렸다. 그는 학생들 몰래 무언가를 '만들고' 있었다." },
    { id: "dungeon_explore_15", tag: "9의 기원", text: "9는 태어난 것이 아니라 만들어졌다. 실패작들 중, 유일하게 눈을 뜬 것이었다." },
    { id: "ritual_use_5",       tag: "바포메트", text: "간디는 염소고기를 먹고, 바포메트의 힘을 빌려 영혼을 모으는 재주를 얻었다고 전해진다." }
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

  const HINTS = {
    dial: "생일은 숫자로 남는다. 아무것도 아니었던 자리에서 시작해, 하나씩, 순서대로.",
    lens: "안경을 쓰면 보이지 않던 색이 보인다. 색마다 다른 것을 감춘다.",
    scale: "바포메트의 수를 저울 위에 그대로 올려라. 가진 것을 전부 쓸 필요는 없다.",
    cards: "그가 진짜 원했던 것은 반짝이는 것이 아니었다.",
    sigil: "다섯 개의 뿔을 한 번에 이어야 한다. 순서를 알려주는 말이 어딘가에 있다.",
    timing: "숫자는 계속 흐른다. 그중 딱 하나, 야수의 수에서 멈춰라.",
    maze: "지하 도면에는 가짜 길이 많다. 잘못 들면 처음으로 되돌아간다.",
    kernel: "화면 어딘가, 흐릿하게 숨쉬는 알갱이 하나가 있다.",
    riddle: "매일 찾아오지만, 아무도 셈하지 못하는 것이 있다."
  };

  const state = {
    corn: 0,
    gates: {},
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

  function save() { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }

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

  /* ---------------- modal ---------------- */
  const backdrop = () => document.getElementById("modalBackdrop");
  const modalContent = () => document.getElementById("modalContent");

  function openModal() { backdrop().classList.add("show"); }
  function closeModal() { backdrop().classList.remove("show"); modalContent().innerHTML = ""; }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("modalClose").addEventListener("click", closeModal);
    backdrop().addEventListener("click", (e) => { if (e.target === backdrop()) closeModal(); });
  });

  /* ---------------- rendering ---------------- */

  function renderCorn() {
    document.getElementById("cornCount").textContent = Math.floor(state.corn).toLocaleString("ko-KR");
  }

  function renderGates() {
    const grid = document.getElementById("gateGrid");
    grid.innerHTML = "";
    GATES.forEach(g => {
      const solved = !!state.gates[g.id];
      const div = document.createElement("div");
      div.className = "gate";
      div.setAttribute("data-solved", solved ? "true" : "false");
      div.innerHTML = `<div class="gate-rune">${solved ? g.rune : "?"}</div><div class="gate-name">${solved ? g.name : "???"}</div>`;
      div.addEventListener("click", () => { if (!state.gates[g.id]) openGate(g.id); });
      grid.appendChild(div);
    });
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
    grid.querySelectorAll(".buy-btn").forEach(btn => btn.addEventListener("click", () => buyItem(btn.dataset.id)));
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

  function showReveal(key) {
    if (state.unlocked[key]) return;
    state.unlocked[key] = true;
    save();
    const el = document.getElementById("reveal-" + key);
    if (el) el.classList.add("show");
  }

  function renderAll() {
    renderCorn();
    renderGates();
    ["exchange", "dungeon", "ritual"].forEach(k => {
      const el = document.getElementById("reveal-" + k);
      if (el && state.unlocked[k]) el.classList.add("show");
    });
    renderShop();
    renderCodex();
  }

  /* ---------------- gate resolution ---------------- */

  function solveGate(id) {
    if (state.gates[id]) return;
    state.gates[id] = true;
    save();
    renderGates();
    unveil("codex_" + id);
    if (MAIN_MAP[id]) showReveal(MAIN_MAP[id]);
    toast("문이 열렸다");
    setTimeout(closeModal, 500);
  }

  function feedback(msg) {
    const el = modalContent().querySelector(".mg-feedback");
    if (el) el.textContent = msg;
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
    p.textContent = RITUAL_FLAVORS[Math.floor(Math.random() * RITUAL_FLAVORS.length)] + ` (영혼 조각 ${state.soulFragments})`;
    log.prepend(p);
    while (log.children.length > 6) log.removeChild(log.lastChild);
    if (state.ritualRuns === 5) unveil("ritual_use_5");
    save();
    renderCorn();
  }

  /* ================= 9 gimmicks — 각각 소재/숫자와 직접 연결 ================= */

  function openGate(id) {
    switch (id) {
      case "dial": return mgDial();
      case "lens": return mgLens();
      case "scale": return mgScale();
      case "cards": return mgCards();
      case "sigil": return mgSigil();
      case "timing": return mgTiming();
      case "maze": return mgMaze();
      case "kernel": return mgKernelInfo();
      case "riddle": return mgRiddle();
    }
  }

  /* 1) 자물쇠 — 생일(0123)을 유추해야 하는 네 자리 다이얼 */
  const DIAL_ANSWER_HASH = "7c537f45";

  function mgDial() {
    modalContent().innerHTML = `
      <h3 class="mg-title">자물쇠</h3>
      <p class="mg-desc">낡은 종이에 이렇게 적혀 있다.<br>
      "숫자는 넷. 처음은 아무것도 아니었던 자리, 그 다음은 하나, 또 하나, 또 하나. 있는 그대로 순서를 세워라."</p>
      <div class="mg-dial-row" id="dialRow"></div>
      <div class="mg-actions">
        <button class="btn" id="dialSubmit">시도하기</button>
        <span class="mg-feedback"></span>
      </div>
    `;
    const row = document.getElementById("dialRow");
    const values = [0, 0, 0, 0];
    values.forEach((v, i) => {
      const d = document.createElement("div");
      d.className = "mg-dial";
      d.innerHTML = `<button data-i="${i}" data-dir="1">▲</button><div class="mg-dial-val" id="dv${i}">0</div><button data-i="${i}" data-dir="-1">▼</button>`;
      row.appendChild(d);
    });
    row.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.i, 10);
        const dir = parseInt(btn.dataset.dir, 10);
        values[i] = (values[i] + dir + 10) % 10;
        document.getElementById("dv" + i).textContent = String(values[i]);
      });
    });
    document.getElementById("dialSubmit").addEventListener("click", () => {
      const code = values.join("");
      if (hashStr(code) === DIAL_ANSWER_HASH) solveGate("dial");
      else feedback("걸쇠가 꿈쩍하지 않는다.");
    });
    openModal();
  }

  /* 2) 안경 — 색안경으로만 걸러지는 8765를 찾아내는 시각 암호 */
  const LENS_ANSWER_HASH = "7c57d9c9";
  const LENS_COLORS = [
    { key: "red", css: "#b34a3c", label: "붉은 렌즈" },
    { key: "blue", css: "#3c6bb3", label: "푸른 렌즈" },
    { key: "gold", css: "#c9a24b", label: "금빛 렌즈" },
    { key: "violet", css: "#6b4a8f", label: "보랏빛 렌즈" }
  ];

  function mgLens() {
    modalContent().innerHTML = `
      <h3 class="mg-title">안경</h3>
      <p class="mg-desc">숫자들이 뒤엉켜 있다. 맞는 렌즈를 쓰면, 그중 하나의 색만 또렷해질 것이다.</p>
      <div class="mg-lens-field" id="lensField"></div>
      <div class="mg-actions" id="lensButtons"></div>
      <div class="mg-actions">
        <input type="text" class="mg-riddle-input" id="lensInput" placeholder="드러난 네 자리 숫자" style="max-width:10rem;display:inline-block;" />
        <button class="btn" id="lensSubmit">말하기</button>
        <span class="mg-feedback"></span>
      </div>
    `;
    const field = document.getElementById("lensField");
    field.style.cssText = "display:grid;grid-template-columns:repeat(8,1fr);gap:6px;background:#0c0a08;border:1px solid var(--line);padding:10px;font-family:var(--serif-display);font-size:1rem;text-align:center;user-select:none;";

    const answerDigits = ["8", "7", "6", "5"];
    const answerColor = "gold";
    const answerSlots = [10, 11, 12, 13]; // 8x5 그리드 중 두 번째 줄 정중앙 네 칸
    const totalCells = 40;
    const cells = [];
    for (let i = 0; i < totalCells; i++) {
      const isAnswer = answerSlots.includes(i);
      const color = isAnswer ? answerColor : LENS_COLORS[Math.floor(Math.random() * LENS_COLORS.length)].key;
      const digit = isAnswer ? answerDigits[answerSlots.indexOf(i)] : String(Math.floor(Math.random() * 10));
      cells.push({ color, digit });
    }
    let activeLens = null;
    function draw() {
      field.innerHTML = "";
      cells.forEach(c => {
        const span = document.createElement("span");
        span.textContent = c.digit;
        const colorDef = LENS_COLORS.find(l => l.key === c.color);
        span.style.color = colorDef.css;
        if (activeLens && c.color !== activeLens) span.style.opacity = "0.08";
        else span.style.opacity = "1";
        field.appendChild(span);
      });
    }
    draw();
    const btnWrap = document.getElementById("lensButtons");
    LENS_COLORS.forEach(l => {
      const b = document.createElement("button");
      b.className = "btn small";
      b.style.borderColor = l.css;
      b.style.color = l.css;
      b.textContent = l.label;
      b.addEventListener("click", () => { activeLens = (activeLens === l.key) ? null : l.key; draw(); });
      btnWrap.appendChild(b);
    });
    document.getElementById("lensSubmit").addEventListener("click", () => {
      const v = document.getElementById("lensInput").value.trim();
      if (hashStr(v) === LENS_ANSWER_HASH) solveGate("lens");
      else feedback("아니다. 다른 렌즈를 써 보라.");
    });
    openModal();
  }

  /* 3) 저울 — 바포메트의 수(666)를 정확히 올려야 하는 저울 */
  function mgScale() {
    modalContent().innerHTML = `
      <h3 class="mg-title">저울</h3>
      <p class="mg-desc">저울은 딱 하나의 숫자에만 응답한다 — 야수의 수, 666. 가진 조각 중 일부만 골라 그 무게를 정확히 맞춰라. 조각은 한 번씩만 쓸 수 있다.</p>
      <div class="mg-scale">
        <div>
          <div class="mg-pan" id="panL"></div>
          <div class="mg-pan-label">저울 위 · <span id="sumL">0</span> / 666</div>
        </div>
      </div>
      <div class="mg-weights" id="weightBtns"></div>
      <div class="mg-actions">
        <button class="btn small" id="scaleReset">초기화</button>
        <span class="mg-feedback"></span>
      </div>
    `;
    const PIECES = [
      { name: "옥수수", icon: "🌽", v: 1 },
      { name: "콧수염", icon: "〜", v: 6 },
      { name: "안경", icon: "👓", v: 5 },
      { name: "영혼 조각", icon: "✦", v: 50 },
      { name: "금", icon: "🪙", v: 60 },
      { name: "다이아몬드", icon: "💎", v: 100 },
      { name: "수정구", icon: "🔮", v: 200 },
      { name: "염소", icon: "🐐", v: 500 }
    ];
    let sum = 0;
    const used = new Set();
    const wrap = document.getElementById("weightBtns");
    PIECES.forEach((p, i) => {
      const b = document.createElement("button");
      b.className = "mg-weight-btn";
      b.innerHTML = `${p.icon}<br><span style="font-size:0.55rem;">${p.name} ${p.v}</span>`;
      b.addEventListener("click", () => {
        if (used.has(i)) return;
        used.add(i);
        sum += p.v;
        b.style.opacity = "0.25";
        b.disabled = true;
        redraw();
      });
      wrap.appendChild(b);
    });
    function redraw() {
      document.getElementById("sumL").textContent = String(sum);
      document.getElementById("panL").innerHTML = [...used].map(i => PIECES[i].icon).join(" ");
      if (sum === 666) solveGate("scale");
      else if (sum > 666) feedback("너무 무겁다. 초기화하고 다시.");
    }
    document.getElementById("scaleReset").addEventListener("click", () => {
      sum = 0; used.clear();
      wrap.querySelectorAll("button").forEach(b => { b.disabled = false; b.style.opacity = "1"; });
      redraw();
      feedback("");
    });
    openModal();
  }

  /* 4) 패 — 협상에서 그가 진짜 원한 것을 골라내는 논리 퍼즐 */
  function mgCards() {
    modalContent().innerHTML = `
      <h3 class="mg-title">패</h3>
      <p class="mg-desc">여섯 개의 제안이 뒤집혀 있다. 그가 진짜로 받아들인 제안은 단 하나뿐이다.</p>
      <div class="mg-cards" id="mgCards" style="grid-template-columns:repeat(3,1fr);"></div>
      <div class="mg-actions"><span class="mg-feedback"></span></div>
    `;
    const OFFERS = [
      { text: "염소 한 마리", correct: true },
      { text: "금 열 냥", correct: false },
      { text: "다이아몬드 한 개", correct: false },
      { text: "가짜 약속", correct: false },
      { text: "영혼 한 조각", correct: false },
      { text: "콧수염을 만질 권리", correct: false }
    ];
    const order = shuffle(OFFERS);
    const grid = document.getElementById("mgCards");
    let locked = false;
    order.forEach(offer => {
      const c = document.createElement("div");
      c.className = "mg-card";
      c.style.fontSize = "0.75rem";
      c.style.padding = "0.4rem";
      c.textContent = "";
      c.addEventListener("click", () => {
        if (locked) return;
        c.classList.add("flipped");
        c.textContent = offer.text;
        if (offer.correct) {
          locked = true;
          solveGate("cards");
        } else {
          locked = true;
          feedback("그는 고개를 저었다. 패가 다시 섞인다.");
          setTimeout(() => {
            grid.innerHTML = "";
            const reshuffled = shuffle(OFFERS);
            reshuffled.forEach(o2 => {
              const c2 = document.createElement("div");
              c2.className = "mg-card";
              c2.style.fontSize = "0.75rem";
              c2.style.padding = "0.4rem";
              c2.addEventListener("click", arguments.callee._h);
              grid.appendChild(c2);
            });
            attachCardHandlers(reshuffled);
            locked = false;
          }, 900);
        }
      });
      grid.appendChild(c);
    });

    function attachCardHandlers(list) {
      const nodes = grid.querySelectorAll(".mg-card");
      nodes.forEach((node, idx) => {
        const offer = list[idx];
        node.addEventListener("click", () => {
          if (locked) return;
          node.classList.add("flipped");
          node.textContent = offer.text;
          if (offer.correct) { locked = true; solveGate("cards"); }
          else {
            locked = true;
            feedback("그는 고개를 저었다. 패가 다시 섞인다.");
            setTimeout(() => {
              grid.innerHTML = "";
              const again = shuffle(OFFERS);
              again.forEach(o => {
                const n = document.createElement("div");
                n.className = "mg-card";
                n.style.fontSize = "0.75rem";
                n.style.padding = "0.4rem";
                grid.appendChild(n);
              });
              attachCardHandlers(again);
              locked = false;
            }, 900);
          }
        });
      });
    }
    openModal();
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* 5) 표식 — 바포메트의 오각별을 지시된 순서로 한 번에 그리기 */
  function mgSigil() {
    modalContent().innerHTML = `
      <h3 class="mg-title">표식</h3>
      <p class="mg-desc">"위쪽 뿔에서 시작해, 오른쪽 아래로, 왼쪽 위로, 오른쪽 위로, 마지막으로 왼쪽 아래로. 한 번의 선으로."</p>
      <div class="mg-sigil-field" id="sigilField" style="position:relative;width:260px;height:240px;margin:1rem auto;"></div>
      <div class="mg-actions"><span class="mg-feedback"></span></div>
    `;
    const field = document.getElementById("sigilField");
    // 표준 오각별 꼭짓점: 위, 오른쪽위, 오른쪽아래, 왼쪽아래, 왼쪽위
    const points = [
      { id: 0, label: "위", angle: -90 },
      { id: 1, label: "오른쪽 위", angle: -18 },
      { id: 2, label: "오른쪽 아래", angle: 54 },
      { id: 3, label: "왼쪽 아래", angle: 126 },
      { id: 4, label: "왼쪽 위", angle: 198 }
    ];
    const cx = 130, cy = 120, r = 95;
    const required = [0, 2, 4, 1, 3];
    let progress = 0;
    points.forEach(p => {
      const rad = (p.angle * Math.PI) / 180;
      const x = cx + r * Math.cos(rad);
      const y = cy + r * Math.sin(rad);
      const el = document.createElement("div");
      el.className = "mg-star";
      el.style.width = "18px";
      el.style.height = "18px";
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.style.transform = "translate(-50%,-50%)";
      el.title = p.label;
      el.addEventListener("click", () => {
        if (required[progress] === p.id) {
          progress++;
          el.classList.add("picked");
          if (progress === required.length) solveGate("sigil");
        } else {
          feedback("선이 어긋났다. 처음부터 다시.");
          progress = 0;
          field.querySelectorAll(".mg-star").forEach(s => s.classList.remove("picked"));
        }
      });
      field.appendChild(el);
    });
    openModal();
  }

  /* 6) 시계 — 흐르는 숫자를 정확히 666에서 멈추기 */
  const TIMING_TARGET = 666;
  function mgTiming() {
    modalContent().innerHTML = `
      <h3 class="mg-title">시계</h3>
      <p class="mg-desc">숫자는 0부터 999까지 끝없이 흐른다. 야수의 수, 딱 그 지점에서 멈춰야 한다.</p>
      <div class="mg-timer-display" id="timerDisplay" style="font-family:var(--serif-display);font-size:3rem;text-align:center;color:var(--gold-bright);letter-spacing:0.1em;margin:1.4rem 0;">000</div>
      <div class="mg-actions" style="justify-content:center;">
        <button class="btn" id="timerStop">멈춰라</button>
        <span class="mg-feedback"></span>
      </div>
    `;
    const display = document.getElementById("timerDisplay");
    let n = 0;
    let running = true;
    const iv = setInterval(() => {
      if (!running) return;
      n = (n + 1) % 1000;
      display.textContent = String(n).padStart(3, "0");
    }, 140);
    document.getElementById("timerStop").addEventListener("click", () => {
      if (n === TIMING_TARGET) {
        running = false;
        clearInterval(iv);
        solveGate("timing");
      } else {
        feedback(`${n}. 야수의 수가 아니다.`);
      }
    });
    openModal();
  }

  /* 7) 도면 — 함정이 있는 지하 통로에서 9번 방을 찾기 */
  function mgMaze() {
    modalContent().innerHTML = `
      <h3 class="mg-title">도면</h3>
      <p class="mg-desc">뜯어진 종이 한 조각: "동쪽으로 둘, 남쪽으로 셋, 동쪽으로 하나, 남쪽으로 하나 — 아홉 번째 방." 잘못 든 길은 처음으로 되돌린다.</p>
      <div class="mg-maze" id="mgMaze"></div>
      <div class="mg-maze-controls" id="mgMazeControls">
        <span></span><button data-d="up">▲</button><span></span>
        <button data-d="left">◀</button><button data-d="down">▼</button><button data-d="right">▶</button>
      </div>
      <div class="mg-actions"><span class="mg-feedback"></span></div>
    `;
    // 0 = 길, 1 = 벽, 2 = 함정(처음으로 되돌림)
    const layout = [
      [0,0,2,1,0,0,0],
      [1,1,0,1,0,1,2],
      [0,0,0,0,0,1,0],
      [0,1,1,1,0,1,0],
      [0,2,0,1,0,0,0],
      [0,1,0,1,1,1,2],
      [0,1,0,0,0,1,0]
    ];
    const start = { r: 0, c: 0 };
    const goal = { r: 6, c: 6 };
    const pos = { r: start.r, c: start.c };
    const grid = document.getElementById("mgMaze");
    grid.style.gridTemplateColumns = `repeat(${layout[0].length}, 26px)`;

    function draw() {
      grid.innerHTML = "";
      layout.forEach((row, r) => {
        row.forEach((cell, c) => {
          const d = document.createElement("div");
          d.className = "mg-cell";
          if (cell === 1) d.classList.add("wall");
          if (r === goal.r && c === goal.c) d.classList.add("goal");
          if (r === pos.r && c === pos.c) d.classList.add("player");
          grid.appendChild(d);
        });
      });
    }
    function move(d) {
      let { r, c } = pos;
      if (d === "up") r--; if (d === "down") r++;
      if (d === "left") c--; if (d === "right") c++;
      if (r < 0 || c < 0 || r >= layout.length || c >= layout[0].length) return;
      if (layout[r][c] === 1) return;
      if (layout[r][c] === 2) {
        feedback("바닥이 꺼진다. 처음으로 되돌아간다.");
        pos.r = start.r; pos.c = start.c;
        draw();
        return;
      }
      pos.r = r; pos.c = c;
      draw();
      if (pos.r === goal.r && pos.c === goal.c) solveGate("maze");
    }
    document.getElementById("mgMazeControls").querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => move(b.dataset.d));
    });
    draw();
    openModal();
  }

  function mgKernelInfo() {
    modalContent().innerHTML = `
      <h3 class="mg-title">???</h3>
      <p class="mg-desc">이 문은 여기서 열리지 않는다. 다른 곳을 보아야 한다 — 화면 어딘가, 흐릿하게 숨쉬는 것이 있다.</p>
    `;
    openModal();
  }

  /* 9) 수수께끼 */
  const RIDDLE_ANSWER_HASH = "51ca9d";

  function mgRiddle() {
    modalContent().innerHTML = `
      <h3 class="mg-title">수수께끼</h3>
      <p class="mg-riddle-text">매일 찾아오지만, 아무도 그것을 셈하지 못한다.<br>가진 것이 가장 많은 자도, 결국 그것 앞에서는 옥수수 한 알과 같다.<br>이것은 무엇인가?</p>
      <input type="text" class="mg-riddle-input" id="riddleInput" placeholder="답을 적어라" />
      <div class="mg-actions">
        <button class="btn" id="riddleSubmit">말하기</button>
        <span class="mg-feedback"></span>
      </div>
    `;
    document.getElementById("riddleSubmit").addEventListener("click", () => {
      const val = document.getElementById("riddleInput").value.trim();
      if (hashStr(val) === RIDDLE_ANSWER_HASH) solveGate("riddle");
      else feedback("틀렸다. 다시 생각해보라.");
    });
    openModal();
  }

  /* ---------------- hidden kernel (roams the page) ---------------- */

  let kernelEl = null;
  function placeKernel() {
    if (state.gates.kernel) return;
    if (!kernelEl) {
      kernelEl = document.createElement("div");
      kernelEl.className = "lost-kernel";
      kernelEl.textContent = "🌽";
      kernelEl.setAttribute("aria-hidden", "true");
      kernelEl.addEventListener("click", () => {
        solveGate("kernel");
        if (kernelEl && kernelEl.parentNode) kernelEl.parentNode.removeChild(kernelEl);
        kernelEl = null;
      });
      document.body.appendChild(kernelEl);
    }
    const margin = 40;
    const top = margin + Math.random() * (window.innerHeight - margin * 2);
    const left = margin + Math.random() * (window.innerWidth - margin * 2);
    kernelEl.style.top = top + "px";
    kernelEl.style.left = left + "px";
  }

  /* ---------------- whisper hints ---------------- */

  function cycleWhisper() {
    const el = document.getElementById("whisperText");
    const unsolved = GATES.filter(g => !state.gates[g.id]).map(g => g.id);
    let text;
    if (unsolved.length === 0) {
      text = "아홉 개의 문이 모두 열렸다. 그러나 기록은 아직 끝나지 않았다.";
    } else {
      const pick = unsolved[Math.floor(Math.random() * unsolved.length)];
      text = HINTS[pick];
    }
    el.style.opacity = 0;
    setTimeout(() => { el.textContent = text; el.style.opacity = 1; }, 400);
  }

  /* ---------------- boot ---------------- */

  function tick() {
    state.corn += 1;
    if (state.corn === 50) unveil("corn_1");
    renderCorn();
    save();
  }

  function init() {
    load();
    renderAll();
    document.getElementById("exploreBtn").addEventListener("click", exploreDungeon);
    document.getElementById("ritualBtn").addEventListener("click", performRitual);
    setInterval(tick, 1000);

    placeKernel();
    setInterval(placeKernel, 12000);

    cycleWhisper();
    setInterval(cycleWhisper, 9000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
