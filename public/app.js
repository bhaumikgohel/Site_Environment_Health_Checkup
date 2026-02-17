const form = document.getElementById('healthForm');
const runBtn = document.getElementById('runBtn');
const overallStatus = document.getElementById('overallStatus');
const statusCard = document.getElementById('statusIndicator');
const loader = document.getElementById('loader');
const reportTableBody = document.querySelector('#reportTable tbody');
const downloadBtn = document.getElementById('downloadBtn');
const envDropdown = document.getElementById('envDropdown');
const archiveBtn = document.getElementById('archiveBtn');
const historyTableBody = document.querySelector('#historyTable tbody');

let lastReportData = null;
let allConfigs = {};

// Load data on startup
async function init() {
    try {
        const [confRes, histRes] = await Promise.all([
            fetch('/configs'),
            fetch('/history')
        ]);
        allConfigs = await confRes.json();
        const history = await histRes.json();

        loadEnvConfig(envDropdown.value);
        renderHistory(history);
    } catch (err) {
        console.error("Failed to load data", err);
    }
}

function loadEnvConfig(env) {
    const config = allConfigs[env] || {};
    document.getElementById('baseUrl').value = config.baseUrl || "";
    document.getElementById('username').value = config.username || "";
    document.getElementById('password').value = config.password || "";
    document.getElementById('dashboardUrl').value = config.dashboardUrl || "";
    document.getElementById('selectorUser').value = config.selectorUser || "";
    document.getElementById('selectorPass').value = config.selectorPass || "";
    document.getElementById('selectorBtn').value = config.selectorBtn || "";
    document.getElementById('errorMsg').value = config.errorMsg || "";
    document.getElementById('apiEndpoint').value = config.apiEndpoint || "";
}

envDropdown.addEventListener('change', (e) => {
    loadEnvConfig(e.target.value);
});

init();

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // UI Feedback
    runBtn.disabled = true;
    runBtn.innerText = "Execution in Progress...";
    statusCard.className = "card status-card running";
    overallStatus.innerText = "RUNNING";
    loader.classList.remove('hidden');
    reportTableBody.innerHTML = "";
    downloadBtn.classList.add('hidden');

    const config = {
        baseUrl: document.getElementById('baseUrl').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        dashboardUrl: document.getElementById('dashboardUrl').value,
        selectorUser: document.getElementById('selectorUser').value,
        selectorPass: document.getElementById('selectorPass').value,
        selectorBtn: document.getElementById('selectorBtn').value,
        errorMsg: document.getElementById('errorMsg').value,
        apiEndpoint: document.getElementById('apiEndpoint').value
    };

    // Save config to local DB
    fetch('/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ env: envDropdown.value, config })
    });

    // Update local memory
    allConfigs[envDropdown.value] = config;

    try {
        const response = await fetch('/run-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        const data = await response.json();
        lastReportData = data;
        renderReport(data);

        // Record to History
        const anyFail = data.checks.some(c => c.status === "FAIL" || c.status === "ERROR");
        const uiLatency = data.checks.find(c => c.check === "UI URL")?.latency || "-";

        const runRecord = {
            time: new Date().toLocaleTimeString(),
            env: envDropdown.value,
            status: anyFail ? "NO-GO" : "GO",
            performance: uiLatency
        };

        fetch('/save-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ run: runRecord })
        }).then(() => fetch('/history'))
            .then(res => res.json())
            .then(renderHistory);

    } catch (err) {
        console.error(err);
        overallStatus.innerText = "ERROR";
        statusCard.className = "card status-card no-go";
    } finally {
        runBtn.disabled = false;
        runBtn.innerText = "Run Health Check";
        loader.classList.add('hidden');
    }
});

archiveBtn.addEventListener('click', () => {
    const config = {
        baseUrl: document.getElementById('baseUrl').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        dashboardUrl: document.getElementById('dashboardUrl').value,
        selectorUser: document.getElementById('selectorUser').value,
        selectorPass: document.getElementById('selectorPass').value,
        selectorBtn: document.getElementById('selectorBtn').value,
        errorMsg: document.getElementById('errorMsg').value,
        apiEndpoint: document.getElementById('apiEndpoint').value
    };

    fetch('/archive-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
    }).then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("Configuration archived successfully in localDB!");
            }
        });
});

function renderHistory(history) {
    historyTableBody.innerHTML = "";
    history.forEach(run => {
        const row = document.createElement('tr');
        const statusClass = run.status === "GO" ? "hist-go" : "hist-nogo";
        row.innerHTML = `
            <td class="hist-time">${run.time}</td>
            <td class="hist-env">${run.env}</td>
            <td class="${statusClass}">${run.status}</td>
            <td>${run.performance}</td>
        `;
        historyTableBody.appendChild(row);
    });
}

function renderReport(data) {
    let anyFail = false;
    reportTableBody.innerHTML = "";

    data.checks.forEach(check => {
        const row = document.createElement('tr');
        const statusClass = `st-${check.status.toLowerCase()}`;

        if (check.status === "FAIL" || check.status === "ERROR") anyFail = true;

        row.innerHTML = `
            <td>${check.check}</td>
            <td class="${statusClass}">${check.status}</td>
            <td>${check.latency}</td>
            <td>${check.notes}</td>
        `;
        reportTableBody.appendChild(row);
    });

    overallStatus.innerText = anyFail ? "NO-GO" : "GO";
    statusCard.className = anyFail ? "card status-card no-go" : "card status-card go";

    downloadBtn.classList.remove('hidden');
}

downloadBtn.addEventListener('click', () => {
    if (!lastReportData) return;

    const envName = document.getElementById('envDropdown').value;
    const baseUrl = document.getElementById('baseUrl').value;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Health Report - ${envName}</title>
            <style>
                body { font-family: sans-serif; padding: 20px; color: #333; }
                header { border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
                .meta { margin-bottom: 20px; color: #555; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }
                th { background-color: #f8fafc; }
                .PASS { color: #10b981; font-weight: bold; }
                .WARNING { color: #f59e0b; font-weight: bold; }
                .FAIL { color: #ef4444; font-weight: bold; }
                .GO { color: #10b981; font-size: 24px; }
                .NOGO { color: #ef4444; font-size: 24px; }
            </style>
        </head>
        <body>
            <header>
                <h1>Environment Health Report</h1>
                <div class="meta">
                    <p><strong>Environment:</strong> ${envName}</p>
                    <p><strong>URL:</strong> <a href="${baseUrl}">${baseUrl}</a></p>
                    <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
                </div>
            </header>
            <div class="summary">
                Overall Status: <span class="${lastReportData.checks.some(c => c.status === 'FAIL') ? 'NOGO' : 'GO'}">
                    ${lastReportData.checks.some(c => c.status === 'FAIL') ? 'NO-GO' : 'GO'}
                </span>
            </div>
            <br>
            <table>
                <thead>
                    <tr>
                        <th>Check</th>
                        <th>Status</th>
                        <th>Latency</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${lastReportData.checks.map(c => `
                        <tr>
                            <td>${c.check}</td>
                            <td class="${c.status}">${c.status}</td>
                            <td>${c.latency}</td>
                            <td>${c.notes}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health_report_${envName}_${new Date().getTime()}.html`;
    a.click();
});
