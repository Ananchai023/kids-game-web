/* =====================================================
   memory.js = "สมอง" ของเกมจับคู่การ์ด
   JavaScript ทำให้เว็บ "ขยับได้" และ "โต้ตอบกับเราได้"
   ===================================================== */

// รูปที่จะใช้ในเกม (8 แบบ = 8 คู่ = 16 การ์ด)
const emojis = ["🐶", "🐱", "🐰", "🦊", "🐼", "🐸", "🦁", "🐵"];

// ตัวแปรเก็บสถานะของเกม
let firstCard = null;   // การ์ดใบแรกที่ถูกเปิด
let secondCard = null;  // การ์ดใบที่สอง
let lockBoard = false;  // ล็อกกระดานชั่วคราวตอนกำลังตรวจว่าตรงกันไหม
let moves = 0;          // นับจำนวนครั้งที่พลิก
let pairsFound = 0;     // นับจำนวนคู่ที่จับได้

// ดึง element จากหน้าเว็บมาเก็บไว้ใช้งาน
const board = document.getElementById("board");
const movesText = document.getElementById("moves");
const pairsText = document.getElementById("pairs");
const messageText = document.getElementById("message");
const restartBtn = document.getElementById("restart");

// ฟังก์ชันสลับลำดับสิ่งของในอาเรย์ (สับไพ่ให้สุ่ม)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // สลับตำแหน่งกัน
  }
  return array;
}

// ฟังก์ชันเริ่มเกม / เริ่มใหม่
function startGame() {
  // รีเซ็ตค่าต่างๆ กลับเป็นเริ่มต้น
  board.innerHTML = "";
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  moves = 0;
  pairsFound = 0;
  movesText.textContent = moves;
  pairsText.textContent = pairsFound;
  messageText.textContent = "";

  // เอารูป 8 แบบมาทำเป็นคู่ (2 ชุด) แล้วสับให้สุ่ม
  const cards = shuffle([...emojis, ...emojis]);

  // สร้างการ์ดทีละใบใส่ลงกระดาน
  cards.forEach((emoji) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.emoji = emoji;               // จำว่าการ์ดนี้คือรูปอะไร
    card.innerHTML = `<span class="front">${emoji}</span>`;

    // เมื่อคลิกการ์ด ให้เรียกฟังก์ชัน flipCard
    card.addEventListener("click", () => flipCard(card));

    board.appendChild(card);
  });
}

// ฟังก์ชันพลิกการ์ด
function flipCard(card) {
  // ถ้ากระดานถูกล็อก หรือคลิกใบเดิมซ้ำ หรือการ์ดจับคู่ไปแล้ว => ไม่ทำอะไร
  if (lockBoard) return;
  if (card === firstCard) return;
  if (card.classList.contains("matched")) return;

  // เปิดการ์ด (โชว์รูป)
  card.classList.add("flipped");

  // ถ้ายังไม่มีการ์ดใบแรก ให้เก็บใบนี้เป็นใบแรก
  if (!firstCard) {
    firstCard = card;
    return;
  }

  // มาถึงตรงนี้แสดงว่านี่คือการ์ดใบที่สอง
  secondCard = card;
  moves++;                        // นับการพลิกเพิ่ม
  movesText.textContent = moves;

  checkMatch();                   // ตรวจว่าตรงกันไหม
}

// ฟังก์ชันตรวจว่าการ์ด 2 ใบตรงกันหรือไม่
function checkMatch() {
  const isMatch = firstCard.dataset.emoji === secondCard.dataset.emoji;

  if (isMatch) {
    // ตรงกัน! ทำให้เป็นสถานะ matched (สีเขียว เปิดค้างไว้)
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    pairsFound++;
    pairsText.textContent = pairsFound;
    resetTurn();

    // ถ้าครบ 8 คู่ = ชนะ
    if (pairsFound === emojis.length) {
      messageText.textContent = "🎉 เก่งมาก! จับคู่ได้ครบแล้ว!";
    }
  } else {
    // ไม่ตรงกัน ล็อกกระดานแล้วรอ 0.8 วินาที ค่อยพลิกกลับ
    lockBoard = true;
    setTimeout(() => {
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
      resetTurn();
    }, 800);
  }
}

// ฟังก์ชันเคลียร์ค่าเตรียมพลิกรอบใหม่
function resetTurn() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

// เมื่อกดปุ่มเริ่มใหม่ ให้เริ่มเกมใหม่
restartBtn.addEventListener("click", startGame);

// เริ่มเกมทันทีที่เปิดหน้าเว็บ
startGame();
