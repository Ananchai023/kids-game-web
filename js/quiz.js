/* =====================================================
   quiz.js = สมองของเกมทายคำศัพท์ (ฉบับปรับปรุง)
   ปรับปรุงจากเดิม:
   - เลือกหมวดคำ และจำนวนข้อได้
   - สุ่มถามภาษาไทยหรืออังกฤษสลับกัน (ฝึกสองภาษา)
   - มีตัวเลือก 4 ข้อ, โชว์คำตอบที่ถูกเมื่อตอบผิด
   - มีเสียง, คะแนน, โบนัสตอบถูกทุกข้อ, เก็บคะแนนสูงสุด
   ===================================================== */

const COUNTS = [5, 8, 10];

let selTheme = "animals";
let selCount = 5;

const g = { questions: [], allItems: [], index: 0, score: 0, correct: 0 };

// ---------- หน้าตั้งค่า ----------
function buildSetup() {
  const themeRow = $("#themeRow");
  themeRow.innerHTML = "";
  Object.keys(GAME_DATA).forEach(key => {
    const t = GAME_DATA[key];
    const b = document.createElement("button");
    b.className = "pill" + (key === selTheme ? " active" : "");
    b.textContent = `${t.icon} ${t.name}`;
    b.onclick = () => { selTheme = key; Sound.click(); buildSetup(); updateBest(); };
    themeRow.appendChild(b);
  });

  const countRow = $("#countRow");
  countRow.innerHTML = "";
  COUNTS.forEach(c => {
    const b = document.createElement("button");
    b.className = "pill" + (c === selCount ? " active" : "");
    b.textContent = `${c} ข้อ`;
    b.onclick = () => { selCount = c; Sound.click(); buildSetup(); updateBest(); };
    countRow.appendChild(b);
  });
}
function bestKey() { return `quiz_${selTheme}_${selCount}`; }
function updateBest() {
  const best = Store.getBest(bestKey());
  $("#bestText").textContent = best ? `🏅 คะแนนสูงสุด: ${best}` : "ยังไม่เคยเล่นหมวดนี้";
}

// ---------- เริ่มเกม ----------
function startGame() {
  const theme = GAME_DATA[selTheme];
  const count = Math.min(selCount, theme.items.length);
  g.questions = shuffle(theme.items).slice(0, count);
  g.allItems = theme.items;
  g.index = 0;
  g.score = 0;
  g.correct = 0;

  $("#score").textContent = "0";
  $("#correct").textContent = "0";
  $("#message").textContent = "";
  $("#setup").style.display = "none";
  $("#play").style.display = "flex";
  showQuestion();
}

// ---------- แสดงโจทย์ 1 ข้อ ----------
function showQuestion() {
  const q = g.questions[g.index];
  const askEn = Math.random() > 0.5; // สุ่มถามอังกฤษหรือไทย
  const answerText = askEn ? q.en : q.th;

  $("#progress").textContent = `ข้อ ${g.index + 1} / ${g.questions.length}`;
  $("#image").textContent = q.emoji;
  $("#question").textContent = askEn ? "นี่คืออะไร? (ตอบภาษาอังกฤษ)" : "นี่คืออะไร? (ตอบภาษาไทย)";

  // ตัวเลือก: คำถูก + คำหลอก 3 คำ
  const wrongs = shuffle(g.allItems.filter(x => x !== q)).slice(0, 3);
  const options = shuffle([q, ...wrongs]);

  const box = $("#options");
  box.innerHTML = "";
  options.forEach(opt => {
    const text = askEn ? opt.en : opt.th;
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.textContent = text;
    btn.onclick = () => answer(btn, text === answerText, answerText);
    box.appendChild(btn);
  });
}

// ---------- ตอบคำถาม ----------
function answer(btn, isCorrect, answerText) {
  $$(".quiz-option").forEach(b => b.onclick = null);

  if (isCorrect) {
    btn.classList.add("correct");
    g.score += 10;
    g.correct++;
    $("#score").textContent = g.score;
    $("#correct").textContent = g.correct;
    $("#message").textContent = "🌟 ถูกต้อง เก่งมาก!";
    Sound.correct();
  } else {
    btn.classList.add("wrong");
    $$(".quiz-option").forEach(b => { if (b.textContent === answerText) b.classList.add("correct"); });
    $("#message").textContent = `คำตอบที่ถูกคือ "${answerText}" 💪`;
    Sound.wrong();
  }

  setTimeout(() => {
    g.index++;
    $("#message").textContent = "";
    if (g.index < g.questions.length) showQuestion();
    else finish();
  }, 1200);
}

// ---------- จบเกม ----------
function finish() {
  const total = g.questions.length;
  const perfect = g.correct === total;
  if (perfect) g.score += 20;
  $("#score").textContent = g.score;

  Sound.win();
  if (g.correct >= total * 0.7) fx.confetti();

  const isRecord = Store.setBest(bestKey(), g.score);
  const ratio = g.correct / total;
  const stars = perfect ? "⭐⭐⭐" : ratio >= 0.6 ? "⭐⭐" : "⭐";

  $("#modalEmoji").textContent = perfect ? "🏆" : "🎉";
  $("#modalTitle").textContent = perfect ? "สุดยอด! ตอบถูกหมด" : "เก่งมาก!";
  $("#modalText").textContent = `ตอบถูก ${g.correct} จาก ${total} ข้อ\nได้ ${g.score} คะแนน` +
    (isRecord ? "\n🎊 ทำลายสถิติใหม่!" : "");
  $("#modalStars").textContent = stars;
  $("#modal").classList.add("show");
}

function backToSetup() {
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
