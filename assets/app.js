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
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }
  function renderScore() {
    elTimer.textContent = fmtTime(seconds);
    elPoints.textContent = String(points);
  }
  function startTimer() {
    if (timerId) return;
    timerId = setInterval(() => { seconds++; renderScore(); }, 1000);
    btnStart.textContent = "Тече…";
    btnStart.disabled = true;
  }
  function resetAll() {
    if (timerId) clearInterval(timerId);
    timerId = null;
    seconds = 0;
    points = 0;
    btnStart.textContent = "Старт";
    btnStart.disabled = false;
    renderScore();
    loadLesson();
  }
  btnStart.addEventListener("click", startTimer);
  btnReset.addEventListener("click", resetAll);

  function addPoints(x) {
    points += x;
    renderScore();
  }

  async function loadLesson() {
    elStatus.textContent = "Вчитувам…";
    elContent.innerHTML = "";

    try {
      const url = `lessons/${odd}/${cas}.json`;
      const res = await fetch(url, { cache: "no-store" });

      if (!res.ok) {
        elTitle.textContent = `${odd} одделение — Час ${cas}`;
        elMeta.textContent = `Нема JSON за овој час`;
        elStatus.innerHTML = `❗ Не постои <code>${url}</code>. Креирај го фајлот и refresh.`;
        return;
      }

      const lesson = await res.json();
      renderLesson(lesson);
      elStatus.textContent = "Спремно. Кликни “Старт” за тајмер и поени.";
    } catch (e) {
      elStatus.textContent = "Грешка при вчитување. Провери JSON формат.";
      console.error(e);
    }
  }

  function renderLesson(lesson) {
    const title = lesson.title || "Без наслов";
    elTitle.textContent = `${odd} одделение — Час ${cas}: ${title}`;
    elMeta.textContent = `MCQ • Short • Drag&Drop • Timer`;

    (lesson.sections || []).forEach((sec, idx) => {
      const wrap = document.createElement("section");
      wrap.className = "section";

      const h = document.createElement("h3");
      h.textContent = sec.heading || `Секција ${idx + 1}`;
      wrap.appendChild(h);

      if (sec.type === "text") {
        const p = document.createElement("div");
        p.className = "small";
        p.textContent = sec.content || "";
        wrap.appendChild(p);
      }

      if (sec.type === "mcq") wrap.appendChild(renderMCQ(sec));
      if (sec.type === "short") wrap.appendChild(renderShort(sec));
      if (sec.type === "dragmatch") wrap.appendChild(renderDragMatch(sec));

      elContent.appendChild(wrap);
    });
  }

  function renderMCQ(sec) {
    const box = document.createElement("div");

    (sec.questions || []).forEach((qObj, qi) => {
      const q = document.createElement("div");
      q.className = "q";

      const qText = document.createElement("div");
      qText.innerHTML = `<strong>${qi + 1}.</strong> ${escapeHtml(qObj.q || "")}`;
      q.appendChild(qText);

      const form = document.createElement("div");
      const name = `mcq_${Math.random().toString(16).slice(2)}`;

      (qObj.options || []).forEach((opt, oi) => {
        const label = document.createElement("label");
        label.className = "opt";
        label.innerHTML = `<input type="radio" name="${name}" value="${oi}"> ${escapeHtml(opt)}`;
        form.appendChild(label);
      });

      const btn = document.createElement("button");
      btn.className = "btn primary";
      btn.textContent = "Провери";
      const feedback = document.createElement("div");
      feedback.className = "small";

      btn.addEventListener("click", () => {
        const chosen = form.querySelector("input:checked");
        if (!chosen) { feedback.innerHTML = `<span class="bad">Избери одговор.</span>`; return; }

        const ans = Number(chosen.value);
        const ok = ans === Number(qObj.answerIndex);

        if (ok) {
          feedback.innerHTML = `<span class="ok">Точно! +2</span> ${qObj.explain ? "— " + escapeHtml(qObj.explain) : ""}`;
          addPoints(2);
          btn.disabled = true;
        } else {
          feedback.innerHTML = `<span class="bad">Неточно.</span> ${qObj.explain ? "— " + escapeHtml(qObj.explain) : ""}`;
        }
      });

      q.appendChild(form);
      q.appendChild(btn);
      q.appendChild(feedback);
      box.appendChild(q);
    });

    return box;
  }

  function renderShort(sec) {
    const box = document.createElement("div");

    (sec.questions || []).forEach((qObj, qi) => {
      const q = document.createElement("div");
      q.className = "q";

      q.innerHTML = `<div><strong>${qi + 1}.</strong> ${escapeHtml(qObj.q || "")}</div>`;

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Внеси одговор…";
      input.style.width = "100%";

      const btn = document.createElement("button");
      btn.className = "btn primary";
      btn.textContent = "Провери";

      const feedback = document.createElement("div");
      feedback.className = "small";

      btn.addEventListener("click", () => {
        const user = (input.value || "").trim();
        const expected = String(qObj.answer || "").trim();

        if (!user) { feedback.innerHTML = `<span class="bad">Внеси одговор.</span>`; return; }

        const ok = normalize(user) === normalize(expected);

        if (ok) {
          feedback.innerHTML = `<span class="ok">Точно! +3</span> ${qObj.explain ? "— " + escapeHtml(qObj.explain) : ""}`;
          addPoints(3);
          btn.disabled = true;
          input.disabled = true;
        } else {
          feedback.innerHTML = `<span class="bad">Неточно.</span> Точен одговор: <code>${escapeHtml(expected)}</code>`;
        }
      });

      q.appendChild(input);
      q.appendChild(btn);
      q.appendChild(feedback);
      box.appendChild(q);
    });

    return box;
  }

  function renderDragMatch(sec) {
    const wrap = document.createElement("div");

    const pairs = (sec.pairs || []).map(p => ({ left: String(p.left), right: String(p.right) }));
    const leftItems = shuffle(pairs.map(p => p.left));
    const rightItems = shuffle(pairs.map(p => p.right));

    const container = document.createElement("div");
    container.className = "dragWrap";

    const leftCol = document.createElement("div");
    leftCol.className = "bucket";
    leftCol.innerHTML = `<div class="small"><strong>Лево</strong> (влечи)</div>`;

    leftItems.forEach((txt) => {
      const it = document.createElement("div");
      it.className = "item";
      it.draggable = true;
      it.textContent = txt;
      it.dataset.value = txt;
      it.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", it.dataset.value);
      });
      leftCol.appendChild(it);
    });

    const rightCol = document.createElement("div");
    rightCol.className = "bucket";
    rightCol.innerHTML = `<div class="small"><strong>Десно</strong> (пушти)</div>`;

    const targets = [];

    rightItems.forEach((txt) => {
      const row = document.createElement("div");
      row.className = "q";
      row.innerHTML = `<div><strong>${escapeHtml(txt)}</strong></div>`;

      const target = document.createElement("div");
      target.className = "dropTarget";
      target.textContent = "Пушти тука…";
      target.dataset.right = txt;

      target.addEventListener("dragover", (e) => e.preventDefault());
      target.addEventListener("drop", (e) => {
        e.preventDefault();
        const leftVal = e.dataTransfer.getData("text/plain");
        if (!leftVal) return;
        target.textContent = leftVal;
        target.dataset.left = leftVal;
      });

      targets.push(target);
      row.appendChild(target);
      rightCol.appendChild(row);
    });

    const btn = document.createElement("button");
    btn.className = "btn primary";
    btn.textContent = "Провери парови";

    const feedback = document.createElement("div");
    feedback.className = "small";

    btn.addEventListener("click", () => {
      let correct = 0;
      let filled = 0;

      targets.forEach((t) => {
        const r = t.dataset.right;
        const l = t.dataset.left;
        if (l) filled++;
        const ok = pairs.some(p => p.right === r && p.left === l);
        if (ok) correct++;
      });

      if (filled < targets.length) {
        feedback.innerHTML = `<span class="bad">Пополнете ги сите полиња.</span>`;
        return;
      }

      if (correct === targets.length) {
        feedback.innerHTML = `<span class="ok">Сè точно! +5</span>`;
        addPoints(5);
        btn.disabled = true;
      } else {
        feedback.innerHTML = `<span class="bad">Имате ${targets.length - correct} грешки.</span> Обиди се пак.`;
      }
    });

    container.appendChild(leftCol);
    container.appendChild(rightCol);

    wrap.appendChild(container);
    wrap.appendChild(btn);
    wrap.appendChild(feedback);

    return wrap;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function normalize(s) {
    return String(s).trim().toLowerCase().replace(/\s+/g, " ");
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  // INIT
  renderScore();
  elStatus.className = "hint";
  elStatus.textContent = "Вчитувам час…";
  loadLesson();
})();
