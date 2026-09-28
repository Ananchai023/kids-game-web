/* =====================================================
   math.js = "สมอง" ของเกมบวกเลข
   สุ่มโจทย์บวกเลข แล้วให้เด็กเลือกคำตอบที่ถูก
   ===================================================== */

// ดึง element ที่ต้องใช้จากหน้าเว็บ
const questionText = document.getElementById("question");
const choicesBox = document.getElementById("choices");
const scoreText = document.getElementById("score");
const messageText = document.getElementById("message");

let score = 0;   // คะแนนสะสม
let answer = 0;  // คำตอบที่ถูกต้องของโจทย์ปัจจุบัน

// ฟังก์ชันสุ่มตัวเลข 1 ถึง max
function randomNumber(max) {
  return Math.floor(Math.random() * max) + 1;
}

// ฟังก์ชันสร้างโจทย์ใหม่
function newQuestion() {
  messageText.textContent = "";

  // สุ่มเลข 2 ตัว (1-10)
  const a = randomNumber(10);
  const b = randomNumber(10);
  answer = a + b;                        // คำตอบที่ถูกต้อง

  // แสดงโจทย์ เช่น "3 + 5 = ?"
  questionText.textContent = `${a} + ${b} = ?`;

  // สร้างตัวเลือกคำตอบ: ต้องมีคำตอบที่ถูก + คำตอบหลอกอีก 2 ตัว
  const options = [answer];
  while (options.length < 3) {
    // สุ่มคำตอบหลอก โดยบวก/ลบจากคำตอบจริงเล็กน้อย
    const wrong = answer + (randomNumber(6) - 3);
    // ต้องไม่ติดลบ และต้องไม่ซ้ำกับที่มีอยู่
    if (wrong >= 0 && !options.includes(wrong)) {
      options.push(wrong);
    }
  }

  // สับตัวเลือกให้สลับตำแหน่ง
  shuffle(options);

  // ล้างปุ่มเก่า แล้วสร้างปุ่มใหม่ตามตัวเลือก
  choicesBox.innerHTML = "";
  options.forEach((value) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = value;
    btn.addEventListener("click", () => checkAnswer(value));
    choicesBox.appendChild(btn);
  });
}

// ฟังก์ชันสับลำดับ (สุ่มตำแหน่งในอาเรย์)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ฟังก์ชันตรวจคำตอบ
function checkAnswer(chosen) {
  if (chosen === answer) {
    // ตอบถูก! บวกคะแนน แล้วออกโจทย์ใหม่
    score++;
    scoreText.textContent = score;
    messageText.textContent = "✅ เก่งมาก ถูกต้อง!";
    setTimeout(newQuestion, 700);
  } else {
    // ตอบผิด ให้ลองใหม่
    messageText.textContent = "❌ ลองอีกครั้งนะ";
  }
}

// เริ่มเกมด้วยการออกโจทย์แรก
newQuestion();
