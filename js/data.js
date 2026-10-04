/* =====================================================
   data.js = คลังคำศัพท์แบ่งตามหมวด ใช้ร่วมกันในเกมจับคู่การ์ด และเกมทายคำศัพท์
   แต่ละคำ: emoji (รูป), th (ภาษาไทย), en (ภาษาอังกฤษ)
   ===================================================== */
const GAME_DATA = {
  animals: {
    name: "สัตว์", icon: "🐶",
    items: [
      { emoji: "🐶", th: "หมา", en: "Dog" },
      { emoji: "🐱", th: "แมว", en: "Cat" },
      { emoji: "🐰", th: "กระต่าย", en: "Rabbit" },
      { emoji: "🐻", th: "หมี", en: "Bear" },
      { emoji: "🦁", th: "สิงโต", en: "Lion" },
      { emoji: "🐘", th: "ช้าง", en: "Elephant" },
      { emoji: "🐸", th: "กบ", en: "Frog" },
      { emoji: "🐟", th: "ปลา", en: "Fish" },
      { emoji: "🐴", th: "ม้า", en: "Horse" },
      { emoji: "🐷", th: "หมู", en: "Pig" },
      { emoji: "🐔", th: "ไก่", en: "Chicken" },
      { emoji: "🦋", th: "ผีเสื้อ", en: "Butterfly" }
    ]
  },
  fruits: {
    name: "ผลไม้", icon: "🍎",
    items: [
      { emoji: "🍎", th: "แอปเปิ้ล", en: "Apple" },
      { emoji: "🍌", th: "กล้วย", en: "Banana" },
      { emoji: "🍇", th: "องุ่น", en: "Grape" },
      { emoji: "🍉", th: "แตงโม", en: "Watermelon" },
      { emoji: "🍓", th: "สตรอเบอร์รี่", en: "Strawberry" },
      { emoji: "🍊", th: "ส้ม", en: "Orange" },
      { emoji: "🍍", th: "สับปะรด", en: "Pineapple" },
      { emoji: "🥭", th: "มะม่วง", en: "Mango" },
      { emoji: "🍑", th: "ท้อ", en: "Peach" },
      { emoji: "🍒", th: "เชอร์รี่", en: "Cherry" },
      { emoji: "🥥", th: "มะพร้าว", en: "Coconut" },
      { emoji: "🍋", th: "มะนาว", en: "Lemon" }
    ]
  },
  colors: {
    name: "สี", icon: "🎨",
    items: [
      { emoji: "🔴", th: "สีแดง", en: "Red" },
      { emoji: "🟠", th: "สีส้ม", en: "Orange" },
      { emoji: "🟡", th: "สีเหลือง", en: "Yellow" },
      { emoji: "🟢", th: "สีเขียว", en: "Green" },
      { emoji: "🔵", th: "สีน้ำเงิน", en: "Blue" },
      { emoji: "🟣", th: "สีม่วง", en: "Purple" },
      { emoji: "⚫", th: "สีดำ", en: "Black" },
      { emoji: "⚪", th: "สีขาว", en: "White" },
      { emoji: "🟤", th: "สีน้ำตาล", en: "Brown" },
      { emoji: "🩷", th: "สีชมพู", en: "Pink" }
    ]
  },
  food: {
    name: "อาหาร", icon: "🍕",
    items: [
      { emoji: "🍕", th: "พิซซ่า", en: "Pizza" },
      { emoji: "🍔", th: "แฮมเบอร์เกอร์", en: "Burger" },
      { emoji: "🍜", th: "ก๋วยเตี๋ยว", en: "Noodle" },
      { emoji: "🍚", th: "ข้าว", en: "Rice" },
      { emoji: "🥚", th: "ไข่", en: "Egg" },
      { emoji: "🍞", th: "ขนมปัง", en: "Bread" },
      { emoji: "🧀", th: "ชีส", en: "Cheese" },
      { emoji: "🍦", th: "ไอศกรีม", en: "Ice cream" },
      { emoji: "🍰", th: "เค้ก", en: "Cake" },
      { emoji: "🍩", th: "โดนัท", en: "Donut" },
      { emoji: "🥛", th: "นม", en: "Milk" },
      { emoji: "🍪", th: "คุกกี้", en: "Cookie" }
    ]
  },
  vehicles: {
    name: "ยานพาหนะ", icon: "🚗",
    items: [
      { emoji: "🚗", th: "รถยนต์", en: "Car" },
      { emoji: "🚌", th: "รถบัส", en: "Bus" },
      { emoji: "🚲", th: "จักรยาน", en: "Bicycle" },
      { emoji: "✈️", th: "เครื่องบิน", en: "Airplane" },
      { emoji: "🚀", th: "จรวด", en: "Rocket" },
      { emoji: "🚢", th: "เรือ", en: "Ship" },
      { emoji: "🚂", th: "รถไฟ", en: "Train" },
      { emoji: "🚁", th: "เฮลิคอปเตอร์", en: "Helicopter" },
      { emoji: "🏍️", th: "มอเตอร์ไซค์", en: "Motorcycle" },
      { emoji: "🚓", th: "รถตำรวจ", en: "Police car" }
    ]
  }
};
