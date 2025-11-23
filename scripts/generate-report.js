const htmlReport = `
<html>
<head>
  <meta charset="utf-8"/>
  <title>Reporte Device Farm</title>
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      padding: 20px;
      background: #fafafa;
      color: #333;
    }
    h2 {
      color: #444;
      margin-bottom: 5px;
    }
    .summary {
      background: #e8ffe6;
      border-left: 5px solid #56d466;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .summary strong {
      font-size: 18px;
      color: #3cb043;
    }
    .tag {
      display: inline-block;
      background: #3cb043;
      color: white;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-bottom: 10px;
    }
    .details {
      background: white;
      border-radius: 8px;
      border: 1px solid #ddd;
      padding: 20px;
      white-space: pre-wrap;
      font-size: 13px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      overflow-x: auto;
    }
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
  <div class="details">${sanitize(relevantSection)}</div>
</body>
</html>
`;
