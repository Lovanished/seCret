(() => {
  "use strict";

  const SAVE_KEY = "secretcorn_save_v2";

  /* ---------------- lightweight checksum (평문 정답을 소스에 남기지 않기 위함) ---------------- */
  function hashStr(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(16);
  }

  /* ---------------- gate registry ---------------- */
  const GATES = [
    { id: "dial",          rune: "🔒", name: "자물쇠" },
    { id: "constellation", rune: "✦",  name: "별자리" },
    { id: "scale",         rune: "⚖",  name: "저울" },
    { id: "cards",         rune: "🂠", name: "패" },
    { id: "simon",         rune: "◈",  name: "문양" },
    { id: "timing",        rune: "⏳", name: "모래" },
    { id: "maze",          rune: "▦",  name: "미로" },
    { id: "kernel",        rune: "?",  name: "???" },
    { id: "riddle",        rune: "❦",  name: "수수께끼" }
  ];

  const MAIN_MAP = { dial: "exchange", constellation: "dungeon", scale: "ritual" };

  const CODEX = [
    { id: "codex_dial",          tag: "교환소",   text: "안경 너머로 셈을 하는 자가 있었다. 옥수수를 받고, 반짝이는 것을 내주었다." },
    { id: "codex_constellation", tag: "지하실",   text: "학교 지하에는 원래 없던 계단이 있다. 도면에도, 청소부의 기억에도 없다." },
    { id: "codex_scale",         tag: "협상",     text: "염소는 죄가 없다. 그것은 그저 마지막 식사였을 뿐. 콧수염을 쓰다듬으며 그는 웃었다." },
    { id: "codex_cards",         tag: "금과 다이아몬드", text: "짝을 맞추면 값이 오른다고 했다. 무엇의 값인지는 아무도 말해주지 않았다." },
    { id: "codex_simon",         tag: "문양",     text: "같은 순서로 세 번 그리면, 문양은 스스로 열린다고 전해진다." },
    { id: "codex_timing",        tag: "때",       text: "너무 이르지도, 늦지도 않은 순간이 있다. 그 틈은 매번 조금씩 움직인다." },
    { id: "codex_maze",          tag: "9",        text: "그것에게는 이름이 없었다. 사람들은 그냥 숫자로 불렀다. 아홉 번째였기 때문이라고." },
    { id: "codex_kernel",        tag: "흐릿한 것", text: "모든 것이 또렷하게 보이는 곳에는, 오히려 아무것도 숨지 않는다." },
    { id: "codex_riddle",        tag: "간디 수정구", text: "간디 수정구, 간디워리어, 간디숭배자. 세 이름 모두 같은 것을 가리킨다고도, 아니라고도 한다." },
    { id: "corn_1",               tag: "알갱이",   text: "시간은 아무것도 묻지 않고 옥수수를 놓고 간다. 그것이 이 자리의 유일한 규칙이다." },
    { id: "glasses_bought",       tag: "안경",     text: "안경을 쓰면, 원래 없던 순서가 보인다고 했다. 숫자들은 흩어져 있지만, 흩어져 있지 않다." },
    { id: "dungeon_explore_5",    tag: "교장 P",   text: "지하실의 주인은 교장이라 불렸다. 그는 학생들 몰래 무언가를 '만들고' 있었다." },
    { id: "dungeon_explore_15",   tag: "9의 기원", text: "9는 태어난 것이 아니라 만들어졌다. 실패작들 중, 유일하게 눈을 뜬 것이었다." },
    { id: "ritual_use_5",         tag: "바포메트", text: "간디는 염소고기를 먹고, 바포메트의 힘을 빌려 영혼을 모으는 재주를 얻었다고 전해진다." }
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
    dial: "네 자리 숫자다. 처음은 0에서 시작해, 하나씩 오른다.",
    constellation: "가장 밝은 빛부터 가장 어두운 빛까지, 순서대로 이어라.",
    scale: "양쪽 접시의 무게가 같아지는 순간, 저울은 스스로 응답한다.",
    cards: "같은 얼굴을 가진 둘을 찾아 짝지어라.",
    simon: "빛나는 순서를 눈에 담고, 그대로 되돌려주어라.",
    timing: "너무 이르지도 늦지도 않은 틈이 있다. 그 틈은 계속 움직인다.",
    maze: "돌벽 사이로 길은 하나뿐이다. 서두르지 않아도 된다.",
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

  /* ================= 9 gimmicks ================= */

  function openGate(id) {
    switch (id) {
      case "dial": return mgDial();
      case "constellation": return mgConstellation();
      case "scale": return mgScale();
      case "cards": return mgCards();
      case "simon": return mgSimon();
      case "timing": return mgTiming();
      case "maze": return mgMaze();
      case "kernel": return mgKernelInfo();
      case "riddle": return mgRiddle();
    }
  }

  const DIAL_ANSWER_HASH = "7c537f45";

  function mgDial() {
    modalContent().innerHTML = `
      <h3 class="mg-title">자물쇠</h3>
      <p class="mg-desc">네 개의 다이얼이 있다. 맞는 순서로 세우면, 걸쇠는 스스로 풀린다.</p>
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

  function mgConstellation() {
    modalContent().innerHTML = `
      <h3 class="mg-title">별자리</h3>
      <p class="mg-desc">가장 밝은 별부터, 가장 어두운 별까지 순서대로 이어라.</p>
      <div class="mg-sky" id="mgSky"></div>
      <div class="mg-actions"><span class="mg-feedback"></span></div>
    `;
    const sky = document.getElementById("mgSky");
    const n = 6;
    const stars = [];
    for (let i = 0; i < n; i++) {
      const size = 6 + Math.round(Math.random() * 16);
      stars.push({
        size,
        top: 10 + Math.random() * 80,
        left: 6 + Math.random() * 88,
        picked: false
      });
    }
    const correctOrder = stars
      .map((s, i) => i)
      .sort((a, b) => stars[b].size - stars[a].size);

    const clickedOrder = [];
    stars.forEach((s, i) => {
      const el = document.createElement("div");
      el.className = "mg-star";
      el.style.width = s.size + "px";
      el.style.height = s.size + "px";
      el.style.top = s.top + "%";
      el.style.left = s.left + "%";
      el.addEventListener("click", () => {
        if (s.picked) return;
        s.picked = true;
        el.classList.add("picked");
        clickedOrder.push(i);
        if (clickedOrder.length === n) {
          const ok = clickedOrder.every((v, idx) => v === correctOrder[idx]);
          if (ok) {
            solveGate("constellation");
          } else {
            feedback("별들이 어긋난 채 흩어진다. 다시.");
            setTimeout(() => {
              stars.forEach(st => (st.picked = false));
              sky.querySelectorAll(".mg-star").forEach(n2 => n2.classList.remove("picked"));
              clickedOrder.length = 0;
            }, 700);
          }
        }
      });
      sky.appendChild(el);
    });
    openModal();
  }

  function mgScale() {
    modalContent().innerHTML = `
      <h3 class="mg-title">저울</h3>
      <p class="mg-desc">양쪽 접시의 무게를 같게 만들어라.</p>
      <div class="mg-scale">
        <div>
          <div class="mg-pan" id="panL"></div>
          <div class="mg-pan-label">왼쪽 · <span id="sumL">0</span></div>
        </div>
        <div>
          <div class="mg-pan" id="panR"></div>
          <div class="mg-pan-label">오른쪽 · <span id="sumR">0</span></div>
        </div>
      </div>
      <div class="mg-weights">
        <span style="align-self:center;color:var(--ink-dim);font-size:0.8rem;">왼쪽에 추가:</span>
        <button class="mg-weight-btn" data-pan="L" data-v="1">🌽</button>
        <button class="mg-weight-btn" data-pan="L" data-v="3">👓</button>
        <button class="mg-weight-btn" data-pan="L" data-v="5">🪙</button>
        <button class="mg-weight-btn" data-pan="L" data-v="9">💎</button>
      </div>
      <div class="mg-weights">
        <span style="align-self:center;color:var(--ink-dim);font-size:0.8rem;">오른쪽에 추가:</span>
        <button class="mg-weight-btn" data-pan="R" data-v="1">🌽</button>
        <button class="mg-weight-btn" data-pan="R" data-v="3">👓</button>
        <button class="mg-weight-btn" data-pan="R" data-v="5">🪙</button>
        <button class="mg-weight-btn" data-pan="R" data-v="9">💎</button>
      </div>
      <div class="mg-actions">
        <button class="btn small" id="scaleReset">초기화</button>
        <span class="mg-feedback"></span>
      </div>
    `;
    const sums = { L: 0, R: 0 };
    const icons = { L: [], R: [] };
    function redraw() {
      document.getElementById("sumL").textContent = sums.L;
      document.getElementById("sumR").textContent = sums.R;
      document.getElementById("panL").innerHTML = icons.L.join(" ");
      document.getElementById("panR").innerHTML = icons.R.join(" ");
      if (sums.L === sums.R && sums.L > 0) {
        solveGate("scale");
      }
    }
    modalContent().querySelectorAll(".mg-weight-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const pan = btn.dataset.pan;
        const v = parseInt(btn.dataset.v, 10);
        sums[pan] += v;
        icons[pan].push(btn.textContent);
        redraw();
      });
    });
    document.getElementById("scaleReset").addEventListener("click", () => {
      sums.L = 0; sums.R = 0; icons.L = []; icons.R = [];
      redraw();
    });
    openModal();
  }

  function mgCards() {
    modalContent().innerHTML = `
      <h3 class="mg-title">패</h3>
      <p class="mg-desc">같은 얼굴을 가진 둘을 찾아 짝지어라.</p>
      <div class="mg-cards" id="mgCards"></div>
      <div class="mg-actions"><span class="mg-feedback"></span></div>
    `;
    const faces = ["🌽", "👓", "🪙", "💎"];
    const deck = shuffle(faces.concat(faces));
    const grid = document.getElementById("mgCards");
    let flipped = [];
    let matched = 0;
    let lock = false;
    deck.forEach((face, i) => {
      const c = document.createElement("div");
      c.className = "mg-card";
      c.dataset.face = face;
      c.dataset.i = i;
      c.textContent = "";
      c.addEventListener("click", () => {
        if (lock || c.classList.contains("flipped") || c.classList.contains("matched")) return;
        c.classList.add("flipped");
        c.textContent = face;
        flipped.push(c);
        if (flipped.length === 2) {
          lock = true;
          const [a, b] = flipped;
          if (a.dataset.face === b.dataset.face) {
            a.classList.add("matched"); b.classList.add("matched");
            matched += 2;
            flipped = []; lock = false;
            if (matched === deck.length) solveGate("cards");
          } else {
            setTimeout(() => {
              a.classList.remove("flipped"); a.textContent = "";
              b.classList.remove("flipped"); b.textContent = "";
              flipped = []; lock = false;
            }, 600);
          }
        }
      });
      grid.appendChild(c);
    });
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

  function mgSimon() {
    modalContent().innerHTML = `
      <h3 class="mg-title">문양</h3>
      <p class="mg-desc">빛나는 순서를 눈에 담고, 그대로 되돌려주어라.</p>
      <div class="mg-simon" id="mgSimon">
        <button class="mg-simon-btn" data-i="0">✦</button>
        <button class="mg-simon-btn" data-i="1">✧</button>
        <button class="mg-simon-btn" data-i="2">⛧</button>
        <button class="mg-simon-btn" data-i="3">☾</button>
      </div>
      <div class="mg-actions">
        <button class="btn small" id="simonStart">순서 보기</button>
        <span class="mg-feedback"></span>
      </div>
    `;
    const btns = [...document.querySelectorAll(".mg-simon-btn")];
    const seqLen = 5;
    let sequence = [];
    let userPos = 0;
    let accepting = false;

    function light(i) {
      return new Promise(res => {
        btns[i].classList.add("lit");
        setTimeout(() => { btns[i].classList.remove("lit"); res(); }, 380);
      });
    }
    async function playSequence() {
      accepting = false;
      feedback("잘 보아라...");
      for (const i of sequence) {
        await light(i);
        await new Promise(r => setTimeout(r, 180));
      }
      userPos = 0;
      accepting = true;
      feedback("이제, 그대로 눌러라.");
    }
    document.getElementById("simonStart").addEventListener("click", () => {
      sequence = Array.from({ length: seqLen }, () => Math.floor(Math.random() * 4));
      playSequence();
    });
    btns.forEach(btn => {
      btn.addEventListener("click", () => {
        if (!accepting) return;
        const i = parseInt(btn.dataset.i, 10);
        btn.classList.add("lit");
        setTimeout(() => btn.classList.remove("lit"), 180);
        if (i === sequence[userPos]) {
          userPos++;
          if (userPos === sequence.length) {
            accepting = false;
            solveGate("simon");
          }
        } else {
          accepting = false;
          feedback("어긋났다. 다시 순서를 보아라.");
        }
      });
    });
    openModal();
  }

  function mgTiming() {
    modalContent().innerHTML = `
      <h3 class="mg-title">모래</h3>
      <p class="mg-desc">표시된 틈에서 정확히 멈춰라. 세 번 연속으로.</p>
      <div class="mg-track" id="mgTrack">
        <div class="mg-track-zone" id="mgZone"></div>
        <div class="mg-track-cursor" id="mgCursor"></div>
      </div>
      <div class="mg-actions">
        <button class="btn" id="mgStop">정지</button>
        <span class="mg-feedback">연속 성공: <span id="mgStreak">0</span> / 3</span>
      </div>
    `;
    const track = document.getElementById("mgTrack");
    const cursor = document.getElementById("mgCursor");
    const zoneEl = document.getElementById("mgZone");
    const trackW = 300;
    track.style.width = trackW + "px";
    let zoneLeft = 30 + Math.random() * (trackW - 100);
    let zoneW = 34;
    zoneEl.style.left = zoneLeft + "px";
    zoneEl.style.width = zoneW + "px";

    let streak = 0;
    let running = true;
    const start = performance.now();
    function frame(t) {
      if (!running) return;
      const elapsed = (t - start) / 650;
      const pos = (Math.sin(elapsed) + 1) / 2 * (trackW - 4);
      cursor.style.left = pos + "px";
      cursor._pos = pos;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    document.getElementById("mgStop").addEventListener("click", () => {
      const pos = cursor._pos || 0;
      if (pos >= zoneLeft && pos <= zoneLeft + zoneW) {
        streak++;
        document.getElementById("mgStreak").textContent = String(streak);
        zoneLeft = 20 + Math.random() * (trackW - 90);
        zoneEl.style.left = zoneLeft + "px";
        if (streak >= 3) {
          running = false;
          solveGate("timing");
        }
      } else {
        streak = 0;
        document.getElementById("mgStreak").textContent = "0";
      }
    });
    openModal();
  }

  function mgMaze() {
    modalContent().innerHTML = `
      <h3 class="mg-title">미로</h3>
      <p class="mg-desc">돌벽 사이로 길을 찾아 빛나는 칸에 닿아라.</p>
      <div class="mg-maze" id="mgMaze"></div>
      <div class="mg-maze-controls" id="mgMazeControls">
        <span></span><button data-d="up">▲</button><span></span>
        <button data-d="left">◀</button><button data-d="down">▼</button><button data-d="right">▶</button>
      </div>
      <div class="mg-actions"><span class="mg-feedback"></span></div>
    `;
    // 0 = 길, 1 = 벽
    const layout = [
      [0,0,0,1,0,0,0],
      [1,1,0,1,0,1,0],
      [0,0,0,0,0,1,0],
      [0,1,1,1,0,1,0],
      [0,0,0,1,0,0,0],
      [0,1,0,1,1,1,0],
      [0,1,0,0,0,1,0]
    ];
    const goal = { r: 6, c: 6 };
    const pos = { r: 0, c: 0 };
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
