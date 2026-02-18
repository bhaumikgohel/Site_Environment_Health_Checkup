# 🚀 Vercel Deployment Guide with Ollama LLM 3.2

This guide will help you deploy the Environment Health Checkup application to Vercel with AI-powered analysis using Ollama LLM 3.2.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally
   ```bash
   npm install -g vercel
   ```
3. **Ollama** (for local AI features): Install from [ollama.com](https://ollama.com)

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Ollama Configuration (for local AI analysis)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

## 📦 Project Structure for Vercel

```
├── api/                    # Serverless API Functions
│   ├── _utils.js          # Shared utilities
│   ├── configs.js         # Get configurations
│   ├── save-config.js     # Save configuration
│   ├── history.js         # Get history
│   ├── save-history.js    # Save history
│   ├── archive.js         # Get archive
│   ├── archive-config.js  # Archive config
│   ├── run-check.js       # Run health check
│   ├── ai-analyze.js      # 🤖 Ollama LLM AI Analysis
│   └── ollama-status.js   # 🤖 Ollama Status Check
├── public/                # Static Assets
│   ├── index.html
│   ├── style.css          # Includes AI Analysis styles
│   └── app.js             # Includes AI Analysis UI
├── vercel.json            # Vercel configuration
└── package.json
```

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy to Preview**
   ```bash
   vercel
   ```

3. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Git Integration

1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository on [Vercel Dashboard](https://vercel.com/dashboard)
3. Vercel will auto-deploy on every push

## 🤖 Ollama LLM 3.2 Integration

### Setting up Ollama (Local)

The AI analysis feature requires Ollama to be running locally:

1. **Install Ollama**
   Download from [ollama.com](https://ollama.com)

2. **Download Llama 3.2 Model**
   ```bash
   ollama pull llama3.2
   ```

3. **Start Ollama Server**
   ```bash
   ollama serve
   ```

4. **Verify Installation**
   ```bash
   ollama run llama3.2
   ```

### How AI Analysis Works

1. Run a health check in the dashboard
2. Click the **🤖 AI Analysis** button
3. The app sends health check data to your local Ollama instance
4. LLM 3.2 analyzes the results and provides:
   - Overall health assessment
   - Critical issues identification
   - Recommendations for improvement
   - Performance observations

### Important Note on Ollama

⚠️ **Ollama runs locally** - The AI analysis feature requires Ollama to be running on your local machine. The deployed Vercel app will connect to your local Ollama instance via:

- **Local development**: `http://localhost:11434`
- **Production with tunnel**: Use tools like [ngrok](https://ngrok.com) to expose your local Ollama

```bash
# Expose Ollama via ngrok (for remote access)
ngrok http 11434
```

Then set the `OLLAMA_HOST` environment variable in Vercel to your ngrok URL.

## 🔧 Environment Variables on Vercel

Set these in your Vercel project settings:

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_HOST` | Ollama server URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | Model name | `llama3.2` |

## 🌐 Post-Deployment

### Access Your Application

After deployment, Vercel will provide you with a URL like:
```
https://your-project.vercel.app
```

### Features Available Online

✅ **Full Web Dashboard**  
✅ **Configuration Management**  
✅ **Run History Tracking**  ️
✅ **Health Check (Basic)**  
✅ **HTML Report Download**  
🤖 **AI Analysis** (requires local Ollama)  

### Limitations on Vercel

⚠️ **Playwright Limitation**: Full browser automation with Playwright is not supported in Vercel's serverless environment. The app uses simulated health checks for:
- URL accessibility
- API endpoint checks

For full Playwright functionality, consider deploying to:
- Railway
- Render
- AWS EC2
- DigitalOcean Droplets

## 🔄 Local Development

```bash
# Install dependencies
npm install

# Run locally (uses full Playwright)
node server.js

# Or use Vercel dev server
vercel dev
```

## 🛠️ Troubleshooting

### Ollama Connection Issues

**Problem**: AI Analysis shows "AI Offline"

**Solution**:
1. Ensure Ollama is running: `ollama serve`
2. Check if model is downloaded: `ollama list`
3. Verify model: `ollama run llama3.2`
4. Check firewall settings for port 11434

### Vercel Deployment Fails

**Problem**: Build errors

**Solution**:
```bash
# Update Vercel CLI
npm update -g vercel

# Clear cache and redeploy
vercel --force
```

### CORS Issues

The API routes include CORS headers. If you encounter issues:

1. Check `vercel.json` routes configuration
2. Ensure API files use the `_utils.getCorsHeaders()` function

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Ollama Documentation](https://github.com/ollama/ollama)
- [Llama 3.2 Model](https://ollama.com/library/llama3.2)

## 📝 Summary

✅ **Deployed Features**:
- Premium web dashboard with glassmorphism UI
- Multi-environment configuration
- Health check monitoring
- Run history tracking
- AI-powered analysis (with local Ollama)

🤖 **Ollama Integration**:
- Local LLM 3.2 processing for privacy
- Intelligent health report analysis
- Markdown-formatted insights
- Real-time status checking

---

**Need help?** Open an issue or check the troubleshooting section above.
