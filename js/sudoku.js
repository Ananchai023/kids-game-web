/* sudoku.js — ตัวควบคุมหน้าจอและสถานะเกมซูโดกุ (พอร์ตจากเกมเดิม)
 * ปรับปรุง: ข้อความภาษาไทย, ทำงานร่วมกับหน้ารวมเกม, มีปุ่มใบ้/undo/โน้ต/กระดานผู้เล่น
 */
(() => {
  const E = SudokuEngine;
  const STORAGE_KEY = "sudoku.save.v1";
  const MAX_MISTAKES = 3;

  const storage = (() => {
    let ok = false;
    try { const t = "__sudoku_test__"; localStorage.setItem(t, "1"); localStorage.removeItem(t); ok = true; }
    catch (e) { ok = false; }
    let mem = null;
    return {
      get() { if (ok) { try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return mem; } } return mem; },
      set(v) { if (ok) { try { localStorage.setItem(STORAGE_KEY, v); return; } catch (e) {} } mem = v; },
    };
  })();

  let state = null;
  let cfg = null;
  let timerId = null;
  let pendingSize = "9x9";

  const boardEl = document.getElementById("board");
  const numpadEl = document.getElementById("numpad");
  const timerEl = document.getElementById("timer");
  const mistakesEl = document.getElementById("mistakes");
  const sizeLabelEl = document.getElementById("sizeLabel");
  const difficultyLabelEl = document.getElementById("difficultyLabel");
  const notesStateEl = document.getElementById("notesState");
  const notesBtn = document.getElementById("notesBtn");
  const playerNameEl = document.getElementById("playerName");
  const playerAvatarEl = document.getElementById("playerAvatar");

  let cells = [];

  const DIFF_TH = { easy: "ง่าย", medium: "ปานกลาง", hard: "ยาก", expert: "โหด" };
  function diffLabel(d) { return DIFF_TH[d] || cap(d); }

  function buildBoard(config) {
    cfg = config;
    boardEl.style.setProperty("--n", cfg.SIZE);
    boardEl.innerHTML = "";
    cells = [];
    for (let i = 0; i < cfg.CELLS; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      const r = cfg.rowOf(i), c = cfg.colOf(i);
      cell.dataset.i = i;
      cell.setAttribute("role", "gridcell");
      if ((c + 1) % cfg.boxCols === 0 && c !== cfg.SIZE - 1) cell.classList.add("box-right");
      if ((r + 1) % cfg.boxRows === 0 && r !== cfg.SIZE - 1) cell.classList.add("box-bottom");
      cell.addEventListener("click", () => selectCell(i));
      boardEl.appendChild(cell);
      cells.push(cell);
    }
    numpadEl.style.setProperty("--keys", cfg.SIZE);
    numpadEl.innerHTML = "";
    for (let n = 1; n <= cfg.SIZE; n++) {
      const btn = document.createElement("button");
      btn.className = "num";
      btn.dataset.num = n;
      btn.textContent = n;
      numpadEl.appendChild(btn);
    }
  }

  function newGame(sizeKey, difficulty) {
    const config = E.configFor(sizeKey);
    buildBoard(config);
    const { puzzle, solution } = E.generate(config, difficulty);
    state = {
      sizeKey, puzzle, solution, board: puzzle.slice(),
      notes: Array.from({ length: config.CELLS }, () => new Set()),
      fixed: puzzle.map((v) => v !== 0),
      selected: null, notesMode: false, mistakes: 0, difficulty,
      seconds: 0, done: false, won: false, history: [],
    };
    sizeLabelEl.textContent = E.SIZES[sizeKey].label;
    difficultyLabelEl.textContent = diffLabel(difficulty);
    closeAllOverlays();
    updateNotesButton();
    render();
    startTimer();
    save();
  }

  function startTimer() {
    stopTimer();
    timerId = setInterval(() => {
      if (state && !state.done) { state.seconds++; timerEl.textContent = formatTime(state.seconds); }
    }, 1000);
  }
  function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; }
  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  function selectCell(i) { if (!state || state.done) return; state.selected = i; render(); }

  function enterNumber(n) {
    if (!state || state.done) return;
    if (n < 1 || n > cfg.SIZE) return;
    const i = state.selected;
    if (i == null || state.fixed[i]) return;

    if (state.notesMode) {
      if (state.board[i] !== 0) return;
      pushHistory();
      const set = state.notes[i];
      if (set.has(n)) set.delete(n); else set.add(n);
      render(); save(); return;
    }

    pushHistory();
    state.notes[i].clear();

    if (state.board[i] === n) { state.board[i] = 0; render(); save(); return; }
    state.board[i] = n;

    if (state.solution[i] !== n) {
      state.mistakes++;
      updateMistakes();
      buzz();
      if (typeof Sound !== "undefined") Sound.wrong();
      if (state.mistakes >= MAX_MISTAKES) { render(); save(); gameOver(); return; }
    } else {
      if (typeof Sound !== "undefined") Sound.pop();
      clearPeerNotes(i, n);
    }
    render(); save(); checkWin();
  }

  function clearPeerNotes(i, n) {
    const r = cfg.rowOf(i), c = cfg.colOf(i), b = cfg.boxOf(i);
    for (let j = 0; j < cfg.CELLS; j++) {
      if (cfg.rowOf(j) === r || cfg.colOf(j) === c || cfg.boxOf(j) === b) state.notes[j].delete(n);
    }
  }

  function erase() {
    if (!state || state.done) return;
    const i = state.selected;
    if (i == null || state.fixed[i]) return;
    pushHistory();
    state.board[i] = 0;
    state.notes[i].clear();
    render(); save();
  }

  function toggleNotes() { if (!state) return; state.notesMode = !state.notesMode; updateNotesButton(); }
  function updateNotesButton() {
    const on = state && state.notesMode;
    notesStateEl.textContent = on ? "เปิด" : "ปิด";
    notesBtn.classList.toggle("active", !!on);
  }

  function hint() {
    if (!state || state.done) return;
    let i = state.selected;
    if (i == null || state.fixed[i] || state.board[i] === state.solution[i]) {
      i = state.board.findIndex((v, idx) => v !== state.solution[idx]);
      if (i === -1) return;
      state.selected = i;
    }
    pushHistory();
    state.board[i] = state.solution[i];
    state.notes[i].clear();
    clearPeerNotes(i, state.solution[i]);
    render();
    cells[i].classList.add("hinted");
    setTimeout(() => cells[i] && cells[i].classList.remove("hinted"), 400);
    save(); checkWin();
  }

  function pushHistory() {
    state.history.push({
      board: state.board.slice(),
      notes: state.notes.map((s) => new Set(s)),
      mistakes: state.mistakes,
    });
    if (state.history.length > 100) state.history.shift();
  }
  function undo() {
    if (!state || state.done || state.history.length === 0) return;
    const prev = state.history.pop();
    state.board = prev.board;
    state.notes = prev.notes;
    state.mistakes = prev.mistakes;
    updateMistakes();
    render(); save();
  }

  function checkWin() {
    if (!state || state.done) return;
    if (E.isComplete(cfg, state.board)) {
      state.done = true; state.won = true;
      stopTimer();
      const total = Players.recordWin(state.sizeKey, state.difficulty);
      save();
      if (typeof Sound !== "undefined") Sound.win();
      if (typeof fx !== "undefined") fx.confetti();
      showWin(total);
    }
  }
  function gameOver() {
    state.done = true; state.won = false;
    stopTimer();
    if (typeof Sound !== "undefined") Sound.lose();
    showGameOver();
  }

  function showWin(total) {
    document.getElementById("winTitle").textContent = "แก้สำเร็จ!";
    document.querySelector("#winOverlay .win-emoji").textContent = "🎉";
    const player = Players.getCurrent();
    const who = player ? `${player.name} · ผ่านแล้ว ${total} ด่าน` : "";
    document.getElementById("winStats").textContent =
      `${E.SIZES[state.sizeKey].label} ${diffLabel(state.difficulty)} · ${formatTime(state.seconds)}` + (who ? ` · ${who}` : "");
    document.getElementById("winOverlay").classList.remove("hidden");
  }

  function showGameOver() {
    document.getElementById("winTitle").textContent = "เกมจบแล้ว";
    document.querySelector("#winOverlay .win-emoji").textContent = "😵";
    document.getElementById("winStats").textContent =
      `${E.SIZES[state.sizeKey].label} ${diffLabel(state.difficulty)} · ผิดครบ ${MAX_MISTAKES} ครั้ง`;
    document.getElementById("winOverlay").classList.remove("hidden");
  }

  function updateMistakes() { mistakesEl.textContent = `${state.mistakes}/${MAX_MISTAKES}`; }

  function render() {
    if (!state) return;
    const sel = state.selected;
    const selVal = sel != null ? state.board[sel] : 0;
    const conflicts = E.findConflicts(cfg, state.board);
    const counts = new Array(cfg.SIZE + 1).fill(0);
    for (const v of state.board) if (v) counts[v]++;

    for (let i = 0; i < cfg.CELLS; i++) {
      const cell = cells[i];
      const v = state.board[i];
      cell.classList.remove("fixed", "peer", "same", "selected", "error");
      if (state.fixed[i]) cell.classList.add("fixed");
      if (sel != null && i !== sel) {
        if (cfg.rowOf(i) === cfg.rowOf(sel) || cfg.colOf(i) === cfg.colOf(sel) || cfg.boxOf(i) === cfg.boxOf(sel)) cell.classList.add("peer");
        if (v !== 0 && v === selVal) cell.classList.add("same");
      }
      if (i === sel) cell.classList.add("selected");
      if (conflicts.has(i) && !state.fixed[i]) cell.classList.add("error");

      if (v !== 0) {
        cell.textContent = v;
      } else if (state.notes[i].size > 0) {
        cell.textContent = "";
        const notes = document.createElement("div");
        notes.className = "notes";
        notes.style.gridTemplateColumns = `repeat(${cfg.boxCols}, 1fr)`;
        notes.style.gridTemplateRows = `repeat(${cfg.boxRows}, 1fr)`;
        for (let n = 1; n <= cfg.SIZE; n++) {
          const span = document.createElement("span");
          span.textContent = state.notes[i].has(n) ? n : "";
          notes.appendChild(span);
        }
        cell.appendChild(notes);
      } else {
        cell.textContent = "";
      }
    }

    numpadEl.querySelectorAll(".num").forEach((btn) => {
      const n = Number(btn.dataset.num);
      btn.classList.toggle("done", counts[n] >= cfg.SIZE);
    });

    timerEl.textContent = formatTime(state.seconds);
    updateMistakes();
  }

  function save() {
    if (!state) return;
    try {
      const data = {
        sizeKey: state.sizeKey, puzzle: state.puzzle, solution: state.solution, board: state.board,
        notes: state.notes.map((s) => [...s]), fixed: state.fixed, mistakes: state.mistakes,
        difficulty: state.difficulty, seconds: state.seconds, done: state.done, won: state.won,
      };
      storage.set(JSON.stringify(data));
    } catch (e) {}
  }
  function load() {
    try {
      const raw = storage.get();
      if (!raw) return false;
      const d = JSON.parse(raw);
      const sizeKey = d.sizeKey || "9x9";
      const config = E.configFor(sizeKey);
      if (!d || !Array.isArray(d.board) || d.board.length !== config.CELLS) return false;
      buildBoard(config);
      state = {
        sizeKey, puzzle: d.puzzle, solution: d.solution, board: d.board,
        notes: d.notes.map((arr) => new Set(arr)), fixed: d.fixed,
        selected: null, notesMode: false, mistakes: d.mistakes || 0,
        difficulty: d.difficulty || "easy", seconds: d.seconds || 0,
        done: !!d.done, won: !!d.won, history: [],
      };
      sizeLabelEl.textContent = E.SIZES[sizeKey].label;
      difficultyLabelEl.textContent = diffLabel(state.difficulty);
      updateNotesButton();
      render();
      if (!state.done) startTimer();
      return true;
    } catch (e) { return false; }
  }

  function closeAllOverlays() {
    ["overlay", "winOverlay", "playerOverlay", "statsOverlay"].forEach((id) =>
      document.getElementById(id).classList.add("hidden"));
  }
  function openDialog() {
    document.querySelectorAll(".size-btn").forEach((b) => b.classList.toggle("selected", b.dataset.size === pendingSize));
    const cancelBtn = document.getElementById("cancelDialog");
    cancelBtn.style.display = state ? "" : "none";
    document.getElementById("overlay").classList.remove("hidden");
  }
  function closeDialog() { if (!state) return; document.getElementById("overlay").classList.add("hidden"); }

  function refreshPlayerChip() {
    const p = Players.getCurrent();
    if (p) { playerNameEl.textContent = p.name; playerAvatarEl.textContent = Players.initials(p.name); }
    else { playerNameEl.textContent = "ผู้เล่น"; playerAvatarEl.textContent = "?"; }
  }

  function openPlayerDialog() { renderPlayerList(); document.getElementById("playerOverlay").classList.remove("hidden"); }

  function renderPlayerList() {
    const list = document.getElementById("playerList");
    list.innerHTML = "";
    const players = Players.all();
    const current = Players.getCurrent();
    if (players.length === 0) {
      const empty = document.createElement("p");
      empty.className = "lb-empty";
      empty.textContent = "ยังไม่มีผู้เล่น เพิ่มด้านล่างได้เลย";
      list.appendChild(empty);
    }
    players.forEach((p) => {
      const row = document.createElement("div");
      row.className = "player-row" + (current && current.id === p.id ? " current" : "");
      row.innerHTML = `
        <span class="avatar">${escapeHtml(Players.initials(p.name))}</span>
        <span class="info"><span class="nm">${escapeHtml(p.name)}</span><span class="sub">ผ่านแล้ว ${p.total || 0} ด่าน</span></span>
        <button class="del" aria-label="ลบ">🗑</button>`;
      row.addEventListener("click", (e) => {
        if (e.target.closest(".del")) return;
        Players.setCurrent(p.id); refreshPlayerChip(); renderPlayerList();
      });
      row.querySelector(".del").addEventListener("click", (e) => {
        e.stopPropagation(); Players.remove(p.id); refreshPlayerChip(); renderPlayerList();
      });
      list.appendChild(row);
    });
  }

  function addPlayer() {
    const input = document.getElementById("newPlayerInput");
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    Players.add(name);
    input.value = "";
    refreshPlayerChip(); renderPlayerList();
  }

  function openStats() { renderLeaderboard(); document.getElementById("statsOverlay").classList.remove("hidden"); }

  function renderLeaderboard() {
    const board = document.getElementById("leaderboard");
    board.innerHTML = "";
    const rows = Players.leaderboard();
    const current = Players.getCurrent();
    if (rows.length === 0) {
      const empty = document.createElement("p");
      empty.className = "lb-empty";
      empty.textContent = "ยังไม่มีผู้เล่น เพิ่มผู้เล่นเพื่อเริ่มเก็บสถิติ";
      board.appendChild(empty);
      return;
    }
    rows.forEach((p, idx) => {
      const rowEl = document.createElement("div");
      rowEl.className = "lb-row" + (current && current.id === p.id ? " me" : "");
      const pills = Players.breakdown(p).map((b) =>
        `<span class="lb-pill">${sizeShort(b.sizeKey)} ${diffLabel(b.difficulty)}: ${b.count}</span>`).join("");
      rowEl.innerHTML = `
        <div class="lb-head"><span class="lb-rank">${idx + 1}</span><span class="lb-name">${escapeHtml(p.name)}</span><span class="lb-total">${p.total || 0}</span></div>
        <div class="lb-breakdown">${pills || '<span class="lb-pill">ยังไม่มีชัยชนะ</span>'}</div>`;
      board.appendChild(rowEl);
    });
  }

  function sizeShort(sizeKey) { return (E.SIZES[sizeKey] || {}).label || sizeKey; }

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function buzz() { if (navigator.vibrate) navigator.vibrate(60); }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function bindEvents() {
    numpadEl.addEventListener("click", (e) => { const btn = e.target.closest(".num"); if (btn) enterNumber(Number(btn.dataset.num)); });
    document.getElementById("undoBtn").addEventListener("click", undo);
    document.getElementById("eraseBtn").addEventListener("click", erase);
    document.getElementById("hintBtn").addEventListener("click", hint);
    notesBtn.addEventListener("click", toggleNotes);

    document.getElementById("newGameBtn").addEventListener("click", openDialog);
    document.getElementById("cancelDialog").addEventListener("click", closeDialog);
    document.getElementById("overlay").addEventListener("click", (e) => { if (e.target.id === "overlay") closeDialog(); });

    document.querySelectorAll(".size-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        pendingSize = btn.dataset.size;
        document.querySelectorAll(".size-btn").forEach((b) => b.classList.toggle("selected", b === btn));
      });
    });
    document.querySelectorAll(".diff-btn").forEach((btn) => {
      btn.addEventListener("click", () => newGame(pendingSize, btn.dataset.diff));
    });

    document.getElementById("playAgain").addEventListener("click", () => {
      document.getElementById("winOverlay").classList.add("hidden");
      openDialog();
    });

    document.getElementById("playerBtn").addEventListener("click", openPlayerDialog);
    document.getElementById("addPlayerBtn").addEventListener("click", addPlayer);
    document.getElementById("newPlayerInput").addEventListener("keydown", (e) => { if (e.key === "Enter") addPlayer(); });
    document.getElementById("closePlayer").addEventListener("click", () => document.getElementById("playerOverlay").classList.add("hidden"));
    document.getElementById("playerOverlay").addEventListener("click", (e) => { if (e.target.id === "playerOverlay") e.currentTarget.classList.add("hidden"); });

    document.getElementById("statsBtn").addEventListener("click", openStats);
    document.getElementById("closeStats").addEventListener("click", () => document.getElementById("statsOverlay").classList.add("hidden"));
    document.getElementById("statsOverlay").addEventListener("click", (e) => { if (e.target.id === "statsOverlay") e.currentTarget.classList.add("hidden"); });

    document.addEventListener("keydown", (e) => {
      if (!state) return;
      const num = Number(e.key);
      if (Number.isInteger(num) && num >= 1 && num <= cfg.SIZE) enterNumber(num);
      else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") erase();
      else if (e.key === "n" || e.key === "N") toggleNotes();
      else if (state.selected != null && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault(); moveSelection(e.key);
      }
    });
  }

  function moveSelection(key) {
    let r = cfg.rowOf(state.selected), c = cfg.colOf(state.selected);
    if (key === "ArrowUp") r = Math.max(0, r - 1);
    if (key === "ArrowDown") r = Math.min(cfg.SIZE - 1, r + 1);
    if (key === "ArrowLeft") c = Math.max(0, c - 1);
    if (key === "ArrowRight") c = Math.min(cfg.SIZE - 1, c + 1);
    selectCell(r * cfg.SIZE + c);
  }

  function init() {
    bindEvents();
    refreshPlayerChip();
    if (!load()) newGame("9x9", "easy");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
