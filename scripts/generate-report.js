const fs = require('fs');

// Entrada / salida
const inputFile = process.argv[2];
const outputFile = process.argv[3];

// Leer archivo completo
const raw = fs.readFileSync(inputFile, 'utf8');

// Buscar sección de resultados
const start = raw.indexOf('"spec" Reporter:');
const end = raw.indexOf('Spec Files:');

// Sanitizar caracteres especiales
function sanitize(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Si no se encuentra la sección -> fallback
if (start === -1 || end === -1) {
  const fallbackHtml = `
  <html>
  <head><meta charset="utf-8"/><title>Reporte Device Farm</title></head>
  <body style="font-family: Arial; padding: 20px;">
    <h2>⚠ No se detectaron resultados de ejecución</h2>
    <p>Verificá que el archivo contenga la sección <strong>"spec" Reporter:</strong>.</p>
  </body>
  </html>`;
  fs.writeFileSync(outputFile, fallbackHtml);
  process.exit(0);
}

// Extraer parte relevante
const relevantSection = raw.substring(start, end + 200);
const cleanedSection = relevantSection.replace(/\[app-device-farm-[^\]]+\]\s*/g, '');

// Fecha para encabezado
const fechaHoy = new Date().toLocaleDateString('es-AR');

// Regex mejorada para PASSED
const passingMatch = relevantSection.match(/(\d+)\s+passing\s+\(([\dms .]+)\)/);
const totalPassed = passingMatch ? parseInt(passingMatch[1]) : 0;
const duration = passingMatch ? passingMatch[2] : 'No detectada';

// Capturar Failing
const failedMatch = relevantSection.match(/(\d+)\s+(?:failing|failed)/);
const totalFailed = failedMatch ? parseInt(failedMatch[1]) : 0;

// Capturar detalles de fallos
const failedDetailsMatch = relevantSection.match(/(\d+)\s+(?:failing|failed)[\s\S]+?(?=(\d+\spassing|$))/);
const failedDetails = failedDetailsMatch ? failedDetailsMatch[0] : null;

// Resumen Spec
const specMatch = relevantSection.match(/Spec Files:\s+(\d+)\s+passed.*in\s+([\d:]+)/);
const specSummary = specMatch
  ? `📁 ${specMatch[1]} archivo/s ejecutado/s — total ${specMatch[2]}`
  : 'Resumen no encontrado';

// Limpiar placeholder "spec reporter"
let formattedSection = cleanedSection.replace(
  /"spec"[\s\n\r]*Reporter:/,
  `__PLACEHOLDER_HEADER__`
);

// Gráfico
function generarGrafico() {
  const chartConfig = {
    type: 'pie',
    data: {
      labels: ['PASSED', 'FAILED'],
      datasets: [{
        data: [totalPassed, totalFailed],
        backgroundColor: ['#28a745', '#dc3545'], // Verde & Rojo
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 2
      }]
    }
  };

  return `<img src="https://quickchart.io/chart?c=${encodeURIComponent(
    JSON.stringify(chartConfig)
  )}&format=png&width=350&height=350&backgroundColor=white" 
  alt="Resultados de Test" 
  style="max-width: 300px; border-radius: 8px;">`;
}

const graficoHTML = generarGrafico();

// Aplicar formato visual
formattedSection = sanitize(formattedSection)
  .replace(/✓/g, '<span class="test-pass">✓</span>')
  .replace(/✗|x /g, '<span class="test-fail">✗</span>');

formattedSection = formattedSection.replace(
  '__PLACEHOLDER_HEADER__',
  `<strong>Reporte – ${fechaHoy}</strong>`
);

// Generar HTML final
const htmlReport = `
<html>
<head>
  <meta charset="utf-8"/>
  <title>Reporte Device Farm</title>
  <style>
    body { font-family:'Segoe UI', Arial, sans-serif; padding:20px; background:#fafafa; }
    h1 { margin-bottom: 10px; }
    .summary { background:#e8ffe6; border-left:5px solid #28a745; padding:15px; border-radius:8px; margin-bottom:20px; }
    .test-pass { color:#28a745; font-weight:bold; }
    .test-fail { color:#dc3545; font-weight:bold; }
    .details { background:white; border-radius:8px; border:1px solid #ddd; padding:20px; white-space:pre-wrap; }
  </style>
</head>
<body>
  <h1>📄 <strong>Reporte de Automatización – ${fechaHoy}</strong></h1>

  <div class="summary">
    ✔ ${totalPassed} tests PASSED (${duration})<br/>
    ${totalFailed > 0 ? `❌ ${totalFailed} tests FAILED<br/>` : '' }
    ${specSummary}
  </div>

  <h2>📊 Resumen visual</h2>
  ${graficoHTML}

  <h2>📌 Detalle de ejecución</h2>
  <div class="details">${formattedSection}</div>

  ${totalFailed > 0 ? `
    <h2 style="color:#dc3545;">❌ Detalle de los casos FAILED (${totalFailed})</h2>
    <div class="details" style="border-left:5px solid #dc3545;">
      ${sanitize(failedDetails)}
    </div>
  ` : ''}

  <p style="font-size:12px; color:#777;">Reporte generado automáticamente por GitHub Actions.</p>
</body>
</html>`;

fs.writeFileSync(outputFile, htmlReport);
console.log('📄 Reporte generado correctamente');
