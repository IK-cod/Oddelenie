(function () {
  const totals = { 6: 180, 7: 144, 8: 144, 9: 144 };

  const qs = new URLSearchParams(location.search);
  const odd = Number(qs.get("odd") || 6);
  const cas = (qs.get("cas") || "001").padStart(3, "0");
  const max = totals[odd] || 144;

  const elTitle = document.getElementById("title");
  const elMeta = document.getElementById("meta");
  const elStatus = document.getElementById("status");
  const elContent = document.getElementById("content");
  const elTimer = document.getElementById("timer");
  const elPoints = document.getElementById("points");

  const prev = document.getElementById("prev");
  const next = document.getElementById("next");

  const btnStart = document.getElementById("start");
  const btnReset = document.getElementById("reset");

  function pad3(n) { return String(n).padStart(3, "0"); }

  // Prev/Next
  const n = Number(cas);
  prev.href = `lesson.html?odd=${odd}&cas=${pad3(Math.max(1, n - 1))}`;
  next.href = `lesson.html?odd=${odd}&cas=${pad3(Math.min(max, n + 1))}`;
  if (n <= 1) { prev.style.opacity = 0.4; prev.style.pointerEvents = "none"; }
  if (n >= max) { next.style.opacity = 0.4; next.style.pointerEvents = "none"; }

  // Timer + points
  let points = 0;
  let seconds = 0;
  let timerId = null;

  function fmtTime(s) {
    const mm = String(Math.floor(s
