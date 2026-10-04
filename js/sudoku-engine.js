/* sudoku-engine.js — เครื่องคำนวณซูโดกุ (สร้างโจทย์/แก้/ตรวจสอบ)
 * รองรับกระดานหลายขนาด กำหนดด้วยรูปกล่อง (boxRows x boxCols)
 * ขนาดกระดาน SIZE = boxRows * boxCols, ค่าตัวเลข 1..SIZE
 *   2x2 -> 4x4 (1..4), 2x3 -> 6x6 (1..6), 3x3 -> 9x9 (1..9)
 * ข้อมูลกระดานเป็นอาเรย์แบน ยาว SIZE*SIZE (0 = ช่องว่าง), index = row*SIZE + col
 */
const SudokuEngine = (() => {

  function createConfig(boxRows, boxCols) {
    const SIZE = boxRows * boxCols;
    const CELLS = SIZE * SIZE;
    const rowOf = (i) => Math.floor(i / SIZE);
    const colOf = (i) => i % SIZE;
    const boxOf = (i) => {
      const r = rowOf(i), c = colOf(i);
      return Math.floor(r / boxRows) * boxRows + Math.floor(c / boxCols);
    };
    return { boxRows, boxCols, SIZE, CELLS, rowOf, colOf, boxOf };
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function isValid(cfg, board, i, val) {
    const { SIZE, boxRows, boxCols } = cfg;
    const r = cfg.rowOf(i), c = cfg.colOf(i);
    const br = Math.floor(r / boxRows) * boxRows;
    const bc = Math.floor(c / boxCols) * boxCols;
    for (let k = 0; k < SIZE; k++) {
      if (board[r * SIZE + k] === val) return false;
      if (board[k * SIZE + c] === val) return false;
    }
    for (let dr = 0; dr < boxRows; dr++) {
      for (let dc = 0; dc < boxCols; dc++) {
        if (board[(br + dr) * SIZE + (bc + dc)] === val) return false;
      }
    }
    return true;
  }

  function range1(size) {
    const a = new Array(size);
    for (let i = 0; i < size; i++) a[i] = i + 1;
    return a;
  }

  function fillBoard(cfg, board) {
    const idx = board.indexOf(0);
    if (idx === -1) return true;
    const nums = shuffle(range1(cfg.SIZE));
    for (const n of nums) {
      if (isValid(cfg, board, idx, n)) {
        board[idx] = n;
        if (fillBoard(cfg, board)) return true;
        board[idx] = 0;
      }
    }
    return false;
  }

  function countSolutions(cfg, board, limit = 2) {
    const idx = board.indexOf(0);
    if (idx === -1) return 1;
    let count = 0;
    for (let n = 1; n <= cfg.SIZE; n++) {
      if (isValid(cfg, board, idx, n)) {
        board[idx] = n;
        count += countSolutions(cfg, board, limit);
        board[idx] = 0;
        if (count >= limit) return count;
      }
    }
    return count;
  }

  function solve(cfg, board) {
    const copy = board.slice();
    if (fillBoard(cfg, copy)) return copy;
    return null;
  }

  const KEEP_FRACTION = { easy: 0.56, medium: 0.45, hard: 0.37, expert: 0.30 };

  function givensTarget(cfg, difficulty) {
    const frac = KEEP_FRACTION[difficulty] ?? KEEP_FRACTION.easy;
    const floor = Math.max(cfg.SIZE, Math.round(cfg.CELLS * 0.2));
    return Math.max(floor, Math.round(cfg.CELLS * frac));
  }

  function generate(cfg, difficulty = "easy") {
    const solution = new Array(cfg.CELLS).fill(0);
    fillBoard(cfg, solution);
    const puzzle = solution.slice();
    const target = givensTarget(cfg, difficulty);
    const order = shuffle([...Array(cfg.CELLS).keys()]);
    let filled = cfg.CELLS;
    for (const i of order) {
      if (filled <= target) break;
      const backup = puzzle[i];
      if (backup === 0) continue;
      puzzle[i] = 0;
      const test = puzzle.slice();
      if (countSolutions(cfg, test, 2) !== 1) puzzle[i] = backup;
      else filled--;
    }
    return { puzzle, solution, givens: filled };
  }

  function isComplete(cfg, board) {
    if (board.includes(0)) return false;
    for (let i = 0; i < cfg.CELLS; i++) {
      const v = board[i];
      board[i] = 0;
      const ok = isValid(cfg, board, i, v);
      board[i] = v;
      if (!ok) return false;
    }
    return true;
  }

  function findConflicts(cfg, board) {
    const conflicts = new Set();
    for (let i = 0; i < cfg.CELLS; i++) {
      const v = board[i];
      if (v === 0) continue;
      board[i] = 0;
      if (!isValid(cfg, board, i, v)) conflicts.add(i);
      board[i] = v;
    }
    return conflicts;
  }

  const SIZES = {
    "4x4": { boxRows: 2, boxCols: 2, label: "4 × 4", note: "กล่อง 2×2" },
    "6x6": { boxRows: 2, boxCols: 3, label: "6 × 6", note: "กล่อง 2×3" },
    "9x9": { boxRows: 3, boxCols: 3, label: "9 × 9", note: "กล่อง 3×3" },
  };

  function configFor(sizeKey) {
    const s = SIZES[sizeKey] || SIZES["9x9"];
    return createConfig(s.boxRows, s.boxCols);
  }

  return {
    createConfig, configFor, SIZES,
    isValid, solve, generate, isComplete, findConflicts,
    givensTarget, KEEP_FRACTION,
  };
})();
