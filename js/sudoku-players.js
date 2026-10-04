/* sudoku-players.js — โปรไฟล์ผู้เล่นและสถิติการชนะของเกมซูโดกุ
 * เก็บเป็น JSON ใน localStorage:
 * { current: <playerId|null>, players: [{ id, name, created, wins:{ "9x9|easy":n }, total }] }
 */
const Players = (() => {
  const KEY = "sudoku.players.v1";

  const storage = (() => {
    let ok = false;
    try { const t = "__pl_test__"; localStorage.setItem(t, "1"); localStorage.removeItem(t); ok = true; }
    catch (e) { ok = false; }
    let mem = null;
    return {
      get() { if (ok) { try { return localStorage.getItem(KEY); } catch (e) { return mem; } } return mem; },
      set(v) { if (ok) { try { localStorage.setItem(KEY, v); return; } catch (e) {} } mem = v; },
    };
  })();

  let data = load();

  function load() {
    try {
      const raw = storage.get();
      if (raw) { const d = JSON.parse(raw); if (d && Array.isArray(d.players)) return normalize(d); }
    } catch (e) {}
    return { current: null, players: [] };
  }

  function normalize(d) {
    d.players.forEach((p) => {
      if (!p.wins) p.wins = {};
      if (typeof p.total !== "number") p.total = Object.values(p.wins).reduce((a, b) => a + b, 0);
    });
    return d;
  }

  function persist() { try { storage.set(JSON.stringify(data)); } catch (e) {} }
  function uid() { return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function initials(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function all() { return data.players.slice(); }
  function getCurrent() { return data.current ? (data.players.find((p) => p.id === data.current) || null) : null; }
  function setCurrent(id) { if (data.players.some((p) => p.id === id)) { data.current = id; persist(); } return getCurrent(); }

  function add(name) {
    const clean = (name || "").trim().slice(0, 16) || "Player";
    const player = { id: uid(), name: clean, created: Date.now(), wins: {}, total: 0 };
    data.players.push(player);
    data.current = player.id;
    persist();
    return player;
  }

  function remove(id) {
    data.players = data.players.filter((p) => p.id !== id);
    if (data.current === id) data.current = data.players.length ? data.players[0].id : null;
    persist();
  }

  function recordWin(sizeKey, difficulty) {
    const p = getCurrent();
    if (!p) return null;
    const k = `${sizeKey}|${difficulty}`;
    p.wins[k] = (p.wins[k] || 0) + 1;
    p.total = (p.total || 0) + 1;
    persist();
    return p.total;
  }

  function leaderboard() {
    return data.players.slice().sort((a, b) => (b.total || 0) - (a.total || 0) || a.created - b.created);
  }

  function breakdown(player) {
    return Object.entries(player.wins || {})
      .map(([key, count]) => { const [sizeKey, difficulty] = key.split("|"); return { key, sizeKey, difficulty, count }; })
      .sort((a, b) => b.count - a.count);
  }

  return { all, getCurrent, setCurrent, add, remove, recordWin, leaderboard, breakdown, initials };
})();
