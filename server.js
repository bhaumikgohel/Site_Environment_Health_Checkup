const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// Initialize local DB if not exists
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
        configs: {
            "Dev": {},
            "QA": {
                baseUrl: "https://qa.app.waas.sdsaz.us/",
                username: "admin@waas.com",
                password: "login12*",
                dashboardUrl: "https://qa.app.waas.sdsaz.us/dashboard/1",
                selectorUser: 'input[id="txt_username"]',
                selectorPass: 'input[id="txt_password"]',
                selectorBtn: 'button[id="btn_login"]',
                errorMsg: "Sign in username/email or password provided is not valid. Please try again.",
                apiEndpoint: "https://qa.app.waas.sdsaz.us/"
            },
            "Alpha": {},
            "Beta": {},
            "Production": {}
        },
        history: [],
        archive: []
    }, null, 2));
} else {
    // Migration: ensure history and archive exist
    const data = JSON.parse(fs.readFileSync(DB_PATH));
    let changed = false;
    if (!data.history) { data.history = []; changed = true; }
    if (!data.archive) { data.archive = []; changed = true; }
    if (changed) fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

app.use(bodyParser.json());
app.use(express.static('public'));

// Endpoints for Local DB
app.get('/configs', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_PATH));
    res.json(data.configs);
});

app.post('/save-config', (req, res) => {
    const { env, config } = req.body;
    const data = JSON.parse(fs.readFileSync(DB_PATH));
    data.configs[env] = config;
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    res.json({ success: true });
});

app.get('/history', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_PATH));
    res.json(data.history);
});

app.post('/save-history', (req, res) => {
    const { run } = req.body;
    const data = JSON.parse(fs.readFileSync(DB_PATH));
    data.history.unshift(run); // Add to the beginning
    // Keep last 50 runs
    if (data.history.length > 50) data.history = data.history.slice(0, 50);
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    res.json({ success: true });
});

app.get('/archive', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_PATH));
    res.json(data.archive);
});

app.post('/archive-config', (req, res) => {
    const { config } = req.body;
    const data = JSON.parse(fs.readFileSync(DB_PATH));
    data.archive.unshift({
        ...config,
        archivedAt: new Date().toISOString()
    });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    res.json({ success: true });
});

app.post('/run-check', (req, res) => {
    const {
        baseUrl, username, password, dashboardUrl,
        selectorUser, selectorPass, selectorBtn,
        errorMsg, apiEndpoint
    } = req.body;

    const env = {
        ...process.env,
        DYNAMIC_BASE_URL: baseUrl,
        DYNAMIC_USERNAME: username,
        DYNAMIC_PASSWORD: password,
        DYNAMIC_DASHBOARD_URL: dashboardUrl,
        DYNAMIC_SELECTOR_USER: selectorUser,
        DYNAMIC_SELECTOR_PASS: selectorPass,
        DYNAMIC_SELECTOR_BTN: selectorBtn,
        DYNAMIC_ERROR_MSG: errorMsg,
        DYNAMIC_API_ENDPOINT: apiEndpoint
    };

    console.log(`Running health check for: ${baseUrl}`);

    exec('node tools/ui_health_tool.js', { env }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Exec error: ${error}`);
            return res.status(500).json({ error: error.message });
        }

        try {
            const jsonMatch = stdout.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Could not find JSON in tool output");
            const results = JSON.parse(jsonMatch[0]);
            res.json(results);
        } catch (e) {
            console.error(`Parse error: ${e.message}`);
            res.status(500).json({ error: "Failed to parse tool output", raw: stdout });
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Health Check Server running at http://localhost:${PORT}`);
});
