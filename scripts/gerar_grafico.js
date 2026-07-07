const fs = require('fs');
const path = require('path');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const baseDir = path.join(__dirname, '..');
const resultadosDir = path.join(baseDir, 'resultados');
const csvPath = path.join(resultadosDir, 'complexidade.csv');

if (!fs.existsSync(csvPath)) {
    console.error("Arquivo complexidade.csv não encontrado.");
    process.exit(1);
}

const csvData = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
const labels = [];
const data = [];

// Ignorar o cabeçalho
for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i].split(',');
    if (row.length === 2) {
        labels.push(row[0]);
        data.push(parseFloat(row[1]));
    }
}

const width = 800;
const height = 600;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });

const configuration = {
    type: 'bar',
    data: {
        labels: labels,
        datasets: [{
            label: 'Complexidade Ciclomática Média',
            data: data,
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Complexidade Média'
                }
            }
        },
        plugins: {
            title: {
                display: true,
                text: 'Comparativo de Complexidade Ciclomática (Pré e Pós Refatoração)'
            }
        }
    }
};

async function generateChart() {
    const image = await chartJSNodeCanvas.renderToBuffer(configuration);
    const outputPath = path.join(resultadosDir, 'grafico_complexidade.png');
    fs.writeFileSync(outputPath, image);
    console.log(`Gráfico gerado em: ${outputPath}`);
}

generateChart();
