const fs = require('fs');

// Entrada / salida
const inputFile = process.argv[2];
const outputFile = process.argv[3];

// Leer archivo completo
const raw = fs.readFileSync(inputFile, 'utf8');

// Buscar sección de resultados
const start = raw.indexOf('"spec" Reporter:');
const end = raw.indexOf('Spec Files:');

// Sanitizar caracteres especiales para evitar que rompan el HTML
function sanitize(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Si no se encuentra la sección -> mostrar fallback
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

// Extraer la parte relevante
const relevantSection = raw.substring(start, end + 200);

// Eliminar prefijos del dispositivo
const cleanedSection = relevantSection.replace(/\[app-device-farm-[^\]]+\]\s*/g, '');

// Fecha para el encabezado
const fechaHoy = new Date().toLocaleDateString('es-AR');

// Extraer número de tests PASSED
const passingMatch = relevantSection.match(/(\d+)\s+passing\s+\(([\dms .]+)\)/);
const totalPassed = passingMatch ? parseInt(passingMatch[1]) : 0;
const duration = passingMatch ? passingMatch[2] : 'N/A';

// Extraer cantidad de tests FAILED
const failedMatch = relevantSection.match(/(\d+)\s+(?:failing|failed)/);
const totalFailed = failedMatch ? parseInt(failedMatch[1]) : 0;

// Extraer bloques de detalle de fallos
const failedDetailsMatch = relevantSection.match(/(\d+)\s+(?:failing|failed)[\s\S]+?(?=(\d+\spassing|$))/);
const failedDetails = failedDetailsMatch ? failedDetailsMatch[0] : null;

// Extraer resumen de archivos
const specMatch = relevantSection.match(/Spec Files:\s+(\d+)\s+passed.*in\s+([\d:]+)/);
const specSummary = specMatch
  ? `📁 ${specMatch[1]} archivo/s OK — tiempo total ${specMatch[2]}`
  : 'Tiempo total no detectado';

// Preparación para evitar escape de negrita
let formattedSection = cleanedSection.replace(
  /"spec"[\s\n\r]*Reporter:/,
  `__REPORTE_PLACEHOLDER__`
);

// 🎨 Generar gráfico de torta
function generarGrafico() {
  const chartConfig = {
    type: 'pie',
    data: {
      labels: ['PASSED', 'FAILED'],
      datasets: [{
        data: [totalPassed, totalFailed],
        backgroundColor: ['#28a745', '#dc3545'], // Verde y rojo
        hoverBackgroundColor: ['#28a745', '#dc3545'],
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            usePointStyle: true
          }
        }
      }
    }
  };

  return `<img src="https://quickchart.io/chart?c=${encodeURIComponent(
    JSON.stringify(chartConfig)
  )}&format=png&width=400&height=400&backgroundColor=white" 
  alt="Resultados de Test" 
  style="max-width: 300px; border-radius: 8px; box-shadow: 0px 3px 6px #ddd;">`;
}

const graficoHTML = generarGrafico();

// Aplicar sanitización y formato
formattedSection = sanitize(formattedSection)
  .replace(/✓/g, '<span class="test-pass">✓</span>')
  .replace(/✗|x /g, '<span class="test-fail">✗</span>');

// Reemplazo final sin sanear (para negrita)
formattedSection = formattedSection.replace(
  '__REPORTE_PLACEHOLDER__',
  `<strong>Reporte – ${fechaHoy}</strong>`
);

// Armado HTML final
const htmlReport = `
<html>
<head>
  <meta charset="utf-8"/>
  <title>Reporte Device Farm</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: #fafafa; color: #333; }
    .summary { background: #e8ffe6; border-left: 5px solid #56d466; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .test-pass { color: #28a745; font-weight: bold; }
    .test-fail { color: #dc3545; font-weight: bold; }
    .details { background: white; border-radius: 8px; border: 1px solid #ddd; padding: 20px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>📄 Reporte de Automatización — AWS Device Farm</h1>

  <div class="summary">
    ✔ ${totalPassed} tests PASSED en ${duration}<br/>
    ${totalFailed > 0 ? `❌ ${totalFailed} tests FAILED` : ''}<br/>
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
</html>
`;

fs.writeFileSync(outputFile, htmlReport);
console.log('📄 Reporte generado correctamente');
