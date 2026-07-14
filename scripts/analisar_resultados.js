const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..');
const resultsDir = path.join(baseDir, 'resultados');
const metricsPath = path.join(resultsDir, 'metricas_por_arquivo.csv');
const testsPath = path.join(resultsDir, 'Resultados_Testes_reexecucao.csv');

function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    if (char === '"') {
      if (quoted && content[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && content[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [headers, ...data] = rows;
  return data.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[\n\r,"]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(fileName, rows) {
  if (!rows.length) throw new Error(`Nenhuma linha produzida para ${fileName}`);
  const headers = Object.keys(rows[0]);
  const content = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n');
  fs.writeFileSync(path.join(resultsDir, fileName), `${content}\n`, 'utf8');
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function quantile(values, probability) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (position - lower) * (sorted[upper] - sorted[lower]);
}

function reduction(value, baseline) {
  return baseline ? ((baseline - value) / baseline) * 100 : 0;
}

if (!fs.existsSync(metricsPath) || !fs.existsSync(testsPath)) {
  throw new Error('Execute os testes e as métricas antes da análise de sensibilidade.');
}

const metrics = parseCsv(fs.readFileSync(metricsPath, 'utf8'));
const tests = parseCsv(fs.readFileSync(testsPath, 'utf8'));
const models = ['Original', 'Gemini', 'DeepSeek', 'Mistral'];
const generatedModels = models.slice(1);
const repositories = ['ReactAdmin', 'TakeNote'];
const originalByFile = new Map(
  metrics.filter((row) => row.Modelo === 'Original').map((row) => [row.Arquivo, row]),
);
const statusByOutput = new Map(tests.map((row) => [`${row.LLM}|${row.Arquivo}`, row.Status]));
const number = (row, field) => Number(row[field]);

const repositoryRows = [];
for (const model of models) {
  for (const repository of repositories) {
    const rows = metrics.filter((row) => row.Modelo === model && row.Repositorio === repository);
    const baselineRows = metrics.filter((row) => row.Modelo === 'Original' && row.Repositorio === repository);
    const cc = mean(rows.map((row) => number(row, 'CC_Total')));
    const baselineCc = mean(baselineRows.map((row) => number(row, 'CC_Total')));
    const cognitive = mean(rows.map((row) => number(row, 'Cognitiva_Total')));
    const baselineCognitive = mean(baselineRows.map((row) => number(row, 'Cognitiva_Total')));
    const smells = sum(rows.map((row) => number(row, 'Code_Smells_Total')));
    const baselineSmells = sum(baselineRows.map((row) => number(row, 'Code_Smells_Total')));
    repositoryRows.push({
      Modelo: model,
      Repositorio: repository,
      Arquivos: rows.length,
      CC_Media_Arquivo: round(cc),
      Reducao_CC_Pct: model === 'Original' ? 0 : round(reduction(cc, baselineCc)),
      Cognitiva_Media_Arquivo: round(cognitive),
      Reducao_Cognitiva_Pct: model === 'Original' ? 0 : round(reduction(cognitive, baselineCognitive)),
      Soma_Exploratoria_Smells: smells,
      Reducao_Soma_Smells_Pct: model === 'Original' ? 0 : round(reduction(smells, baselineSmells)),
    });
  }
}

const deltaRows = [];
for (const model of generatedModels) {
  for (const row of metrics.filter((item) => item.Modelo === model)) {
    const baseline = originalByFile.get(row.Arquivo);
    if (!baseline) throw new Error(`Original ausente para ${row.Arquivo}`);
    const ccDelta = number(row, 'CC_Total') - number(baseline, 'CC_Total');
    const cognitiveDelta = number(row, 'Cognitiva_Total') - number(baseline, 'Cognitiva_Total');
    const smellsDelta = number(row, 'Code_Smells_Total') - number(baseline, 'Code_Smells_Total');
    deltaRows.push({
      Modelo: model,
      Repositorio: row.Repositorio,
      Arquivo: row.Arquivo,
      Status_Teste: statusByOutput.get(`${model}|${row.Arquivo}`) || 'NAO_ENCONTRADO',
      Delta_CC: ccDelta,
      Reducao_CC_Pct: round(reduction(number(row, 'CC_Total'), number(baseline, 'CC_Total'))),
      Delta_Cognitiva: cognitiveDelta,
      Reducao_Cognitiva_Pct: round(
        reduction(number(row, 'Cognitiva_Total'), number(baseline, 'Cognitiva_Total')),
      ),
      Delta_Soma_Smells: smellsDelta,
    });
  }
}

const distributionRows = generatedModels.map((model) => {
  const deltas = deltaRows.filter((row) => row.Modelo === model).map((row) => row.Delta_CC);
  return {
    Modelo: model,
    Arquivos: deltas.length,
    CC_Melhorou: deltas.filter((value) => value < 0).length,
    CC_Igual: deltas.filter((value) => value === 0).length,
    CC_Piorou: deltas.filter((value) => value > 0).length,
    Delta_CC_Q1: round(quantile(deltas, 0.25)),
    Delta_CC_Mediana: round(quantile(deltas, 0.5)),
    Delta_CC_Q3: round(quantile(deltas, 0.75)),
    Delta_CC_IQR: round(quantile(deltas, 0.75) - quantile(deltas, 0.25)),
  };
});

const sensitivityRows = [];
for (const model of generatedModels) {
  const modelRows = metrics.filter((row) => row.Modelo === model);
  for (const scope of ['Todas', 'PASS']) {
    const selected = scope === 'PASS'
      ? modelRows.filter((row) => statusByOutput.get(`${model}|${row.Arquivo}`) === 'PASS')
      : modelRows;
    const baselines = selected.map((row) => originalByFile.get(row.Arquivo));
    const cc = mean(selected.map((row) => number(row, 'CC_Total')));
    const baselineCc = mean(baselines.map((row) => number(row, 'CC_Total')));
    const cognitive = mean(selected.map((row) => number(row, 'Cognitiva_Total')));
    const baselineCognitive = mean(baselines.map((row) => number(row, 'Cognitiva_Total')));
    const smells = sum(selected.map((row) => number(row, 'Code_Smells_Total')));
    const baselineSmells = sum(baselines.map((row) => number(row, 'Code_Smells_Total')));
    sensitivityRows.push({
      Modelo: model,
      Escopo: scope,
      Arquivos: selected.length,
      CC_Baseline_Media: round(baselineCc),
      CC_Media_Arquivo: round(cc),
      Reducao_CC_Pct: round(reduction(cc, baselineCc)),
      Cognitiva_Baseline_Media: round(baselineCognitive),
      Cognitiva_Media_Arquivo: round(cognitive),
      Reducao_Cognitiva_Pct: round(reduction(cognitive, baselineCognitive)),
      Soma_Baseline_Smells: baselineSmells,
      Soma_Exploratoria_Smells: smells,
      Reducao_Soma_Smells_Pct: round(reduction(smells, baselineSmells)),
    });
  }
}

writeCsv('metricas_por_repositorio.csv', repositoryRows);
writeCsv('metricas_deltas_por_arquivo.csv', deltaRows);
writeCsv('metricas_distribuicao_cc.csv', distributionRows);
writeCsv('metricas_sensibilidade.csv', sensitivityRows);

console.table(distributionRows);
console.table(sensitivityRows);
