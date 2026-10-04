/* =====================================================
   math.js = สมองของเกมคิดเลขเร็ว (ฉบับปรับปรุง)
   ปรับปรุงจากเดิม:
   - เลือกแบบโจทย์ได้: บวก / ลบ / คูณ / ผสม
   - เลือกระดับความยาก (ช่วงตัวเลขต่างกัน)
   - มีเวลาจำกัดต่อข้อ (แถบเวลา), มีชีวิต 3 ดวง
   - มีคะแนนต่อเนื่อง (streak) ยิ่งตอบถูกติดกันยิ่งได้โบนัส
   - มีเสียงและเก็บคะแนนสูงสุด
   ===================================================== */

const OPS = [
  { id: "add", name: "บวก ➕", signs: ["+"] },
  { id: "sub", name: "ลบ ➖", signs: ["-"] },
  { id: "mul", name: "คูณ ✖️", signs: ["×"] },
  { id: "mix", name: "ผสม 🎲", signs: ["+", "-", "×"] },
];

// ระดับ: max = ตัวเลขสูงสุด, time = วินาทีต่อข้อ
const LEVELS = [
  { id: "easy",   name: "ง่าย ⭐",     max: 10, time: 10 },
  { id: "medium", name: "ปานกลาง ⭐⭐", max: 20, time: 8 },
  { id: "hard",   name: "ยาก ⭐⭐⭐",    max: 50, time: 6 },
];

let selOp = OPS[0];
let selLevel = LEVELS[0];

const g = { score: 0, streak: 0, lives: 3, answer: 0, timer: null, timeLeft: 0, playing: false };

function buildSetup() {
  const opRow = $("#opRow");
  opRow.innerHTML = "";
  OPS.forEach(op => {
    const b = document.createElement("button");
    b.className = "pill" + (op.id === selOp.id ? " active" : "");
    b.textContent = op.name;
    b.onclick = () => { selOp = op; Sound.click(); buildSetup(); updateBest(); };
    opRow.appendChild(b);
  });

  const lvRow = $("#levelRow");
  lvRow.innerHTML = "";
  LEVELS.forEach(lv => {
    const b = document.createElement("button");
    b.className = "pill" + (lv.id === selLevel.id ? " active" : "");
    b.textContent = lv.name;
    b.onclick = () => { selLevel = lv; Sound.click(); buildSetup(); updateBest(); };
    lvRow.appendChild(b);
  });
}

function bestKey() { return `math_${selOp.id}_${selLevel.id}`; }
function updateBest() {
  const best = Store.getBest(bestKey());
  $("#bestText").textContent = best ? `🏅 คะแนนสูงสุด: ${best}` : "ยังไม่เคยเล่นแบบนี้";
}

// ---------- สร้างโจทย์ 1 ข้อ ----------
function newQuestion() {
  const sign = selOp.signs[randInt(0, selOp.signs.length - 1)];
  let a, b, ans;

  if (sign === "+") {
    a = randInt(1, selLevel.max); b = randInt(1, selLevel.max); ans = a + b;
  } else if (sign === "-") {
    a = randInt(1, selLevel.max); b = randInt(1, a); ans = a - b; // ไม่ให้ติดลบ
  } else { // คูณ - ใช้ตัวเลขเล็กลงให้เหมาะกับเด็ก
    const m = selLevel.id === "hard" ? 12 : selLevel.id === "medium" ? 9 : 5;
    a = randInt(1, m); b = randInt(1, m); ans = a * b;
  }
  g.answer = ans;
  $("#question").textContent = `${a} ${sign} ${b} = ?`;

  // ตัวเลือก: คำตอบถูก + หลอก 2 ตัว
  const options = [ans];
  let guard = 0;
  while (options.length < 3 && guard++ < 50) {
    const delta = randInt(1, Math.max(3, Math.round(ans * 0.3)));
    const wrong = Math.random() > 0.5 ? ans + delta : ans - delta;
    if (wrong >= 0 && !options.includes(wrong)) options.push(wrong);
  }
  while (options.length < 3) options.push(ans + options.length); // กันกรณีหายาก

  const box = $("#choices");
  box.innerHTML = "";
  shuffle(options).forEach(v => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = v;
    btn.onclick = () => checkAnswer(v, btn);
    box.appendChild(btn);
  });

  startTimer();
}

// ---------- แถบเวลาต่อข้อ ----------
function startTimer() {
  clearInterval(g.timer);
  g.timeLeft = selLevel.time;
  const bar = $("#timerBar");
  bar.style.width = "100%";
  const step = 100 / (selLevel.time * 10);
  g.timer = setInterval(() => {
    g.timeLeft -= 0.1;
    const pct = Math.max(0, (g.timeLeft / selLevel.time) * 100);
    bar.style.width = pct + "%";
    if (g.timeLeft <= 0) {
      clearInterval(g.timer);
      timeUp();
    }
  }, 100);
}

function timeUp() {
  Sound.wrong();
  g.streak = 0;
  $("#streak").textContent = 0;
  $("#message").textContent = "⏰ หมดเวลา!";
  loseLife();
  if (g.playing) setTimeout(newQuestion, 700);
}

// ---------- ตรวจคำตอบ ----------
function checkAnswer(chosen, btn) {
  if (!g.playing) return;
  clearInterval(g.timer);
  $$(".choice-btn").forEach(b => b.onclick = null);

  if (chosen === g.answer) {
    btn.classList.add("correct");
    g.streak++;
    // คะแนน = 10 + โบนัส streak + โบนัสตอบไว
    const streakBonus = g.streak >= 5 ? 10 : g.streak >= 3 ? 5 : 0;
    const speedBonus = Math.round(g.timeLeft);
    g.score += 10 + streakBonus + speedBonus;
    $("#score").textContent = g.score;
    $("#streak").textContent = g.streak;
    $("#message").textContent = g.streak >= 3 ? `เยี่ยม! ต่อเนื่อง ${g.streak} 🔥` : "✅ ถูกต้อง!";
    Sound.correct();
    setTimeout(newQuestion, 550);
  } else {
    btn.classList.add("wrong");
    // โชว์คำตอบที่ถูก
    $$(".choice-btn").forEach(b => { if (Number(b.textContent) === g.answer) b.classList.add("correct"); });
    g.streak = 0;
    $("#streak").textContent = 0;
    $("#message").textContent = `❌ คำตอบคือ ${g.answer}`;
    Sound.wrong();
    loseLife();
    if (g.playing) setTimeout(newQuestion, 900);
  }
}

// ---------- เสียชีวิต ----------
function loseLife() {
  g.lives--;
  $("#hearts").textContent = "❤️".repeat(g.lives) + "🖤".repeat(3 - g.lives);
  if (g.lives <= 0) endGame();
}

// ---------- เริ่ม/จบเกม ----------
function startGame() {
  g.score = 0; g.streak = 0; g.lives = 3; g.playing = true;
  $("#score").textContent = "0";
  $("#streak").textContent = "0";
  $("#hearts").textContent = "❤️❤️❤️";
  $("#message").textContent = "";
  $("#setup").style.display = "none";
  $("#play").style.display = "flex";
  newQuestion();
}

function endGame() {
  g.playing = false;
  clearInterval(g.timer);
  const isRecord = Store.setBest(bestKey(), g.score);
  const stars = g.score >= 150 ? "⭐⭐⭐" : g.score >= 70 ? "⭐⭐" : "⭐";
  Sound.lose();
  if (g.score >= 70) fx.confetti();

  $("#modalEmoji").textContent = g.score >= 150 ? "🏆" : "🎯";
  $("#modalTitle").textContent = "จบเกม!";
  $("#modalText").textContent = `ได้ทั้งหมด ${g.score} คะแนน` + (isRecord ? "\n🎊 ทำลายสถิติใหม่!" : "");
  $("#modalStars").textContent = stars;
  $("#modal").classList.add("show");
}

function backToSetup() {
  clearInterval(g.timer);
  g.playing = false;
  $("#modal").classList.remove("show");
  $("#play").style.display = "none";
  $("#setup").style.display = "block";
  updateBest();
}

$("#startBtn").onclick = () => { Sound.click(); startGame(); };
$("#quitBtn").onclick = () => { Sound.click(); backToSetup(); };
$("#againBtn").onclick = () => { $("#modal").classList.remove("show"); startGame(); };
$("#menuBtn").onclick = () => backToSetup();

buildSetup();
updateBest();
