// Shared utilities for API routes
const path = require('path');
const fs = require('fs');

// Use /tmp for serverless environments (Vercel), fallback to local for development
const DB_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..');
const DB_PATH = path.join(DB_DIR, 'db.json');

// Initialize database
function initDB() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            const defaultData = {
                configs: {
                    "Dev": {},
                    "QA": {
                        baseUrl: "",
                        username: "",
                        password: "",
                        dashboardUrl: "",
                        selectorUser: '',
                        selectorPass: '',
                        selectorBtn: '',
                        errorMsg: "",
                        apiEndpoint: ""
                    },
                    "Alpha": {},
                    "Beta": {},
                    "Production": {}
                },
                history: [],
                archive: []
            };
            fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        // Ensure all required fields exist
        if (!data.history) data.history = [];
        if (!data.archive) data.archive = [];
        return data;
    } catch (error) {
        console.error('DB Init Error:', error);
        return { configs: {}, history: [], archive: [] };
    }
}

// Read database
function readDB() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return initDB();
        }
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch (error) {
        console.error('DB Read Error:', error);
        return { configs: {}, history: [], archive: [] };
    }
}

// Write database
function writeDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('DB Write Error:', error);
        return false;
    }
}

// CORS headers
function getCorsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
}

module.exports = {
    DB_PATH,
    initDB,
    readDB,
    writeDB,
    getCorsHeaders
};
