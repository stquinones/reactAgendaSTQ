const fs = require('fs');

function generateReport(inputPath, outputPath) {
    const raw = fs.readFileSync(inputPath, 'utf8');

    const installPhase = extractSection(raw, "Entering phase install", "Entering phase pre_test");
    const preTestPhase = extractSection(raw, "Entering phase pre_test", "Entering phase test");
    const testPhase = extractSection(raw, "Entering phase test", "###########");

    const html = `
    <html>
    <head>
        <title>Device Farm Report</title>
        <style>
            body { font-family: Arial; padding: 20px; }
            h2 { color: #444; border-left: 4px solid #888; padding-left: 8px; }
            pre {
                background: #f4f4f4;
                padding: 10px;
                border-radius: 6px;
                overflow-x: auto;
                font-size: 13px;
            }
        </style>
    </head>
    <body>
        <h1>Reporte de Device Farm</h1>

        <h2>📦 Fase de Install</h2>
        <pre>${sanitize(installPhase)}</pre>

        <h2>🚀 Fase de Pre-Test</h2>
        <pre>${sanitize(preTestPhase)}</pre>

        <h2>🧪 Fase de Test</h2>
        <pre>${sanitize(testPhase)}</pre>

        <hr/>
        <p style="color:#666;">Reporte generado automáticamente por GitHub Actions.</p>
    </body>
    </html>
    `;

    fs.writeFileSync(outputPath, html, 'utf8');
}

function extractSection(text, startMarker, endMarker) {
    const start = text.indexOf(startMarker);
    if (start === -1) return "";

    const end = text.indexOf(endMarker, start + startMarker.length);
    if (end === -1) return text.substring(start);

    return text.substring(start, end);
}

function sanitize(str) {
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

generateReport(inputFile, outputFile);
