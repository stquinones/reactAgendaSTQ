const fs = require('fs');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

// 📊 DATOS DEL GRÁFICO
const passed = 10;
const failed = 11;

const data = {
  labels: ['PASSED', 'FAILED'],
  datasets: [
    {
      data: [passed, failed],
      backgroundColor: ['#28A745', '#DC3545'], // verde y rojo
    },
  ],
};

// 🖼️ Ajustes de tamaño controlado
const width = 400;
const height = 400;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

async function generateChart() {
  const configuration = {
    type: 'pie',
    data,
    options: {
      responsive: false, // ⚠️ IMPORTANTE para no expandir
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 14 } },
        },
      },
    },
  };
  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

(async () => {
  // 🧹 Limpieza del detalle
  let rawExecutionDetails = fs.readFileSync('report/raw_details.txt', 'utf8');
  const cleanDetails = rawExecutionDetails.replace(/Timeout Error: [^\n]+/g, '⏱ Timeout en acción');

  // 🎨 Generar imagen
  const image = await generateChart();
  fs.writeFileSync('report/chart.png', image);

  // 📅 Timestamp
  const date = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

  // 📎 Texto para Slack
  const slackText = `
📌 *Resumen de ejecución – ${date}*

:bar_chart: *11 FAILED — 10 PASSED*
:iphone: *Dispositivo:* Android
:stopwatch: *Duración total:* 13m 39s
:file_folder: Archivos ejecutados: 1
:paperclip: *Ver reporte completo adjunto*

-------------------------

🧪 *Detalle simplificado:*
${cleanDetails}
`;

  // 📤 Guardar texto en archivo para usar en el workflow
  fs.writeFileSync('report/slack_message.txt', slackText);

  console.log('Reporte generado correctamente ✔️');
})();
