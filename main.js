// main.js - Layer 2: Navigation
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runHealthCheck() {
    console.log("# 🏥 Environment Health Check: Go/No-Go Report\n");

    const report = {
        timestamp: new Date().toISOString(),
        overallStatus: "Healthy",
        results: []
    };

    try {
        // Execute UI Health Tool
        console.log("Running UI Health Checks...");
        const uiResultsRaw = execSync('node tools/ui_health_tool.js').toString();

        // Robustly find the JSON object (starts with { and ends with })
        const jsonMatch = uiResultsRaw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Could not find JSON in tool output");

        const uiResults = JSON.parse(jsonMatch[0]);
        report.results.push(uiResults);

        // Print Markdown Table
        console.log("\n| Check | Status | Latency | Notes |");
        console.log("|-------|--------|---------|-------|");

        let anyFail = false;
        uiResults.checks.forEach(check => {
            const icon = check.status === "PASS" ? "✅" : (check.status === "WARNING" ? "⚠️" : "❌");
            console.log(`| ${check.check} | ${icon} | ${check.latency} | ${check.notes} |`);
            if (check.status === "FAIL" || check.status === "ERROR") anyFail = true;
        });

        report.overallStatus = anyFail ? "Broken" : "Healthy";

        console.log(`\n**OVERALL STATUS: ${report.overallStatus === "Healthy" ? "🟢 GO" : "🔴 NO-GO"}**`);

        // Save JSON Report
        const reportPath = path.join(__dirname, 'health_report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Report saved to: ${reportPath}`);

    } catch (err) {
        console.error(`\n❌ Fatal error during health check: ${err.message}`);
        process.exit(1);
    }
}

runHealthCheck();
