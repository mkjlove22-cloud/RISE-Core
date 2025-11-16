// ========= BASIC PARAMETERS ========= //
let N = 32;
let DT = 0.05;

let theta = [];
let omega = [];
let Wc = [];
let noiseLevel = 0.05;

let rHistory = [];
let wcHistory = [];

let running = false;
let interval = null;

// ========= INIT ========= //
function init() {
    theta = Array.from({ length: N }, () => Math.random() * Math.PI * 2);
    omega = Array.from({ length: N }, () => (Math.random() * 2 - 1) * 0.05);
    Wc = Array.from({ length: N }, () => 0.8);

    rHistory = [];
    wcHistory = [];
}

function orderParameter() {
    let sumCos = 0;
    let sumSin = 0;

    theta.forEach(t => {
        sumCos += Math.cos(t);
        sumSin += Math.sin(t);
    });

    return Math.sqrt(sumCos * sumCos + sumSin * sumSin) / N;
}

function meanWc() {
    return Wc.reduce((s, v) => s + v, 0) / N;
}

// ========= KURAMOTO UPDATE ========= //
function updateStep() {
    let newTheta = [];

    const r = orderParameter();
    const avgWc = meanWc();

    // Wc 복원
    Wc = Wc.map(w => {
        return w + DT * (r * (1.0 - w) - 0.02 * (1 - w));
    });

    for (let i = 0; i < N; i++) {
        let coupling = 0;
        for (let j = 0; j < N; j++) {
            coupling += 0.3 * Math.sin(theta[j] - theta[i]) * (Wc[i] + Wc[j]) * 0.5;
        }

        const noise = noiseLevel * (Math.random() - 0.5);

        newTheta[i] = theta[i] + DT * (omega[i] + coupling + noise);
    }

    theta = newTheta;

    rHistory.push(r);
    wcHistory.push(avgWc);

    updateCharts();
}

// ========= UI HOOKS ========= //
document.getElementById("startBtn").onclick = () => {
    if (!running) {
        running = true;
        interval = setInterval(updateStep, 30);
    } else {
        running = false;
        clearInterval(interval);
    }
};

document.getElementById("resetBtn").onclick = () => {
    running = false;
    clearInterval(interval);
    init();
};

document.getElementById("noiseSlider").oninput = (e) => {
    noiseLevel = parseFloat(e.target.value);
};

document.getElementById("nodeSlider").oninput = (e) => {
    N = parseInt(e.target.value);
    init();
};

// ========= CHART SETUP ========= //
let rChart = new Chart(document.getElementById("rChart"), {
    type: "line",
    data: { labels: [], datasets: [
        { label: "Resonance r(t)", data: [], borderColor: "#2563eb", tension: 0.2 }
    ]},
});

let wcChart = new Chart(document.getElementById("wcChart"), {
    type: "line",
    data: { labels: [], datasets: [
        { label: "Meaning Weight Wc(t)", data: [], borderColor: "#f59e0b", tension: 0.2 }
    ]},
});

function updateCharts() {
    rChart.data.labels.push("");
    rChart.data.datasets[0].data = rHistory;
    rChart.update();

    wcChart.data.labels.push("");
    wcChart.data.datasets[0].data = wcHistory;
    wcChart.update();
}

// ========= START ========= //
init();
