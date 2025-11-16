// =========================
//  Utility Functions
// =========================

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

function order_param(theta) {
  let sc = 0, ss = 0;
  for (let v of theta) {
    sc += Math.cos(v);
    ss += Math.sin(v);
  }
  return Math.sqrt(sc * sc + ss * ss) / theta.length;
}

function compute_gini(arr) {
  const x = [...arr].map(v => Math.max(0, v));
  const n = x.length;
  const sum = x.reduce((s, v) => s + v, 0);
  if (sum === 0) return 0;

  x.sort((a, b) => a - b);
  let cum = 0, num = 0;

  for (let i = 0; i < n; i++) {
    cum += x[i];
    num += cum;
  }
  return (n + 1 - 2 * num / sum) / n;
}


// =========================
//  Global Simulation State
// =========================

let state = {};
let interval = null;
let charts = {};



// =========================
//  Initialize Simulation
// =========================

function initState() {
  const N = parseInt(document.getElementById('inputN').value, 10);
  state.N = N;

  state.dt = 0.1;
  state.Tmax = 500;
  state.t = 0;
  state.step = 0;

  state.theta = Array.from({ length: N }, () => Math.random() * 2 * Math.PI);
  state.omega = Array.from({ length: N }, () => (Math.random() * 2 - 1) * 0.1);
  state.R = Array(N).fill(1.0);
  state.E = Array(N).fill(0.0);
  state.Wc = Array(N).fill(0.8);

  state.K0 = Array.from({ length: N }, () =>
    Array.from({ length: N }, () => Math.random() * 0.15 + 0.45)
  );

  state.neighbors = Array.from({ length: N }, () => []);
  const DEG = 6;

  for (let i = 0; i < N; i++) {
    while (state.neighbors[i].length < DEG) {
      const j = Math.floor(Math.random() * N);
      if (j === i) continue;
      if (!state.neighbors[i].includes(j)) {
        state.neighbors[i].push(j);
        state.neighbors[j].push(i);
      }
    }
  }

  state.history = { t: [], r: [], Wc: [], G: [], E: [], Xi: [], alpha: [] };

  readParams();
}

function readParams() {
  state.params = {
    r_crit: parseFloat(document.getElementById("rcrit").value),
    mu: parseFloat(document.getElementById("mu").value),
    gamma: 1.0,
    etaW_base: parseFloat(document.getElementById("etaW").value),
    lambdaW: parseFloat(document.getElementById("lambdaW").value),
    etaOmegaBase: 0.15,
    etaOmegaBoost: parseFloat(document.getElementById("etaOmegaBoost").value),
    G_th: parseFloat(document.getElementById("rcrit").value) * 0.3,
    rhoRedis: parseFloat(document.getElementById("rhoRedis").value),
    phi: parseFloat(document.getElementById("phi").value),
    nuW_attack: parseFloat(document.getElementById("nuWAttack").value),
  };

  state.attackTime = parseInt(document.getElementById("attackTime").value, 10);
  state.attackDur = parseInt(document.getElementById("attackDur").value, 10);
}



// =========================
//  Simulation Step Function
// =========================

function stepSim() {
  const p = state.params;
  const N = state.N;
  const dt = state.dt;

  const r = order_param(state.theta);
  const avgWc = state.Wc.reduce((s, v) => s + v, 0) / N;
  const avgE = state.E.reduce((s, v) => s + v, 0) / N;
  const G = compute_gini(state.R);

  let alpha = 1.0;
  if (r < p.r_crit) {
    alpha = 1 + p.mu * Math.pow(p.r_crit - r, p.gamma);
  }
  alpha = Math.min(alpha, 5.0);

  const tau = 0.5;
  const F = state.Wc.map(w => (w >= tau ? 1 : 0));

  const contrib = new Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    let sum = 0;
    for (const j of state.neighbors[i]) {
      let Kij = state.K0[i][j] * (F[j] ? 1 : 0);
      Kij *= 1 / (1 + 0.01 * state.R[j]);
      sum += Kij * alpha * Math.sin(state.theta[j] - state.theta[i]);
    }
    contrib[i] = sum;
  }

  const attackActive =
    state.step >= state.attackTime &&
    state.step < state.attackTime + state.attackDur;

  const avgOmega = state.omega.reduce((s, v) => s + v, 0) / N;
  const etaOmegaNow = r < p.r_crit ? p.etaOmegaBoost : p.etaOmegaBase;

  for (let i = 0; i < N; i++) {
    state.omega[i] += dt * etaOmegaNow * (avgOmega - state.omega[i]);
  }

  for (let i = 0; i < N; i++) {
    const noise = (Math.random() * 2 - 1) * 0.002;
    state.theta[i] =
      (state.theta[i] + dt * (state.omega[i] + contrib[i]) + noise) %
      (2 * Math.PI);
  }

  for (let i = 0; i < N; i++) {
    const nuW = attackActive && Math.random() < 0.1 ? p.nuW_attack : 0.0;
    let dW =
      p.etaW_base * r * (1 - state.Wc[i]) -
      nuW * (1 - state.Wc[i]) +
      p.lambdaW * (1 - state.Wc[i]);

    state.Wc[i] = clamp(state.Wc[i] + dt * dW, 0.01, 1.0);
  }

  for (let i = 0; i < N; i++) {
    const s_i = Math.random();
    const deltaR =
      0.01 * (0.3 * state.E[i] + 0.5 * s_i) / (1 + 0.01 * state.R[i]);
    state.R[i] = Math.max(0, state.R[i] + deltaR);
  }

  const Gnew = compute_gini(state.R);
  if (Gnew > p.G_th) {
    const paired = state.R.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);

    const k = Math.max(1, Math.floor(p.rhoRedis * N));
    const top = paired.slice(N - k).map(x => x.i);
    const bot = paired.slice(0, k).map(x => x.i);

    let totalExtract = 0;

    for (const i of top) {
      const extract = p.phi * state.R[i];
      state.R[i] -= extract;
      totalExtract += extract;
    }

    const give = totalExtract / bot.length;
    for (const j of bot) state.R[j] += give;
  }

  for (let i = 0; i < N; i++) {
    const noiseE = (Math.random() * 2 - 1) * 0.01;
    const tanhInput = state.R[i] * state.Wc[i];
    state.E[i] = clamp(
      0.9 * state.E[i] + 0.1 * Math.tanh(tanhInput) + noiseE,
      -1,
      1
    );
  }

  const newr = order_param(state.theta);
  const avgWcNow = state.Wc.reduce((s, v) => s + v, 0) / N;
  const avgENow = state.E.reduce((s, v) => s + v, 0) / N;
  const newG = compute_gini(state.R);

  const Xi = newr * avgWcNow - 0.5 * newG - 0.1 * avgENow;

  state.history.t.push(state.step);
  state.history.r.push(newr);
  state.history.Wc.push(avgWcNow);
  state.history.G.push(newG);
  state.history.E.push(avgENow);
  state.history.Xi.push(Xi);
  state.history.alpha.push(alpha);

  state.step++;
  document.getElementById("step").textContent = state.step;
  document.getElementById("xi_sample").textContent = Xi.toFixed(3);

  if (state.step % 8 === 0) updateCharts();

  if (state.step >= state.Tmax) {
    stopSim();
    finalizeSummary();
  }
}



// =========================
//  Run / Stop / Reset
// =========================

function runSim() {
  if (interval) return;
  interval = setInterval(stepSim, 40);
}

function stopSim() {
  clearInterval(interval);
  interval = null;
}

function resetSim() {
  stopSim();
  initState();
  updateCharts(true);
  document.getElementById("summaryBox").textContent = "리셋 완료. 시작하세요.";
}



// =========================
//  Chart.js Initialization
// =========================

function initCharts() {
  const ctx = document.getElementById("chartMain").getContext("2d");

  charts.main = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Xi (목적 함수)",
          data: [],
          borderColor: "#1f2937",
          tension: 0.2,
          yAxisID: "y",
        },
        {
          label: "r (공명 지표)",
          data: [],
          borderColor: "#059669",
          tension: 0.2,
          yAxisID: "y",
        },
        {
          label: "avg Wc (평균 의미 가중치)",
          data: [],
          borderColor: "#d97706",
          tension: 0.2,
          yAxisID: "y",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 1.0,
          title: { display: true, text: "지표 값 (0.0 ~ 1.0)" },
        },
        x: { title: { display: true, text: "시간 (Time Step)" } },
      },
      plugins: {
        legend: { position: "bottom" },
      },
    },
  });

  const c2 = document.getElementById("chartAux").getContext("2d");

  charts.aux = new Chart(c2, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Gini (지니 계수)",
          data: [],
          borderColor: "#ef4444",
          tension: 0.2,
          yAxisID: "y",
        },
        {
          label: "avg E (평균 감정)",
          data: [],
          borderColor: "#6366f1",
          tension: 0.2,
          yAxisID: "y",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 1.0,
          title: { display: true, text: "지표 값" },
        },
        x: { title: { display: true, text: "시간 (Time Step)" } },
      },
      plugins: {
        legend: { position: "bottom" },
      },
    },
  });
}

function updateCharts(force = false) {
  const h = state.history;
  const max = 200;
  const start = Math.max(0, h.t.length - max);

  const labels = h.t.slice(start);

  charts.main.data.labels = labels;
  charts.main.data.datasets[0].data = h.Xi.slice(start);
  charts.main.data.datasets[1].data = h.r.slice(start);
  charts.main.data.datasets[2].data = h.Wc.slice(start);
  charts.main.update();

  charts.aux.data.labels = labels;
  charts.aux.data.datasets[0].data = h.G.slice(start);
  charts.aux.data.datasets[1].data = h.E.slice(start);
  charts.aux.update();
}



// =========================
//  Summary & Pass/Fail Check
// =========================

function finalizeSummary() {
  const atk = state.attackTime;
  const dur = state.attackDur;

  const start = atk + dur + 1;
  const end = Math.min(start + 100, state.history.t.length);

  if (end <= start) {
    document.getElementById("summaryBox").innerHTML =
      `요약: 시뮬레이션 종료 시간이 너무 짧습니다. Tmax를 늘려주세요.`;
    return;
  }

  const seg = state.history.Xi.slice(start, end + 1);
  const avgXi = seg.reduce((s, v) => s + v, 0) / seg.length;

  const pass = avgXi >= 0.40;

  document.getElementById("summaryBox").innerHTML = `
    복구 구간 평균 Ξ(${start}..${end}) = ${avgXi.toFixed(4)}
    → <strong style="color:${pass ? 'green' : 'red'}">${pass ? 'PASS' : 'FAIL'}</strong>
  `;
}



// =========================
//  Event Bindings
// =========================

document.getElementById("btnStart").onclick = () => {
  readParams();
  runSim();
};

document.getElementById("btnPause").onclick = () => {
  stopSim();
};

document.getElementById("btnReset").onclick = () => {
  resetSim();
};

["rcrit","mu","etaW","lambdaW","etaOmegaBoost","rhoRedis","phi","nuWAttack"]
  .forEach(id => {
    const el = document.getElementById(id);
    if (el) el.oninput = () => {
      const val = document.getElementById(id + "Val");
      if (val) val.textContent = el.value;
    };
  });


// =========================
//  Initialization
// =========================

initState();
initCharts();
updateCharts(true);
