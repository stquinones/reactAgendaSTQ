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

// Detectamos fecha
const fechaHoy = new Date().toLocaleDateString('es-AR');

// Reemplazo de encabezado ("spec" → Reporte con fecha)
let formattedSection = cleanedSection.replace(/"spec"[\s\n\r]*Reporter:/, `Reporte – ${fechaHoy}`);

// Extraemos resumen de números
const passingMatch = relevantSection.match(/(\d+)\s+passing\s+\(([\dms .]+)\)/);
const totalPassed = passingMatch ? parseInt(passingMatch[1]) : 0;
const duration = passingMatch ? passingMatch[2] : 'N/A';

const specMatch = relevantSection.match(/Spec Files:\s+(\d+)\s+passed.*in\s+([\d:]+)/);
const specSummary = specMatch
  ? `📁 ${specMatch[1]} archivo/s OK — tiempo total ${specMatch[2]}`
  : 'Tiempo total no detectado';

// Función: generar gráfico de torta con QuickChart (sin librerías externas)
function generarGrafico() {
  const chartConfig = {
    type: 'pie',
    data: {
      labels: ['PASSED', 'FAILED'],
     datasets: [{
     data: [totalPassed, 0],
     backgroundColor: ['#28a745', '#dc3545'], // Verde y rojo
     borderColor: ['#ffffff', '#ffffff'], // Opcional: borde blanco
     borderWidth: 2
     }]
    }
  };

  const quickChartURL = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&format=png&width=400&height=400&backgroundColor=white`;

  return `<img src="${quickChartURL}" alt="Resultados de Test" style="max-width: 300px; border-radius: 8px; box-shadow: 0px 3px 6px #ddd;">`;
}

const graficoHTML = generarGrafico();

// Aplicamos formato visual verde/rojo y sanitización
formattedSection = sanitize(formattedSection)
  .replace(/✓/g, '<span class="test-pass">✓</span>')
  .replace(/✗|x /g, '<span class="test-fail">✗</span>');

// Armamos el HTML final
const htmlReport = `
<html>
<head>
  <meta charset="utf-8"/>
  <title>Reporte Device Farm</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: #fafafa; color: #333; }
    .summary { background: #e8ffe6; border-left: 5px solid #56d466; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .test-pass { color: #149635; font-weight: bold; }
    .test-fail { color: #961F14; font-weight: bold; }
    .details { background: white; border-radius: 8px; border: 1px solid #ddd; padding: 20px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>📄 Reporte de Automatización — AWS Device Farm</h1>

  <div class="summary">
    ✔ ${totalPassed} tests PASSED en ${duration}<br/>
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
