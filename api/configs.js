// Get configurations
const { readDB, getCorsHeaders } = require('./_utils');

module.exports = async (req, res) => {
    const headers = getCorsHeaders();
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, headers);
        res.end();
        return;
    }

    if (req.method !== 'GET') {
        res.writeHead(405, headers);
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    try {
        const data = readDB();
        res.writeHead(200, headers);
        res.end(JSON.stringify(data.configs));
    } catch (error) {
        console.error('Error fetching configs:', error);
        res.writeHead(500, headers);
        res.end(JSON.stringify({ error: 'Failed to fetch configurations' }));
    }
};
