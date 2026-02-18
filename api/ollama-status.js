// Check Ollama LLM 3.2 status
const { getCorsHeaders } = require('./_utils');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

module.exports = async (req, res) => {
    const headers = getCorsHeaders();
    
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
        // Check if Ollama is running
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${OLLAMA_HOST}/api/tags`, {
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error('Ollama server not responding');
        }

        const data = await response.json();
        const hasModel = data.models && data.models.some(m => m.name.includes(OLLAMA_MODEL));

        res.writeHead(200, headers);
        res.end(JSON.stringify({
            connected: true,
            host: OLLAMA_HOST,
            model: OLLAMA_MODEL,
            modelAvailable: hasModel,
            models: data.models ? data.models.map(m => m.name) : []
        }));
    } catch (error) {
        console.error('Ollama Status Error:', error.message);
        res.writeHead(200, headers);
        res.end(JSON.stringify({
            connected: false,
            host: OLLAMA_HOST,
            model: OLLAMA_MODEL,
            error: error.message,
            message: 'Ollama not available. Please ensure Ollama is running locally with: ollama run llama3.2'
        }));
    }
};
