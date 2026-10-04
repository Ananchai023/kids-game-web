/* =====================================================
   common.js = เครื่องมือกลางที่ทุกเกมใช้ร่วมกัน
   - Sound  : เสียงเอฟเฟกต์ (ไม่ต้องมีไฟล์เสียง ใช้ Web Audio)
   - Store  : บันทึกคะแนนสูงสุด/สถิติ ลง localStorage
   - fx     : เอฟเฟกต์คอนเฟตติเวลาชนะ
   - helper : ฟังก์ชันช่วยเล็กๆ ($ , shuffle, randInt)
   โหลดไฟล์นี้ก่อนไฟล์เกมเสมอ
   ===================================================== */

/* ---------- helper สั้นๆ ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// สุ่มจำนวนเต็ม min..max (รวมปลายทั้งสอง)
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// สับลำดับอาเรย์แบบสุ่ม (คืนอาเรย์ใหม่ ไม่แก้ของเดิม)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* =====================================================
   Sound = เสียงเอฟเฟกต์ด้วย Web Audio API
   สร้างเสียง "ตุ๊ด/ตู๊ด" เองแบบสดๆ ไม่ต้องโหลดไฟล์เสียง
   ===================================================== */
const Sound = (() => {
  let ctx = null;
  let enabled = true;

  // เปิด/ปิดเสียง แล้วจำไว้ใน localStorage
  try {
    enabled = localStorage.getItem("kg_sound") !== "off";
  } catch { /* ไม่มี localStorage ก็ไม่เป็นไร */ }

  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { ctx = null; }
    }
    return ctx;
  }

  // เล่นโน้ต 1 ตัว
  function tone(freq, dur = 0.12, type = "sine", vol = 0.15) {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      osc.connect(gain); gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + dur);
    } catch { /* เงียบไว้ ถ้าเบราว์เซอร์ไม่รองรับ */ }
  }

  // เล่นทำนองสั้นๆ (ลิสต์ของ [ความถี่, หน่วงเวลาเริ่ม])
  function melody(notes, type = "sine") {
    notes.forEach(([f, t]) => setTimeout(() => tone(f, 0.16, type), t));
  }

  return {
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem("kg_sound", enabled ? "on" : "off"); } catch {}
      return enabled;
    },
    // ปลุก AudioContext หลังผู้ใช้แตะครั้งแรก (นโยบายเบราว์เซอร์)
    resume() { const c = ac(); if (c && c.state === "suspended") c.resume(); },

    click:   () => tone(440, 0.07, "triangle"),
    flip:    () => tone(520, 0.08, "triangle"),
    correct: () => { tone(660, 0.1); setTimeout(() => tone(880, 0.14), 90); },
    wrong:   () => tone(160, 0.25, "sawtooth"),
    pop:     () => tone(720, 0.06, "square", 0.12),
    levelup: () => melody([[523, 0], [659, 90], [784, 180], [1047, 270]]),
    win:     () => melody([[523, 0], [659, 130], [784, 260], [1046, 390], [1318, 520]]),
    lose:    () => melody([[392, 0], [330, 160], [262, 320]], "triangle"),
  };
})();

// ปลุกเสียงหลังการแตะ/คลิกครั้งแรก
["click", "keydown", "touchstart"].forEach(ev =>
  window.addEventListener(ev, () => Sound.resume(), { once: true }));

/* =====================================================
   Store = บันทึกคะแนนสูงสุด/สถิติลง localStorage
   ใช้ key แยกตามเกม เช่น "kg_best_math"
   ===================================================== */
const Store = {
  getBest(gameKey) {
    try { return Number(localStorage.getItem("kg_best_" + gameKey)) || 0; }
    catch { return 0; }
  },
  // บันทึกถ้าคะแนนใหม่มากกว่าเดิม คืน true ถ้าทำสถิติใหม่
  setBest(gameKey, score) {
    const best = Store.getBest(gameKey);
    if (score > best) {
      try { localStorage.setItem("kg_best_" + gameKey, String(score)); } catch {}
      return true;
    }
    return false;
  },
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem("kg_" + key);
      return v == null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("kg_" + key, JSON.stringify(value)); } catch {}
  },
};

/* =====================================================
   fx = เอฟเฟกต์คอนเฟตติ (กระดาษสีปลิว) ตอนชนะ
   ===================================================== */
const fx = {
  confetti(count = 40) {
    const colors = ["#ff5e7e", "#4facfe", "#43e97b", "#fdcb6e", "#a29bfe", "#00cec9"];
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "confetti-piece";
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDelay = Math.random() * 0.3 + "s";
      p.style.animationDuration = 1 + Math.random() * 1.2 + "s";
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 2600);
    }
  }
};

/* =====================================================
   ปุ่มเปิด/ปิดเสียงลอยมุมจอ (ใส่อัตโนมัติทุกหน้าเกม)
   ===================================================== */
function mountSoundToggle() {
  if (document.getElementById("soundToggle")) return;
  const btn = document.createElement("button");
  btn.id = "soundToggle";
  btn.className = "sound-toggle";
  const paint = () => (btn.textContent = Sound.enabled ? "🔊" : "🔇");
  paint();
  btn.title = "เปิด/ปิดเสียง";
  btn.addEventListener("click", () => { Sound.toggle(); paint(); Sound.click(); });
  document.body.appendChild(btn);
}
document.addEventListener("DOMContentLoaded", mountSoundToggle);
