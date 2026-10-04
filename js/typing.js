/* =====================================================
   typing.js = สมองของเกมฝึกพิมพ์ดีด (Keyboard Adventure)
   พอร์ตและปรับปรุงจากเกมเดิม:
   - ข้อความเป็นภาษาไทย, ผูกปุ่มด้วย addEventListener (ไม่ใช้ inline onclick)
   - ใช้เสียงเอฟเฟกต์จาก common.js (Sound) และเคารพปุ่มเปิด/ปิดเสียงรวม
   - มีเสียงอ่านออกเสียง (Text-to-Speech) อ่านตัวอักษร/คำที่ต้องพิมพ์
   - คีย์บอร์ดเสมือน + ไฮไลต์ปุ่มถัดไป + เก็บคะแนนสูงสุดแยกตามโหมด
   ===================================================== */

const gameState = {
  mode: null, score: 0, streak: 0, bestStreak: 0, level: 1,
  timer: 60, timerInterval: null, currentTarget: "", currentIndex: 0,
  totalTargets: 10, completedTargets: 0, correctKeys: 0, totalKeys: 0,
  isPlaying: false, isPaused: false,
};

const wordBanks = {
  letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  words: ["cat","dog","sun","hat","red","big","run","fun","cup","map","pen","box","top","hot","sit","bed","fish","bird","tree","book","ball","star","moon","cake","rain","jump","play","sing","love","home"],
  animals: ["cat","dog","fish","bird","frog","duck","bear","lion","deer","wolf","fox","owl","bat","cow","pig","hen","ant","bee","rat","eel","tiger","horse","sheep","mouse","snake","whale","eagle","shark","zebra","panda"],
  sentences: ["the cat sat","i like dogs","run and jump","the sun is hot","i can read","we love to play","birds can fly","fish can swim","the sky is blue","i am happy","lets have fun","good morning","thank you","hello world","nice to meet you"],
};

const letterHints = {
  A:"🍎 Apple",B:"🐻 Bear",C:"🐱 Cat",D:"🐶 Dog",E:"🐘 Elephant",F:"🐸 Frog",G:"🦒 Giraffe",H:"🏠 House",
  I:"🍦 Ice cream",J:"🤹 Juggle",K:"🪁 Kite",L:"🦁 Lion",M:"🐵 Monkey",N:"🌙 Night",O:"🐙 Octopus",P:"🐧 Penguin",
  Q:"👸 Queen",R:"🌈 Rainbow",S:"⭐ Star",T:"🐯 Tiger",U:"☂️ Umbrella",V:"🎻 Violin",W:"🐋 Whale",X:"❌ X-ray",Y:"💛 Yellow",Z:"🦓 Zebra",
};

const animalEmojis = {
  cat:"🐱",dog:"🐶",fish:"🐟",bird:"🐦",frog:"🐸",duck:"🦆",bear:"🐻",lion:"🦁",deer:"🦌",wolf:"🐺",
  fox:"🦊",owl:"🦉",bat:"🦇",cow:"🐄",pig:"🐷",hen:"🐔",ant:"🐜",bee:"🐝",rat:"🐀",eel:"🐍",
  tiger:"🐯",horse:"🐴",sheep:"🐑",mouse:"🐭",snake:"🐍",whale:"🐋",eagle:"🦅",shark:"🦈",zebra:"🦓",panda:"🐼",
};

const el = {
  score: $("#score"), streak: $("#streak"), timer: $("#timer"), level: $("#level"),
  modeSelection: $("#modeSelection"), gameArea: $("#gameArea"),
  targetLetter: $("#targetLetter"), targetHint: $("#targetHint"),
  playerInput: $("#playerInput"), feedback: $("#feedback"),
  progressBar: $("#progressBar"), progressText: $("#progressText"),
  resultsScreen: $("#resultsScreen"), controls: $("#controls"),
  finalScore: $("#finalScore"), finalAccuracy: $("#finalAccuracy"),
  finalStreak: $("#finalStreak"), finalWords: $("#finalWords"),
  starsEarned: $("#starsEarned"), resultsTitle: $("#resultsTitle"),
  typedKeyDisplay: $("#typedKeyDisplay"),
};

// ---------- เสียงเอฟเฟกต์ (ใช้ Sound จาก common.js) ----------
function playSound(type) {
  if (type === "correct") Sound.correct();
  else if (type === "wrong") Sound.wrong();
  else if (type === "levelup") Sound.levelup();
  else if (type === "gameover") Sound.lose();
}

// ---------- เสียงอ่านออกเสียง (Text-to-Speech) ----------
const speechSynth = window.speechSynthesis;
let englishVoice = null;
function loadVoices() {
  if (!speechSynth) return;
  const voices = speechSynth.getVoices();
  englishVoice = voices.find(v => v.lang.startsWith("en") && /female/i.test(v.name))
    || voices.find(v => v.lang.startsWith("en-US"))
    || voices.find(v => v.lang.startsWith("en-GB"))
    || voices.find(v => v.lang.startsWith("en"))
    || voices[0];
}
if (speechSynth) {
  loadVoices();
  if (speechSynth.onvoiceschanged !== undefined) speechSynth.onvoiceschanged = loadVoices;
}
function speak(text, rate = 0.9, pitch = 1.2) {
  if (!Sound.enabled || !speechSynth) return;
  speechSynth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US"; u.rate = rate; u.pitch = pitch; u.volume = 1;
  if (englishVoice) u.voice = englishVoice;
  speechSynth.speak(u);
}
function pronounceTarget(target) {
  if (!Sound.enabled) return;
  if (gameState.mode === "letters") speak(target, 0.8, 1.3);
  else speak(target, 0.85, 1.2);
}
function announceKeyPress(typedChar, isCorrect) {
  if (!Sound.enabled || !speechSynth) return;
  const name = typedChar === " " ? "space" : typedChar.toUpperCase();
  speak(isCorrect ? `${name}. Correct!` : `${name}. Wrong!`, 1.0, isCorrect ? 1.3 : 1.0);
}

// ---------- เริ่มโหมด ----------
function selectMode(mode) {
  gameState.mode = mode;
  gameState.score = 0; gameState.streak = 0; gameState.bestStreak = 0; gameState.level = 1;
  gameState.completedTargets = 0; gameState.correctKeys = 0; gameState.totalKeys = 0;
  gameState.isPlaying = true; gameState.isPaused = false;

  if (mode === "letters") { gameState.totalTargets = 10; gameState.timer = 60; }
  else if (mode === "words" || mode === "animals") { gameState.totalTargets = 10; gameState.timer = 90; }
  else { gameState.totalTargets = 8; gameState.timer = 120; }

  updateStats();
  showGameArea();
  startTimer();
  nextTarget();
}

function showGameArea() {
  el.modeSelection.style.display = "none";
  el.gameArea.style.display = "block";
  el.resultsScreen.style.display = "none";
  el.controls.style.display = "flex";
  el.playerInput.value = "";
  el.playerInput.focus();
}

function startTimer() {
  clearInterval(gameState.timerInterval);
  el.timer.style.color = "";
  gameState.timerInterval = setInterval(() => {
    if (gameState.isPaused) return;
    gameState.timer--;
    el.timer.textContent = gameState.timer;
    if (gameState.timer <= 10) el.timer.style.color = "#e17055";
    if (gameState.timer <= 0) endGame();
  }, 1000);
}

function nextTarget() {
  if (gameState.completedTargets >= gameState.totalTargets) { endGame(); return; }
  const bank = wordBanks[gameState.mode];
  let target;
  if (gameState.mode === "letters") target = bank[Math.floor(Math.random() * bank.length)];
  else { do { target = bank[Math.floor(Math.random() * bank.length)]; } while (target === gameState.currentTarget && bank.length > 1); }

  gameState.currentTarget = target;
  gameState.currentIndex = 0;

  if (gameState.mode === "letters") {
    el.targetLetter.textContent = target;
    el.targetHint.textContent = letterHints[target] || "";
  } else if (gameState.mode === "animals") {
    el.targetLetter.textContent = `${animalEmojis[target] || "🐾"} ${target}`;
    el.targetHint.textContent = `พิมพ์: "${target}"`;
  } else {
    el.targetLetter.textContent = target;
    el.targetHint.textContent = gameState.mode === "sentences" ? "พิมพ์ประโยคด้านบน" : "พิมพ์คำด้านบน";
  }

  highlightTargetKeys();
  el.playerInput.value = "";
  el.playerInput.className = "player-input";
  el.feedback.textContent = "";
  el.feedback.className = "feedback";
  updateProgress();
  el.targetLetter.classList.add("bounce-in");
  setTimeout(() => el.targetLetter.classList.remove("bounce-in"), 500);
  setTimeout(() => pronounceTarget(target), 300);
}

function highlightTargetKeys() {
  $$(".key").forEach(k => k.classList.remove("highlight", "correct-key", "wrong-key"));
  if (gameState.mode === "letters") {
    const k = document.querySelector(`[data-key="${gameState.currentTarget.toLowerCase()}"]`);
    if (k) k.classList.add("highlight");
  } else {
    const nextChar = gameState.currentTarget[gameState.currentIndex];
    if (nextChar) {
      const k = document.querySelector(`[data-key="${nextChar.toLowerCase()}"]`);
      if (k) k.classList.add("highlight");
    }
  }
}

function handleInput(inputChar) {
  if (!gameState.isPlaying || gameState.isPaused) return;
  gameState.totalKeys++;

  if (gameState.mode === "letters") {
    const isCorrect = inputChar.toUpperCase() === gameState.currentTarget;
    showTypedKey(inputChar, isCorrect);
    announceKeyPress(inputChar, isCorrect);
    if (isCorrect) handleCorrect(); else handleWrong();
  } else {
    const expected = gameState.currentTarget[gameState.currentIndex];
    const isCorrect = inputChar.toLowerCase() === expected.toLowerCase();
    showTypedKey(inputChar, isCorrect);
    announceKeyPress(inputChar, isCorrect);
    if (isCorrect) {
      gameState.currentIndex++;
      gameState.correctKeys++;
      const keyEl = document.querySelector(`[data-key="${expected.toLowerCase()}"]`);
      if (keyEl) { keyEl.classList.add("correct-key"); setTimeout(() => keyEl.classList.remove("correct-key"), 300); }
      if (gameState.currentIndex >= gameState.currentTarget.length) handleCorrect();
      else { highlightTargetKeys(); el.playerInput.className = "player-input correct"; }
    } else {
      const keyEl = document.querySelector(`[data-key="${inputChar.toLowerCase()}"]`);
      if (keyEl) { keyEl.classList.add("wrong-key"); setTimeout(() => keyEl.classList.remove("wrong-key"), 300); }
      el.playerInput.className = "player-input wrong";
      setTimeout(() => { el.playerInput.className = "player-input"; }, 400);
      gameState.streak = 0;
      updateStats();
      playSound("wrong");
      el.feedback.textContent = "❌ ลองใหม่นะ!";
      el.feedback.className = "feedback wrong";
      setTimeout(() => { el.feedback.textContent = ""; el.feedback.className = "feedback"; }, 800);
    }
  }
}

function showTypedKey(char, isCorrect) {
  const d = el.typedKeyDisplay;
  if (!d) return;
  d.textContent = char === " " ? "␣" : char.toUpperCase();
  d.className = `typed-key-display ${isCorrect ? "typed-correct" : "typed-wrong"}`;
  setTimeout(() => { d.className = "typed-key-display"; d.textContent = ""; }, 1200);
}

function handleCorrect() {
  gameState.completedTargets++;
  gameState.correctKeys++;
  gameState.streak++;
  if (gameState.streak > gameState.bestStreak) gameState.bestStreak = gameState.streak;

  let points = 10;
  if (gameState.streak >= 5) points += 5;
  if (gameState.streak >= 10) points += 10;
  if (gameState.mode === "sentences") points *= 2;
  gameState.score += points;

  if (gameState.completedTargets % 5 === 0 && gameState.completedTargets > 0) {
    gameState.level++;
    playSound("levelup");
    showFeedback(`🎉 เลเวล ${gameState.level}! +${points} คะแนน`, "correct");
  } else {
    playSound("correct");
    const msgs = ["✅ ถูกต้อง!", "🌟 เยี่ยม!", "👏 สุดยอด!", "💪 เก่งมาก!", "🎯 เป๊ะ!"];
    showFeedback(`${msgs[Math.floor(Math.random() * msgs.length)]} +${points}`, "correct");
  }

  el.playerInput.className = "player-input correct";
  fx.confetti(8);
  updateStats();
  updateProgress();
  setTimeout(() => { if (gameState.isPlaying) nextTarget(); }, 800);
}

function handleWrong() {
  gameState.streak = 0;
  playSound("wrong");
  showFeedback("❌ กดผิดปุ่ม! ลองใหม่นะ", "wrong");
  el.playerInput.className = "player-input wrong";
  setTimeout(() => { el.playerInput.className = "player-input"; el.playerInput.value = ""; }, 400);
  updateStats();
}

function showFeedback(msg, type) {
  el.feedback.textContent = msg;
  el.feedback.className = `feedback ${type}`;
  setTimeout(() => { el.feedback.textContent = ""; el.feedback.className = "feedback"; }, 1500);
}

function updateStats() {
  el.score.textContent = gameState.score;
  el.streak.textContent = gameState.streak;
  el.timer.textContent = gameState.timer;
  el.level.textContent = gameState.level;
}

function updateProgress() {
  const p = (gameState.completedTargets / gameState.totalTargets) * 100;
  el.progressBar.style.width = `${p}%`;
  el.progressText.textContent = `${gameState.completedTargets} / ${gameState.totalTargets}`;
}

function endGame() {
  gameState.isPlaying = false;
  clearInterval(gameState.timerInterval);
  playSound("gameover");

  const accuracy = gameState.totalKeys > 0 ? Math.round((gameState.correctKeys / gameState.totalKeys) * 100) : 0;

  let stars;
  if (accuracy >= 90 && gameState.completedTargets >= gameState.totalTargets) stars = "⭐⭐⭐";
  else if (accuracy >= 70) stars = "⭐⭐";
  else if (accuracy >= 50) stars = "⭐";
  else stars = "💪 ฝึกต่อไปนะ!";

  let title = "🎉 เยี่ยมมาก!";
  if (accuracy >= 90) title = "🏆 สุดยอด!";
  else if (accuracy >= 70) title = "🌟 ทำได้ดี!";
  else if (accuracy < 50) title = "💪 พยายามได้ดี!";

  if (accuracy >= 70) fx.confetti();
  Store.setBest("typing_" + gameState.mode, gameState.score);

  el.gameArea.style.display = "none";
  el.controls.style.display = "none";
  el.resultsScreen.style.display = "block";
  el.resultsTitle.textContent = title;
  el.finalScore.textContent = gameState.score;
  el.finalAccuracy.textContent = `${accuracy}%`;
  el.finalStreak.textContent = gameState.bestStreak;
  el.finalWords.textContent = gameState.completedTargets;
  el.starsEarned.textContent = stars;
}

function goToMenu() {
  gameState.isPlaying = false;
  clearInterval(gameState.timerInterval);
  if (speechSynth) speechSynth.cancel();
  el.modeSelection.style.display = "block";
  el.gameArea.style.display = "none";
  el.resultsScreen.style.display = "none";
  el.controls.style.display = "none";
  gameState.score = 0; gameState.streak = 0; gameState.timer = 60; gameState.level = 1;
  updateStats();
  el.timer.style.color = "";
}

function pauseGame() {
  gameState.isPaused = !gameState.isPaused;
  const btn = $("#btnPause");
  if (gameState.isPaused) { btn.textContent = "▶️ เล่นต่อ"; el.playerInput.disabled = true; }
  else { btn.textContent = "⏸️ พัก"; el.playerInput.disabled = false; el.playerInput.focus(); }
}

function hearAgain() { if (gameState.currentTarget) pronounceTarget(gameState.currentTarget); }

// ---------- ผูกปุ่มและอินพุต ----------
$$(".mode-card").forEach(card =>
  card.addEventListener("click", () => { Sound.click(); selectMode(card.dataset.mode); }));

$("#btnHearAgain").addEventListener("click", hearAgain);
$("#btnPlayAgain").addEventListener("click", () => selectMode(gameState.mode));
$("#btnMenu").addEventListener("click", goToMenu);
$("#btnPause").addEventListener("click", pauseGame);
$("#btnToMenu").addEventListener("click", goToMenu);

// คีย์บอร์ดจริง
document.addEventListener("keydown", (e) => {
  if (!gameState.isPlaying || gameState.isPaused) return;
  const key = e.key;
  if (key.length === 1 && /[a-zA-Z ]/.test(key)) {
    e.preventDefault();
    const keyEl = document.querySelector(`[data-key="${key.toLowerCase()}"]`);
    if (keyEl) { keyEl.classList.add("active"); setTimeout(() => keyEl.classList.remove("active"), 150); }
    if (gameState.mode === "letters") el.playerInput.value = key.toUpperCase();
    else el.playerInput.value += key.toLowerCase();
    handleInput(key);
  }
});

// คีย์บอร์ดเสมือน (คลิก)
$$(".key").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!gameState.isPlaying || gameState.isPaused) return;
    const key = btn.dataset.key;
    btn.classList.add("active");
    setTimeout(() => btn.classList.remove("active"), 150);
    if (gameState.mode === "letters") el.playerInput.value = key.toUpperCase();
    else el.playerInput.value += key.toLowerCase();
    handleInput(key);
    el.playerInput.focus();
  });
});

// ป้องกันการพิมพ์ตรงในช่อง (เราจัดการเองผ่าน keydown)
el.playerInput.addEventListener("keydown", (e) => { if (gameState.isPlaying) e.preventDefault(); });
el.gameArea.addEventListener("click", () => el.playerInput.focus());

updateStats();
