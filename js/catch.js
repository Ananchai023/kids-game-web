/* =====================================================
   catch.js = สมองของเกมจับผลไม้ (ฉบับปรับปรุง)
   ปรับปรุงจากเดิม:
   - เลือกระดับความยาก (ผลไม้ตกเร็วขึ้น/ถี่ขึ้น)
   - มี "ระเบิด 💣" ห้ามคลิก ถ้าคลิกจะเสียชีวิต
   - มีชีวิต 3 ดวง (ผลไม้ตกพื้น หรือคลิกระเบิด = เสียชีวิต)
   - มีเสียง, เอฟเฟกต์ป๊อป, เก็บคะแนนสูงสุด
   - ใช้ requestAnimationFrame ทำให้ผลไม้ตกลื่นไหล
   ===================================================== */

const LEVELS = [
  { id: "easy",   name: "ง่าย ⭐",     spawn: 900, minSpeed: 90,  maxSpeed: 150, bombChance: 0.12, time: 40 },
  { id: "medium", name: "ปานกลาง ⭐⭐", spawn: 700, minSpeed: 130, maxSpeed: 210, bombChance: 0.18, time: 45 },
  { id: "hard",   name: "ยาก ⭐⭐⭐",    spawn: 520, minSpeed: 180, maxSpeed: 280, bombChance: 0.24, time: 50 },
];

const FRUITS = ["🍎", "🍌", "🍓", "🍊", "🍇", "🍉", "🍑", "🥝", "🍒", "🥭"];

let selLevel = LEVELS[0];

const area = $("#area");
const g = {
  score: 0, timeLeft: 0, lives: 3, playing: false,
  spawnTimer: null, countdown: null, rafId: null,
  items: [], lastTime: 0,
};

// ---------- หน้าตั้งค่า ----------
function buildSetup() {
  const row = $("#levelRow");
  row.innerHTML = "";
  LEVELS.forEach(lv => {
    const b = document.createElement("button");
    b.className = "pill" + (lv.id === selLevel.id ? " active" : "");
    b.textContent = lv.name;
    b.onclick = () => { selLevel = lv; Sound.click(); buildSetup(); updateBest(); };
    row.appendChild(b);
  });
}
function updateBest() {
  const best = Store.getBest("catch_" + selLevel.id);
  $("#bestText").textContent = best ? `🏅 คะแนนสูงสุด: ${best}` : "ยังไม่เคยเล่นระดับนี้";
}

// ---------- ปล่อยของ 1 ชิ้น ----------
function spawn() {
  const isBomb = Math.random() < selLevel.bombChance;
  const el = document.createElement("div");
  el.className = "fruit";
  el.textContent = isBomb ? "💣" : FRUITS[randInt(0, FRUITS.length - 1)];

  const maxLeft = area.clientWidth - 46;
  const x = randInt(0, Math.max(0, maxLeft));
  el.style.left = x + "px";
  el.style.top = "-50px";

  const item = { el, y: -50, speed: randInt(selLevel.minSpeed, selLevel.maxSpeed), bomb: isBomb, dead: false };

  el.addEventListener("click", () => {
    if (!g.playing || item.dead) return;
    if (isBomb) {
      // คลิกระเบิด = เสียชีวิต
      item.dead = true;
      Sound.wrong();
      el.textContent = "💥";
      el.classList.add("pop");
      setTimeout(() => el.remove(), 250);
      loseLife();
    } else {
      // จับผลไม้ได้
      item.dead = true;
      g.score++;
      $("#score").textContent = g.score;
      Sound.pop();
      el.classList.add("pop");
      setTimeout(() => el.remove(), 250);
    }
  });

  area.appendChild(el);
  g.items.push(item);
}

// ---------- ลูปทำให้ของตกลง (requestAnimationFrame) ----------
function loop(now) {
  if (!g.playing) return;
  const dt = g.lastTime ? (now - g.lastTime) / 1000 : 0;
  g.lastTime = now;
  const floor = area.clientHeight;

  g.items.forEach(item => {
    if (item.dead) return;
    item.y += item.speed * dt;
    item.el.style.top = item.y + "px";
    if (item.y > floor) {
      item.dead = true;
      item.el.remove();
      // ผลไม้ (ไม่ใช่ระเบิด) ตกพื้น = เสียชีวิต
      if (!item.bomb) { Sound.wrong(); loseLife(); }
    }
  });
  g.items = g.items.filter(i => !i.dead);

  g.rafId = requestAnimationFrame(loop);
}

// ---------- เสียชีวิต ----------
function loseLife() {
  if (!g.playing) return;
  g.lives--;
  $("#hearts").textContent = "❤️".repeat(Math.max(0, g.lives)) + "🖤".repeat(Math.max(0, 3 - g.lives));
  if (g.lives <= 0) endGame(true);
}

// ---------- เริ่มเกม ----------
function startGame() {
  g.score = 0; g.lives = 3; g.timeLeft = selLevel.time; g.playing = true;
  g.items = []; g.lastTime = 0;
  area.innerHTML = "";
  $("#score").textContent = "0";
  $("#time").textContent = g.timeLeft;
  $("#hearts").textContent = "❤️❤️❤️";
  $("#setup").style.display = "none";
  $("#play").style.display = "flex";

  g.spawnTimer = setInterval(spawn, selLevel.spawn);
  g.countdown = setInterval(() => {
    g.timeLeft--;
    $("#time").textContent = g.timeLeft;
    if (g.timeLeft <= 0) endGame(false);
  }, 1000);
  g.rafId = requestAnimationFrame(loop);
}

// ---------- จบเกม ----------
function endGame(byLives) {
  g.playing = false;
  clearInterval(g.spawnTimer);
  clearInterval(g.countdown);
  cancelAnimationFrame(g.rafId);
  area.innerHTML = "";

  const isRecord = Store.setBest("catch_" + selLevel.id, g.score);
  const stars = g.score >= 30 ? "⭐⭐⭐" : g.score >= 15 ? "⭐⭐" : "⭐";
  Sound.lose();
  if (g.score >= 15) fx.confetti();

  $("#modalEmoji").textContent = byLives ? "💥" : "⏰";
  $("#modalTitle").textContent = byLives ? "ชีวิตหมดแล้ว!" : "หมดเวลา!";
  $("#modalText").textContent = `จับผลไม้ได้ ${g.score} ลูก` + (isRecord ? "\n🎊 ทำลายสถิติใหม่!" : "");
  $("#modalStars").textContent = stars;
  $("#modal").classList.add("show");
}

function backToSetup() {
  g.playing = false;
  clearInterval(g.spawnTimer);
  clearInterval(g.countdown);
  cancelAnimationFrame(g.rafId);
  $("#modal").classList.remove("show");
  $("#play").style.display = "none";
  $("#setup").style.display = "block";
  updateBest();
}

$("#startBtn").onclick = () => { Sound.click(); startGame(); };
$("#againBtn").onclick = () => { $("#modal").classList.remove("show"); startGame(); };
$("#menuBtn").onclick = () => backToSetup();

buildSetup();
updateBest();
