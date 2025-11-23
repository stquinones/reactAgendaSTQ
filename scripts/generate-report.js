const fs = require('fs');

// Entrada / salida
const inputFile = process.argv[2];
const outputFile = process.argv[3];

// Leer archivo completo
const raw = fs.readFileSync(inputFile, 'utf8');

// Buscar sección de resultados
const start = raw.indexOf('"spec" Reporter:');
const end = raw.indexOf('Spec Files:');

// Sanitizar caracteres peligrosos SIN romper HTML
function sanitize(str) {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Si no se encuentra la sección → crear HTML fallback
if (start === -1 || end === -1) {
  console.warn('⚠ No se encontró la sección del spec reporter.');

  const fallbackHtml = `
  <html>
  <head><meta charset="utf-8"/><title>Reporte Device Farm</title></head>
  <body style="font-family: Arial; padding: 20px;">
    <h2>⚠ No se detectaron resultados de ejecución</h2>
    <p>Verificá que el archivo <code>device-farm-output.txt</code> contenga la sección <strong>"spec" Reporter:</strong>.</p>
  </body>
  </html>`;
  fs.writeFileSync(outputFile, fallbackHtml);
  process.exit(0);
}

// Extraemos la sección relevante
const relevantSection = raw.substring(start, end + 200);

// Limpiamos prefijos como: [app-device-farm-atfsa__u.apk Android #0-0]
const cleanedSection = relevantSection.replace(/\[app-device-farm-[^\]]+\]\s*/g, '');

// Primero sanitizamos para evitar XSS, después agregamos estilos visuales
let formattedSection = sanitize(cleanedSection)
  .replace(/✓/g, '<span class="test-pass">✓</span>')
  .replace(/✗|x /g, '<span class="test-fail">✗</span>');

// Extraemos resumen de números
const passingMatch = relevantSection.match(/(\d+)\s+passing\s+\(([\dms .]+)\)/);
const specMatch = relevantSection.match(/Spec Files:\s+(\d+)\s+passed.*in\s+([\d:]+)/);

// Si falla algo en extracción, no rompemos el script
const summary = passingMatch
  ? `✔ ${passingMatch[1]} tests PASSED en ${passingMatch[2]}`
  : 'Resultado no detectado';

const specSummary = specMatch
  ? `📁 ${specMatch[1]} archivo/s OK — tiempo total ${specMatch[2]}`
  : 'Tiempo total no detectado';

// Armamos el HTML final
const htmlReport = `
<html>
<head>
  <meta charset="utf-8"/>
  <title>Reporte Device Farm</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: #fafafa; color: #333; }
    .summary { background: #e8ffe6; border-left: 5px solid #56d466; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .tag { display: inline-block; background: #3cb043; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; }
    .details { background: white; border-radius: 8px; border: 1px solid #ddd; padding: 20px; white-space: pre-wrap; font-size: 13px; line-height: 1.4; overflow-x: auto; }
    .test-pass { color: #3CB043; font-weight: bold; }
    .test-fail { color: #D72638; font-weight: bold; }
  </style>
</head>
<body>
  <h2>📄 Reporte de Automatización — AWS Device Farm</h2>
  <div class="summary">
    <span class="tag">PASSED ✔</span>
    <p><strong>${summary}</strong></p>
    <p>${specSummary}</p>
  </div>
  <h3>📌 Detalle de ejecución</h3>
  <div class="details">${formattedSection}</div>
</body>
</html>
`;

fs.writeFileSync(outputFile, htmlReport);
console.log("📄 Reporte HTML generado con éxito.");
