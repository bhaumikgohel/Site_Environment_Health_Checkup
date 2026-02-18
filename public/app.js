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

// AI Analysis elements
let aiAnalyzeBtn = null;
let aiAnalysisPanel = null;
let aiAnalysisContent = null;
let aiLoader = null;
let ollamaStatusIndicator = null;

let lastReportData = null;
let allConfigs = {};
let ollamaConnected = false;

// Load data on startup
async function init() {
    try {
        initAIElements();
        const [confRes, histRes] = await Promise.all([
            fetch('/configs'),
            fetch('/history')
        ]);
        allConfigs = await confRes.json();
        const history = await histRes.json();

        loadEnvConfig(envDropdown.value);
        renderHistory(history);
        
        // Check Ollama status
        checkOllamaStatus();
    } catch (err) {
        console.error("Failed to load data", err);
    }
}

// Initialize AI Analysis UI elements (only if Ollama is available)
function initAIElements() {
    // Don't create AI elements immediately - wait for status check
    // Elements will be created only if Ollama is connected
}

// Check Ollama status - silent check, only creates UI if Ollama is available
async function checkOllamaStatus() {
    try {
        const response = await fetch('/ollama-status');
        const data = await response.json();
        
        ollamaConnected = data.connected;
        
        // Only create AI UI elements if Ollama is connected
        if (ollamaConnected) {
            createAIElements();
        }
        // If not connected, AI elements remain hidden - site works normally
    } catch (err) {
        // Silently fail - Ollama is optional
        console.log('Ollama not available - AI features disabled');
        ollamaConnected = false;
    }
}

// Create AI UI elements only when Ollama is available
function createAIElements() {
    // Show AI badge in header
    const aiBadge = document.getElementById('aiBadge');
    if (aiBadge) {
        aiBadge.classList.remove('hidden');
    }
    
    const reportActions = document.querySelector('.report-actions');
    if (reportActions && !document.getElementById('aiAnalyzeBtn')) {
        // Add Ollama status indicator
        ollamaStatusIndicator = document.createElement('span');
        ollamaStatusIndicator.id = 'ollamaStatus';
        ollamaStatusIndicator.className = 'ollama-status ai-ready';
        ollamaStatusIndicator.innerHTML = '✅ AI Ready';
        reportActions.appendChild(ollamaStatusIndicator);
        
        // Add AI Analysis button
        aiAnalyzeBtn = document.createElement('button');
        aiAnalyzeBtn.id = 'aiAnalyzeBtn';
        aiAnalyzeBtn.className = 'btn-secondary hidden';
        aiAnalyzeBtn.innerHTML = '🤖 AI Analysis';
        aiAnalyzeBtn.addEventListener('click', runAIAnalysis);
        reportActions.appendChild(aiAnalyzeBtn);
    }
    
    // Create AI Analysis panel
    const statusPanel = document.querySelector('.status-panel');
    if (statusPanel && !document.getElementById('aiAnalysisPanel')) {
        aiAnalysisPanel = document.createElement('div');
        aiAnalysisPanel.id = 'aiAnalysisPanel';
        aiAnalysisPanel.className = 'card ai-analysis-card hidden';
        aiAnalysisPanel.innerHTML = `
            <div class="card-header">
                <h2>🤖 AI Analysis (Ollama LLM 3.2)</h2>
                <span id="aiLoader" class="loader hidden"></span>
            </div>
            <div id="aiAnalysisContent" class="ai-analysis-content">
                <p class="ai-placeholder">Click "AI Analysis" to get AI-powered insights on the health check results.</p>
            </div>
        `;
        statusPanel.insertBefore(aiAnalysisPanel, statusPanel.querySelector('.history-card'));
        
        aiAnalysisContent = document.getElementById('aiAnalysisContent');
        aiLoader = document.getElementById('aiLoader');
    }
}

// Run AI Analysis
async function runAIAnalysis() {
    if (!lastReportData || !lastReportData.checks) {
        alert('Please run a health check first!');
        return;
    }
    
    if (!ollamaConnected) {
        alert('Ollama is not connected. Please ensure Ollama is running locally with: ollama run llama3.2');
        return;
    }
    
    aiLoader.classList.remove('hidden');
    aiAnalyzeBtn.disabled = true;
    aiAnalyzeBtn.innerHTML = '🤖 Analyzing...';
    aiAnalysisPanel.classList.remove('hidden');
    aiAnalysisContent.innerHTML = '<p class="ai-analyzing">🤖 AI is analyzing the health check results...</p>';
    
    try {
        const response = await fetch('/ai-analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                checks: lastReportData.checks,
                envName: envDropdown.value,
                baseUrl: document.getElementById('baseUrl').value
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Convert markdown to HTML (basic)
            const htmlContent = markdownToHtml(data.analysis);
            aiAnalysisContent.innerHTML = htmlContent;
        } else {
            aiAnalysisContent.innerHTML = `<p class="ai-error">❌ Error: ${data.error || 'Analysis failed'}</p>`;
        }
    } catch (err) {
        console.error('AI Analysis error:', err);
        aiAnalysisContent.innerHTML = `<p class="ai-error">❌ Error: ${err.message}</p>`;
    } finally {
        aiLoader.classList.add('hidden');
        aiAnalyzeBtn.disabled = false;
        aiAnalyzeBtn.innerHTML = '🤖 AI Analysis';
    }
}

// Basic markdown to HTML converter
function markdownToHtml(markdown) {
    if (!markdown) return '<p>No analysis available</p>';
    
    let html = markdown
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Code
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // Lists
        .replace(/^\- (.*$)/gim, '<li>$1</li>')
        // Line breaks
        .replace(/\n/g, '<br>');
    
    // Wrap consecutive li elements in ul
    html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');
    
    return `<div class="ai-markdown">${html}</div>`;
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
    if (aiAnalyzeBtn) aiAnalyzeBtn.classList.remove('hidden');
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
