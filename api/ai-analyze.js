// AI Analysis using Ollama LLM 3.2
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

    if (req.method !== 'POST') {
        res.writeHead(405, headers);
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        try {
            const { checks, envName, baseUrl } = JSON.parse(body);
            
            if (!checks || !Array.isArray(checks)) {
                res.writeHead(400, headers);
                res.end(JSON.stringify({ error: 'Invalid health check data' }));
                return;
            }

            // Generate AI analysis prompt
            const prompt = generateAnalysisPrompt(checks, envName, baseUrl);
            
            // Call Ollama API
            const analysis = await callOllama(prompt);

            res.writeHead(200, headers);
            res.end(JSON.stringify({
                success: true,
                analysis: analysis,
                model: OLLAMA_MODEL,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.error('AI Analysis Error:', error);
            res.writeHead(500, headers);
            res.end(JSON.stringify({
                error: error.message,
                message: 'AI analysis failed. Ensure Ollama is running with: ollama run llama3.2'
            }));
        }
    });
};

function generateAnalysisPrompt(checks, envName, baseUrl) {
    const failedChecks = checks.filter(c => c.status === 'FAIL' || c.status === 'ERROR');
    const warningChecks = checks.filter(c => c.status === 'WARNING');
    const passedChecks = checks.filter(c => c.status === 'PASS');

    let prompt = `Analyze this environment health check report and provide insights:

Environment: ${envName || 'Unknown'}
URL: ${baseUrl || 'Unknown'}

Check Results:
${checks.map(c => `- ${c.check}: ${c.status} (${c.latency}) - ${c.notes}`).join('\n')}

Summary:
- Passed: ${passedChecks.length}
- Warnings: ${warningChecks.length}
- Failed: ${failedChecks.length}
`;

    if (failedChecks.length > 0) {
        prompt += `\nFailed Checks Details:
${failedChecks.map(c => `- ${c.check}: ${c.notes}`).join('\n')}
`;
    }

    prompt += `
Please provide a concise analysis including:
1. Overall health assessment
2. Critical issues (if any)
3. Recommendations for improvement
4. Performance observations

Keep the response under 300 words and format it in Markdown.`;

    return prompt;
}

async function callOllama(prompt) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    max_tokens: 500
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ollama API error: ${error}`);
        }

        const data = await response.json();
        return data.response || 'No analysis generated';
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Ollama request timed out. Please check if Ollama is running.');
        }
        throw error;
    }
}
