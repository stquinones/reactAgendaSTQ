const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
const outputPath = process.argv[3];

// Leer archivo original
const raw = fs.readFileSync(inputPath, 'utf8');

// Buscar sección relevante
const start = raw.indexOf('"spec" Reporter:');
const end = raw.indexOf('Spec Files:');

if (start === -1 || end === -1) {
  console.error('⚠ No se encontró la sección del spec reporter.');
  process.exit(1);
}

const relevantSection = raw.substring(start, end + 100); // un poco más para incluir toda la línea

// Extraer el número de pasados y tiempo
const passingMatch = relevantSection.match(/(\d+)\s+passing\s+\(([\dms .]+)\)/);
const specMatch = relevantSection.match(/Spec Files:\s+(\d+)\s+passed.*in\s+([\d:]+)/);

const summary = passingMatch
  ? `✔ ${passingMatch[1]} tests PASSED en ${passingMatch[2]}`
  : 'Resultado no detectado';

const specSummary = specMatch
  ? `📁 ${specMatch[1]} archivo OK — tiempo total ${specMatch[2]}`
  : 'Tiempo no detectado';

// Construcción del HTML
const htmlReport = `
<html>
<head>
  <meta charset="utf-8"/>
  <title>Reporte Automation</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .summary { background: #e8ffe6; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <h2>📄 Reporte de Automatización — AWS Device Farm</h2>
  <div class="summary">
    <p><strong>${summary}</strong></p>
    <p>${specSummary}</p>
  </div>
  <h3>📌 Detalle de ejecución</h3>
  <pre>${relevantSection}</pre>
</body>
</html>
`;

// Guardar archivo
fs.writeFileSync(outputPath, htmlReport);
console.log('Reporte HTML generado con éxito.');
