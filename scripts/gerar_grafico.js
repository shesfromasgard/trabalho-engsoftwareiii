const fs = require('fs');
const path = require('path');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const baseDir = path.join(__dirname, '..');
const resultsDir = path.join(baseDir, 'resultados');
const csvPath = path.join(resultsDir, 'metricas_resumo.csv');

function parseCsv(content) {
  const [headerLine, ...lines] = content.trim().split(/\r?\n/);
  const headers = headerLine.split(',');
  return lines.map((line) => {
    const values = line.split(',');
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

if (!fs.existsSync(csvPath)) {
  throw new Error('Execute primeiro: npm run metricas');
}

const rows = parseCsv(fs.readFileSync(csvPath, 'utf8')).filter((row) => row.Modelo !== 'Original');
const width = 1200;
const height = 600;
const chart = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });

const configuration = {
  type: 'bar',
  data: {
    labels: rows.map((row) => row.Modelo),
    datasets: [
      {
        label: 'ΣCC (inclui 1 por função)',
        data: rows.map((row) => Number(row.Reducao_CC_Pct)),
        backgroundColor: '#2F75B5',
      },
      {
        label: 'Complexidade cognitiva',
        data: rows.map((row) => Number(row.Reducao_Cognitiva_Pct)),
        backgroundColor: '#70AD47',
      },
      {
        label: 'Soma exploratória de regras',
        data: rows.map((row) => Number(row.Reducao_Smells_Pct)),
        backgroundColor: '#ED7D31',
      },
    ],
  },
  options: {
    responsive: false,
    plugins: {
      title: {
        display: true,
        text: 'Redução percentual em relação aos componentes originais',
        font: { size: 22 },
      },
      legend: { position: 'bottom', labels: { font: { size: 15 } } },
    },
    scales: {
      y: {
        title: { display: true, text: 'Redução (%)', font: { size: 16 } },
        ticks: { callback: (value) => `${value}%`, font: { size: 13 } },
        grid: { color: '#D9E2F3' },
      },
      x: { ticks: { font: { size: 15 } } },
    },
  },
};

async function main() {
  const buffer = await chart.renderToBuffer(configuration);
  fs.writeFileSync(path.join(resultsDir, 'grafico_reducao_percentual.png'), buffer);
  console.log('Gráfico atualizado em resultados/grafico_reducao_percentual.png');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
