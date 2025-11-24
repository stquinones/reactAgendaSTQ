const fs = require('fs');

// Entrada / salida
const inputFile = process.argv[2];
const outputFile = process.argv[3];

// Leer archivo completo
const raw = fs.readFileSync(inputFile, 'utf8');

// Buscar sección de resultados
const start = raw.indexOf('"spec" Reporter:');
const end = raw.indexOf('Spec Files:');

// Sanitizar HTML
function sanitize(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Si no se encuentra la sección
if (start === -1 || end === -1) {
  console.warn('⚠ No se encontró la sección del spec reporter.');
  const fallbackHtml = `
  <html>
  <head><meta charset="utf-8"/><title>Reporte Device Farm</title></head>
  <body style="font-family: Arial; padding: 20px;">
    <h2>⚠ No se detectaron resultados de ejecución</h2>
  </body>
  </html>`;
  fs.writeFileSync(outputFile, fallbackHtml);
  process.exit(0);
}

// Extraer el bloque relevante
const relevantSection = raw.substring(start, end + 200);

// Limpiar prefijos de dispositivo
const cleanedSection = relevantSection.replace(/\[app-device-farm-[^\]]+\]\s*/g, '');

// Fecha
const fechaHoy = new Date().toLocaleDateString('es-AR');

// Extraer PASSED
const passingMatch = relevantSection.match(/(\d+)\s+passing\s+\(([\dms .]+)\)/);
const totalPassed = passingMatch ? parseInt(passingMatch[1]) : 0;
const duration = passingMatch ? passingMatch[2] : 'N/A';

// Extraer FAILED
const failedMatch = relevantSection.match(/(\d+)\s+(?:failing|failed)/);
const totalFailed = failedMatch ? parseInt(failedMatch[1]) : 0;

// Extraer archivos totales y tiempo
const specMatch = relevantSection.match(/Spec Files:.*?(\d+)\s+total.*?in\s+([\d:]+)/);
const specSummary = specMatch
  ? `📁 ${specMatch[1]} archivo/s — tiempo total ${specMatch[2]}`
  : 'Tiempo total no detectado';

// Preparación inicial
let formattedSection = cleanedSection.replace(
  /"spec"[\s\n\r]*Reporter:/,
  `__REPORTE_PLACEHOLDER__`
);

// Generar gráfico
const graficoHTML = (() => {
  const chartConfig = {
    type: 'pie',
    data: {
      labels: ['PASSED', 'FAILED'],
      datasets: [{
        data: [totalPassed, totalFailed],
        backgroundColor: ['#28a745', '#dc3545'], // Verde y rojo
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 2
      }]
    },
    options: { plugins: { legend: { labels: { usePointStyle: true } } } }
  };

  return `<img src="https://quickchart.io/chart?c=${encodeURIComponent(
    JSON.stringify(chartConfig)
  )}&format=png&width=400&height=400&backgroundColor=white" 
  alt="Resultados de Test" 
  style="max-width: 300px; border-radius: 8px; box-shadow: 0px 3px 6px #ddd;">`;
})();

// Formato visual
formattedSection = sanitize(formattedSection)
  .replace(/✓/g, '<span class="test-pass">✓</span>')
  .replace(/✗|✖|x /g, '<span class="test-fail">✖</span>');

// Insertar título de fallos en el lugar correcto
if (totalFailed > 0) {
  formattedSection = formattedSection.replace(
    /(\d+)\s+(?:failing|failed)/,
    `$1 failing\n\n<strong style="color:#dc3545;">❌ Detalle de los casos FAILED (${totalFailed})</strong>`
  );
}

// Reemplazo final de encabezado
formattedSection = formattedSection.replace(
  `__REPORTE_PLACEHOLDER__`,
  `<strong>Reporte – ${fechaHoy}</strong>`
);

// HTML final
const htmlReport = `
<html>
<head>
  <meta charset="utf-8"/>
  <title>Reporte Device Farm</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: #fafafa; color: #333; }
    .summary { background: ${totalFailed > 0 ? '#ffe8e8' : '#e8ffe6'}; border-left: 5px solid ${totalFailed > 0 ? '#dc3545' : '#28a745'}; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .test-pass { color: #28a745; font-weight: bold; }
    .test-fail { color: #dc3545; font-weight: bold; }
    .details { background: white; border-radius: 8px; border: 1px solid #ddd; padding: 20px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>📄 Reporte de Automatización — AWS Device Farm</h1>
  <h2><strong>Reporte – ${fechaHoy}</strong></h2>

  <div class="summary">
    <span style="color:#28a745;">✔ ${totalPassed} tests PASSED</span><br/>
    ${totalFailed > 0 ? `<span style="color:#dc3545;">❌ ${totalFailed} tests FAILED</span><br/>` : ''}
    ${specSummary}
  </div>

  <h2>📊 Resumen visual</h2>
  ${graficoHTML}

  <h2>📌 Detalle de ejecución</h2>
  <div class="details">${formattedSection}</div>

  <p style="font-size:12px; color:#777;">Reporte generado automáticamente por GitHub Actions.</p>
</body>
</html>
`;

fs.writeFileSync(outputFile, htmlReport);
console.log('📄 Reporte generado correctamente');
