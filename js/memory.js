/* =====================================================
   memory.js = สมองของเกมจับคู่การ์ด (ฉบับปรับปรุง)
   ปรับปรุงจากเดิม:
   - เลือกหมวดคำได้หลายหมวด (สัตว์/ผลไม้/สี/อาหาร/ยานพาหนะ)
   - เลือกระดับความยาก 3 ระดับ (จำนวนคู่ต่างกัน)
   - จับคู่ "รูป" กับ "คำ" เพื่อฝึกเชื่อมโยงภาพกับคำศัพท์
   - มีช่วงพรีวิวการ์ดก่อนเริ่ม, มีเสียง, มีคะแนน, เก็บสถิติดีที่สุด
   ===================================================== */

// ระดับความยาก: pairs = จำนวนคู่, preview = วินาทีที่โชว์ก่อนเริ่ม
const LEVELS = [
  { id: "easy",   name: "ง่าย ⭐",       pairs: 4, preview: 3, cols: 4 },
  { id: "medium", name: "ปานกลาง ⭐⭐",   pairs: 6, preview: 2, cols: 4 },
  { id: "hard",   name: "ยาก ⭐⭐⭐",      pairs: 8, preview: 2, cols: 4 },
];

// สถานะที่ผู้เล่นเลือกไว้
let selTheme = "animals";
let selLevel = LEVELS[0];

// สถานะระหว่างเล่น
const g = { cards: [], flipped: [], matched: 0, moves: 0, score: 0, lock: true, total: 0 };

// element
const setupEl = $("#setup");
const playEl = $("#play");
const boardEl = $("#board");
const themeRow = $("#themeRow");
const levelRow = $("#levelRow");

// ---------- สร้างปุ่มเลือกหมวด/ระดับในหน้าตั้งค่า ----------
function buildSetup() {
  themeRow.innerHTML = "";
  Object.keys(GAME_DATA).forEach(key => {
    const t = GAME_DATA[key];
    const b = document.createElement("button");
    b.className = "pill" + (key === selTheme ? " active" : "");
    b.textContent = `${t.icon} ${t.name}`;
    b.onclick = () => { selTheme = key; Sound.click(); buildSetup(); updateBest(); };
    themeRow.appendChild(b);
  });

  levelRow.innerHTML = "";
  LEVELS.forEach(lv => {
    const b = document.createElement("button");
    b.className = "pill" + (lv.id === selLevel.id ? " active" : "");
    b.textContent = lv.name;
    b.onclick = () => { selLevel = lv; Sound.click(); buildSetup(); updateBest(); };
    levelRow.appendChild(b);
  });
}

function bestKey() { return `memory_${selTheme}_${selLevel.id}`; }
function updateBest() {
  const best = Store.getBest(bestKey());
  $("#bestText").textContent = best ? `🏅 คะแนนสูงสุดหมวดนี้: ${best}` : "ยังไม่เคยเล่นหมวดนี้";
}

// ---------- เริ่มเกม ----------
function startGame() {
  const theme = GAME_DATA[selTheme];
  const pairs = Math.min(selLevel.pairs, theme.items.length);
  g.total = pairs;
  g.flipped = [];
  g.matched = 0;
  g.moves = 0;
  g.score = 0;
  g.lock = true;

  $("#score").textContent = "0";
  $("#moves").textContent = "0";
  $("#pairs").textContent = "0";
  $("#totalPairs").textContent = pairs;

  // เลือกคำมา pairs คำ แล้วทำเป็นการ์ด 2 แบบ: รูป + คำ
  const picked = shuffle(theme.items).slice(0, pairs);
  let cards = [];
  picked.forEach((item, i) => {
    cards.push({ pairId: i, kind: "emoji", show: item.emoji });
    cards.push({ pairId: i, kind: "word", show: item.th });
  });
  g.cards = shuffle(cards);

  // วาดกระดาน
  const cols = Math.min(selLevel.cols, g.cards.length);
  boardEl.style.gridTemplateColumns = `repeat(${cols}, 84px)`;
  boardEl.innerHTML = "";
  g.cards.forEach((card, idx) => {
    const el = document.createElement("div");
    el.className = "card flipped"; // โชว์ก่อน (พรีวิว)
    el.dataset.idx = idx;
    el.innerHTML = `
      <div class="face back">❓</div>
      <div class="face front ${card.kind === "emoji" ? "emoji" : ""}">${card.show}</div>`;
    el.onclick = () => onCardClick(idx, el);
    boardEl.appendChild(el);
  });

  // สลับหน้า
  setupEl.style.display = "none";
  playEl.style.display = "flex";

  // นับถอยหลังพรีวิว
  let t = selLevel.preview;
  $("#statusText").textContent = `จำให้ดีนะ! เริ่มใน ${t}...`;
  const timer = setInterval(() => {
    t--;
    if (t > 0) {
      $("#statusText").textContent = `จำให้ดีนะ! เริ่มใน ${t}...`;
    } else {
      clearInterval(timer);
      $$("#board .card").forEach(c => c.classList.remove("flipped"));
      $("#statusText").textContent = "พลิกการ์ดหาคู่ รูป 🖼️ กับ คำ 🔤 ที่ตรงกัน!";
      g.lock = false;
    }
  }, 1000);
}

// ---------- คลิกการ์ด ----------
function onCardClick(idx, el) {
  if (g.lock) return;
  if (el.classList.contains("flipped") || el.classList.contains("matched")) return;
  if (g.flipped.length >= 2) return;

  el.classList.add("flipped");
  Sound.flip();
  g.flipped.push({ idx, el });

  if (g.flipped.length === 2) {
    g.moves++;
    $("#moves").textContent = g.moves;
    g.lock = true;
    const [a, b] = g.flipped;

    if (g.cards[a.idx].pairId === g.cards[b.idx].pairId) {
      // จับคู่ถูก
      setTimeout(() => {
        a.el.classList.add("matched");
        b.el.classList.add("matched");
        g.matched++;
        g.score += 10;
        $("#pairs").textContent = g.matched;
        $("#score").textContent = g.score;
        Sound.correct();
        g.flipped = [];
        g.lock = false;
        if (g.matched === g.total) finish();
      }, 450);
    } else {
      // จับคู่ผิด พลิกกลับ
      Sound.wrong();
      setTimeout(() => {
        a.el.classList.remove("flipped");
        b.el.classList.remove("flipped");
        g.flipped = [];
        g.lock = false;
      }, 850);
    }
  }
}

// ---------- จบเกม ----------
function finish() {
  // โบนัสถ้าใช้จำนวนพลิกน้อย
  const perfect = g.moves === g.total;
  const bonus = perfect ? 30 : Math.max(0, 20 - (g.moves - g.total) * 2);
  g.score += bonus;
  $("#score").textContent = g.score;

  Sound.win();
  fx.confetti();

  const isRecord = Store.setBest(bestKey(), g.score);
  const stars = perfect ? "⭐⭐⭐" : g.moves <= g.total + 3 ? "⭐⭐" : "⭐";

  $("#modalEmoji").textContent = perfect ? "🏆" : "🎉";
  $("#modalTitle").textContent = perfect ? "สุดยอด! ไม่พลาดเลย" : "เก่งมาก!";
  $("#modalText").textContent =
    `จับคู่ครบ ${g.total} คู่ ใช้ ${g.moves} ครั้ง\nได้ ${g.score} คะแนน` +
    (isRecord ? "\n🎊 ทำลายสถิติใหม่!" : "");
  $("#modalStars").textContent = stars;
  $("#modal").classList.add("show");
}

// ---------- กลับหน้าตั้งค่า ----------
function backToSetup() {
  $("#modal").classList.remove("show");
  playEl.style.display = "none";
  setupEl.style.display = "block";
  updateBest();
}

// ---------- ตั้งค่าปุ่ม ----------
$("#startBtn").onclick = () => { Sound.click(); startGame(); };
$("#restartBtn").onclick = () => { Sound.click(); startGame(); };
$("#changeBtn").onclick = () => { Sound.click(); backToSetup(); };
$("#againBtn").onclick = () => { $("#modal").classList.remove("show"); startGame(); };
$("#menuBtn").onclick = () => backToSetup();

// เริ่มต้น
buildSetup();
updateBest();
