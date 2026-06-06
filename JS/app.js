// ===== STATE =====
let S = {
  alloc: { bond: 25, cloud: 25, medi: 25, shield: 25 },
  prevAlloc: null,
  portfolio: { bond: 25000, cloud: 25000, medi: 25000, shield: 25000 },
  total: TOTAL,
  year: 0,
  changes: 0,
  totalCommissions: 0,
  yearHistory: [],
  timer: null,
  timeLeft: TIMER_SEC,
  touchedThisYear: false,
  isPractice: true
};

// ===== DOM HELPERS =====
function show(id) {
  document.querySelectorAll(".sc").forEach(s => s.classList.remove("on"));
  document.getElementById(id).classList.add("on");
  window.scrollTo(0, 0);
}

// ===== INIT =====
(function init() {
  document.getElementById("startBtn").addEventListener("click", startGame);
  show("scrIntro");
})();

// ===== START (מתחילות עם שנת ניסיון) =====
function startGame() {
  S = {
    alloc: { bond: 25, cloud: 25, medi: 25, shield: 25 },
    prevAlloc: null,
    portfolio: { bond: 25000, cloud: 25000, medi: 25000, shield: 25000 },
    total: TOTAL,
    year: 0,
    changes: 0,
    totalCommissions: 0,
    yearHistory: [],
    timer: null,
    timeLeft: TIMER_SEC,
    touchedThisYear: false,
    isPractice: true
  };
  show("scrGame");
  document.getElementById("gBal").textContent = fmt(S.total);
  showAllocScreen();
}

// ===== START REAL GAME AFTER PRACTICE =====
function startRealGame() {
  S = {
    alloc: { bond: 25, cloud: 25, medi: 25, shield: 25 },
    prevAlloc: null,
    portfolio: { bond: 25000, cloud: 25000, medi: 25000, shield: 25000 },
    total: TOTAL,
    year: 0,
    changes: 0,
    totalCommissions: 0,
    yearHistory: [],
    timer: null,
    timeLeft: TIMER_SEC,
    touchedThisYear: false,
    isPractice: false
  };
  document.getElementById("gBal").textContent = fmt(S.total);
  showAllocScreen();
}

// ===== TIMER =====
function startTimer() {
  clearInterval(S.timer);
  S.timeLeft = TIMER_SEC;
  updTimer();
  S.timer = setInterval(() => {
    S.timeLeft -= 1;
    updTimer();
    if (S.timeLeft <= 0) {
      clearInterval(S.timer);
      confirmAlloc();
    }
  }, 1000);
}

function updTimer() {
  const m = Math.floor(S.timeLeft / 60);
  const s = S.timeLeft % 60;
  const tEl = document.getElementById("gTime");
  const bEl = document.getElementById("gBar");
  if (!tEl || !bEl) return;
  tEl.textContent = `${m}:${s.toString().padStart(2, "0")}`;
  bEl.style.width = `${(S.timeLeft / TIMER_SEC) * 100}%`;
  const d = S.timeLeft <= 15;
  tEl.classList.toggle("dng", d);
  bEl.classList.toggle("dng", d);
}

// ===== ALLOCATION SCREEN =====
function showAllocScreen() {
  S.touchedThisYear = false;
  const yr = YEARS[S.year];

  const stepText = S.isPractice ? "🎯 שנת ניסיון" : `שנה ${S.year + 1} מתוך 5`;
  const titleText = S.isPractice
    ? `🎯 שנת ניסיון — ${yr.year}`
    : `${yr.icon} ${yr.year} — ${yr.title.split("—")[1]?.trim() || yr.title}`;

  document.getElementById("gStep").textContent = stepText;
  document.getElementById("gTitle").textContent = titleText;

  let html = `<div class="alc">
    <div class="alc-t">📊 חלקי את הכסף בין הנכסים (סה"כ 100%)</div>
  `;

  ASSETS.forEach(a => {
    html += `
      <div class="sr">
        <div class="sh">
          <div class="sl">
            <span class="sli" style="background:${a.bg};color:${a.color}">${a.icon}</span>
            <span>${a.name} <span style="font-size:10px;color:var(--txt3);">(${a.sector})</span></span>
          </div>
          <div>
            <span class="sv" id="pct_${a.key}">${S.alloc[a.key]}%</span>
            <span class="sm" id="amt_${a.key}">${fmt(S.total * S.alloc[a.key] / 100)}</span>
          </div>
        </div>
        <input type="range" id="sl_${a.key}" min="0" max="100" value="${S.alloc[a.key]}" step="5" />
      </div>
    `;
  });

  html += `
    <div class="aw" id="allocWarn">⚠️ הסכום חייב להסתכם ל-100%</div>
    <button class="cbtn" id="allocBtn">אישור ➡️</button>
  </div>`;

  document.getElementById("gContent").innerHTML = html;

  ASSETS.forEach(a => {
    document.getElementById(`sl_${a.key}`).addEventListener("input", () => {
      S.touchedThisYear = true;
      updSliders();
    });
  });

  document.getElementById("allocBtn").addEventListener("click", confirmAlloc);
  startTimer();
  checkTotal();
}

function updSliders() {
  ASSETS.forEach(a => {
    const v = parseInt(document.getElementById(`sl_${a.key}`).value);
    S.alloc[a.key] = v;
    document.getElementById(`pct_${a.key}`).textContent = v + "%";
    document.getElementById(`amt_${a.key}`).textContent = fmt(S.total * v / 100);
  });
  checkTotal();
}

function checkTotal() {
  const sum = ASSETS.reduce((s, a) => s + S.alloc[a.key], 0);
  const warn = document.getElementById("allocWarn");
  const btn = document.getElementById("allocBtn");
  if (!warn || !btn) return;
  if (sum !== 100) {
    warn.classList.add("sh2");
    warn.textContent = sum > 100
      ? `⚠️ חרגת! ${sum}% — צריך להוריד ${sum - 100}%`
      : `⚠️ חסר! רק ${sum}% — צריך להוסיף עוד ${100 - sum}%`;
    btn.disabled = true;
  } else {
    warn.classList.remove("sh2");
    btn.disabled = false;
  }
}

function confirmAlloc() {
  const sum = ASSETS.reduce((s, a) => s + S.alloc[a.key], 0);
  if (sum !== 100) return;
  clearInterval(S.timer);

  if (!S.touchedThisYear && S.prevAlloc) {
    S.prevAlloc = { ...S.alloc };
    applyYear(false, 0, false);
    return;
  }

  let amountMoved = 0;
  if (S.prevAlloc) {
    ASSETS.forEach(a => {
      const oldAmt = S.total * S.prevAlloc[a.key] / 100;
      const newAmt = S.total * S.alloc[a.key] / 100;
      amountMoved += Math.abs(newAmt - oldAmt);
    });
    amountMoved = amountMoved / 2;
  }

  const commission = (amountMoved > 0 && !S.isPractice) ? Math.round(amountMoved * COMMISSION_RATE) : 0;
  if (commission > 0) {
    S.changes += 1;
    S.totalCommissions += commission;
    S.total -= commission;
  }

  S.prevAlloc = { ...S.alloc };
  applyYear(amountMoved > 0, commission, true);
}

// ===== APPLY YEAR =====
function applyYear(changed, commission, doRebalance = true) {
  const yr = YEARS[S.year];

  if (doRebalance) {
    ASSETS.forEach(a => {
      S.portfolio[a.key] = S.total * S.alloc[a.key] / 100;
    });
  }

  const details = [];
  let newTotal = 0;
  ASSETS.forEach(a => {
    const before = S.portfolio[a.key];
    const ret = yr.returns[a.key];
    const after = before * (1 + ret);
    S.portfolio[a.key] = after;
    newTotal += after;
    details.push({ ...a, before, after, ret });
  });

  const oldTotal = S.total;
  S.total = newTotal;

  ASSETS.forEach(a => {
    S.alloc[a.key] = S.total > 0 ? Math.round((S.portfolio[a.key] / S.total) * 100) : 25;
  });
  const allocSum = ASSETS.reduce((s, a) => s + S.alloc[a.key], 0);
  if (allocSum !== 100) S.alloc[ASSETS[0].key] += (100 - allocSum);

  if (!S.isPractice) {
    S.yearHistory.push({ year: yr.year, changed, commission, totalBefore: oldTotal, totalAfter: S.total });
  }

  showYearResult(yr, details, oldTotal, commission);
}

// ===== YEAR RESULT =====
function showYearResult(yr, details, oldTotal, commission) {
  const change = ((S.total - oldTotal) / oldTotal) * 100;
  const isPos = change >= 0;

  document.getElementById("gBal").textContent = fmt(S.total);

  // שנת ניסיון — מסך פשוט
  if (S.isPractice) {
    document.getElementById("gContent").innerHTML = `<div class="yrc">
      <div class="yr-title">סיכום שנת הניסיון 🎯</div>
      <div class="yr-ch ${isPos ? "pos" : "neg"}" style="font-size:26px; margin-bottom:6px;">${isPos ? "+" : ""}${change.toFixed(1)}%</div>
      <div class="yr-ex" style="padding:10px 12px; margin-bottom:10px; text-align:center; font-size:14px;">
        🎉 כל הכבוד! הבנת איך זה עובד.<br><br>
        עכשיו שהבנת איך לתפעל —<br>
        <strong>בואי נתחיל לשחק באמת!</strong>
      </div>
      <div class="yr-bal" style="padding:8px; margin-bottom:10px;">
        <div class="yr-bl">שווי תיק הניסיון</div>
        <div class="yr-bv">${fmt(S.total)}</div>
      </div>
      <button class="nbtn" id="nextBtn">יאללה מתחילות לשחק! 🚀</button>
    </div>`;
    document.getElementById("nextBtn").addEventListener("click", startRealGame);
    return;
  }

  // משחק אמיתי
  let html = `<div class="yrc">
    <div class="yr-title">סיכום שנה בתיק ההשקעות שלך</div>
    <div class="yr-ch ${isPos ? "pos" : "neg"}" style="font-size:26px; margin-bottom:2px;">${isPos ? "+" : ""}${change.toFixed(1)}%</div>
    ${commission > 0 ? `<div style="font-size:12px; color:var(--red); text-align:center; margin-bottom:6px;">💸 עמלה: -${fmt(commission)}</div>` : ""}
    <div class="yr-ex" style="padding:8px 10px; margin-bottom:8px;">${yr.lesson.replace(/\n/g, "<br>")}</div>
    <div class="yr-bd" style="margin-bottom:8px;">
  `;

  details.forEach(d => {
    const rPos = d.ret >= 0;
    html += `<div class="yr-ar">
      <span>${d.icon} ${d.name}</span>
      <span style="color:${rPos ? "var(--green)" : "var(--red)"}; font-family:'Rubik',sans-serif; font-weight:700;">
        ${rPos ? "+" : ""}${(d.ret * 100).toFixed(0)}%
        <span style="color:var(--txt3); margin-right:6px; font-weight:400;">${fmt(d.after)}</span>
      </span>
    </div>`;
  });

  const isLastYear = S.year >= 4;
  html += `</div>
    <div class="yr-bal" style="padding:8px; margin-bottom:8px;">
      <div class="yr-bl">שווי התיק</div>
      <div class="yr-bv">${fmt(S.total)}</div>
    </div>
    <button class="nbtn" id="nextBtn">
      ${isLastYear ? "לתוצאות הסופיות 🏆" : "לשנה הבאה ➡️"}
    </button>
  </div>`;

  document.getElementById("gContent").innerHTML = html;
  document.getElementById("nextBtn").addEventListener("click", nextYear);
}

// ===== NEXT YEAR =====
function nextYear() {
  const nextIndex = S.year + 1;
  if (nextIndex >= 5) {
    S.year = nextIndex;
    showResults();
    return;
  }
  S.year = nextIndex;
  document.getElementById("gBal").textContent = fmt(S.total);
  showAllocScreen();
}

// ===== RESULTS =====
function showResults() {
  show("scrResults");
  const finalTotal = S.total;
  const totalReturn = ((finalTotal - TOTAL) / TOTAL) * 100;
  const isPos = totalReturn >= 0;

  document.getElementById("rAmount").textContent = fmt(finalTotal);
  const rr = document.getElementById("rReturn");
  rr.textContent = `${isPos ? "+" : ""}${totalReturn.toFixed(0)}% תשואה כוללת`;
  rr.className = `fr ${isPos ? "pos" : "neg"}`;

  // סיכום שנה אחר שנה + עמלות בשורה אחת
  const rd = document.getElementById("rDetails");
  if (rd) {
    let dhtml = `<div class="det-t">ביצועים לפי שנה:</div>`;
    S.yearHistory.forEach(yh => {
      const ch = ((yh.totalAfter - yh.totalBefore) / yh.totalBefore) * 100;
      const p = ch >= 0;
      dhtml += `<div class="det-r">
        <span>📅 ${yh.year} ${yh.changed ? "🔄" : "🔒"}</span>
        <span style="font-family:'Rubik',sans-serif; font-weight:700; color:${p ? "var(--green)" : "var(--red)"}">
          ${p ? "+" : ""}${ch.toFixed(1)}%
          ${yh.commission > 0 ? `<span style="color:var(--red); font-size:11px;"> (-${fmt(yh.commission)})</span>` : ""}
        </span>
      </div>`;
    });
    if (S.totalCommissions > 0) {
      dhtml += `<div class="det-r" style="color:var(--red);">
        <span>💸 סה"כ עמלות (${S.changes} שינויים)</span>
        <span style="font-family:'Rubik',sans-serif; font-weight:700;">-${fmt(S.totalCommissions)}</span>
      </div>`;
    }
    dhtml += `<div class="det-r" style="border-color:var(--primary); margin-top:4px;">
      <span style="font-weight:700">💰 סה"כ סופי</span>
      <span style="font-family:'Rubik',sans-serif; font-weight:900; color:var(--primary)">${fmt(finalTotal)}</span>
    </div>`;
    dhtml += `<div style="text-align:center; padding:10px 4px 4px; font-family:'Rubik',sans-serif; font-size:16px; font-weight:700; color:var(--primary); line-height:1.6;">
      סבלנות ופיזור יכולים לעשות הבדל גדול לאורך זמן.
    </div>`;
    rd.innerHTML = dhtml;
  }
}

// ===== RESTART =====
function restart() {
  show("scrIntro");
}