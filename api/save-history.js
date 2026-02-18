// Save history
const { readDB, writeDB, getCorsHeaders } = require('./_utils');

module.exports = async (req, res) => {
    const headers = getCorsHeaders();
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200, headers);
        res.end();
        return;
    }

    if (req.method !== 'POST') {
        res.writeHead(405, headers);
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    try {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { run } = JSON.parse(body);
                const data = readDB();
                if (!data.history) data.history = [];
                data.history.unshift(run);
                if (data.history.length > 50) data.history = data.history.slice(0, 50);
                writeDB(data);
                res.writeHead(200, headers);
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                console.error('Error saving history:', error);
                res.writeHead(400, headers);
                res.end(JSON.stringify({ error: 'Invalid request body' }));
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.writeHead(500, headers);
        res.end(JSON.stringify({ error: 'Server error' }));
    }
};
