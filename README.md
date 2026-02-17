# 🏥 Environment Health Checkup

A premium, automated environment health check system designed to validate web application availability, authentication flows, and API responsiveness across multiple environments (Dev, QA, Staging, Prod).

![Health Check Dashboard](https://img.shields.io/badge/Status-Active-success?style=flat-square) ![Tech](https://img.shields.io/badge/Stack-Node.js%20%7C%20Express%20%7C%20Playwright-blue?style=flat-square)

## 🌟 Features

*   **Multi-Environment Support**: Seamlessly switch between Dev, QA, Alpha, Beta, and Production configurations.
*   **Premium Dark UI**: A sleek, responsive dashboard built with glassmorphism aesthetics.
*   **Automated Validation**:
    *   **URL Accessibility**: Latency tracking (Warning > 5s).
    *   **Authentication**: Verifies login success and failure paths.
    *   **Element Diagnostics**: Identifies exactly which locator (User, Pass, Button) is missing if a check fails.
*   **Persistent Configuration**: Automatically saves your environment settings to a local JSON database.
*   **Run History**: Tracks the last 50 execution results with status and performance metrics.
*   **Interactive Reports**: Generate and download professional HTML reports with environment metadata.

## 🚀 Architecture Flow

```mermaid
graph TD
    User([User]) -->|Configures & Runs| UI[Premium Web Dashboard]
    UI -->|POST /run-check| Server[Express Server]
    Server -->|Executes| Tool[Playwright Health Tool]
    
    subgraph "Validation Logic"
        Tool -->|Check 1| URL[Base URL Access]
        Tool -->|Check 2| Auth[Login Flow Valid/Invalid]
        Tool -->|Check 3| API[API Endpoint check]
        Tool -->|Check 4| DB[Database Check]
    end
    
    Tool -- Returns JSON --> Server
    Server -- Stores Result --> DB[(Local JSON DB)]
    Server -- Updates UI --> UI
    
    UI -->|Download| Report[HTML Health Report]
```

## 🛠️ Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone <repository-url>
    cd Environment-Health-Checkup
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run the Dashboard**
    ```bash
    node server.js
    ```

4.  **Access the Application**
    Open your browser and navigate to: [http://localhost:3000](http://localhost:3000)

## 📂 Project Structure

```
├── public/                 # Frontend Assets
│   ├── index.html          # Dashboard UI
│   ├── style.css           # Premium Glassmorphism Styles
│   └── app.js              # Client-side Logic (Fetch, Charts)
├── tools/
│   └── ui_health_tool.js   # Core Playwright Script
├── server.js               # Backend API & Orchestration
├── db.json                 # Local Persistence (Configs & History)
├── main.js                 # CLI Entry Point (Legacy)
└── package.json            # Dependencies
```

## 🔧 Configuration

You can configure the following parameters directly from the UI for each environment:

*   **Base URL**: The application entry point.
*   **Credentials**: Username/Password for auth checks.
*   **Locators**: CSS/XPath selectors for login fields.
*   **API Endpoint**: Backend service URL for connectivity checks.

## 📝 License

This project is licensed under the MIT License.
