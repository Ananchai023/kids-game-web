/* =====================================================
   catch.js = "สมอง" ของเกมจับผลไม้
   ผลไม้จะโผล่ขึ้นมาเรื่อยๆ คลิกให้ทันก่อนหายไปเพื่อได้คะแนน
   มีเวลาจำกัด 30 วินาที
   ===================================================== */

// ดึง element ที่ต้องใช้
const area = document.getElementById("area");
const scoreText = document.getElementById("score");
const timeText = document.getElementById("time");
const messageText = document.getElementById("message");
const startBtn = document.getElementById("start");

// รูปผลไม้ที่จะสุ่มออกมา
const fruits = ["🍎", "🍌", "🍓", "🍊", "🍇", "🍉", "🍑", "🥝"];

let score = 0;         // คะแนน
let timeLeft = 30;     // เวลาที่เหลือ (วินาที)
let spawnTimer = null; // ตัวจับเวลาสำหรับปล่อยผลไม้
let countdownTimer = null; // ตัวจับเวลานับถอยหลัง
let playing = false;   // กำลังเล่นอยู่หรือไม่

// ฟังก์ชันสุ่มเลขทศนิยมระหว่าง min ถึง max
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// ฟังก์ชันปล่อยผลไม้ 1 ลูก
function spawnFruit() {
  const fruit = document.createElement("div");
  fruit.className = "fruit";
  // สุ่มรูปผลไม้
  fruit.textContent = fruits[Math.floor(Math.random() * fruits.length)];

  // สุ่มตำแหน่งแนวนอน (ซ้าย-ขวา) ภายในพื้นที่เล่น
  const maxLeft = area.clientWidth - 50;
  fruit.style.left = randomBetween(0, maxLeft) + "px";
  fruit.style.top = "-50px"; // เริ่มจากเหนือกรอบเล็กน้อย

  // เมื่อคลิกโดนผลไม้ => ได้คะแนน แล้วผลไม้หายไป
  fruit.addEventListener("click", () => {
    if (!playing) return;
    score++;
    scoreText.textContent = score;
    fruit.remove();
  });

  area.appendChild(fruit);

  // ทำให้ผลไม้ "ตกลงมา" ด้วยการขยับ top เรื่อยๆ
  let posY = -50;
  const fallSpeed = randomBetween(2, 4); // ความเร็วตกต่างกันในแต่ละลูก
  const fallTimer = setInterval(() => {
    posY += fallSpeed;
    fruit.style.top = posY + "px";

    // ถ้าตกพ้นพื้นที่แล้ว ให้ลบทิ้งและหยุดจับเวลาลูกนี้
    if (posY > area.clientHeight) {
      fruit.remove();
      clearInterval(fallTimer);
    }
  }, 16); // ~60 ครั้งต่อวินาที ทำให้ขยับลื่นไหล
}

// ฟังก์ชันเริ่มเกม
function startGame() {
  // ถ้ากำลังเล่นอยู่แล้ว ไม่ต้องเริ่มซ้ำ
  if (playing) return;

  // รีเซ็ตค่า
  playing = true;
  score = 0;
  timeLeft = 30;
  scoreText.textContent = score;
  timeText.textContent = timeLeft;
  messageText.textContent = "";
  area.innerHTML = "";

  // ปล่อยผลไม้ทุก 0.7 วินาที
  spawnTimer = setInterval(spawnFruit, 700);

  // นับถอยหลังทุก 1 วินาที
  countdownTimer = setInterval(() => {
    timeLeft--;
    timeText.textContent = timeLeft;
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

// ฟังก์ชันจบเกม
function endGame() {
  playing = false;
  clearInterval(spawnTimer);       // หยุดปล่อยผลไม้
  clearInterval(countdownTimer);   // หยุดนับเวลา
  area.innerHTML = "";             // เคลียร์ผลไม้ที่เหลือ
  messageText.textContent = `⏰ หมดเวลา! ได้ ${score} คะแนน เก่งมาก!`;
}

// เมื่อกดปุ่มเริ่ม ให้เริ่มเกม
startBtn.addEventListener("click", startGame);
