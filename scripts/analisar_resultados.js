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
const meanMetric = (rows, field) => mean(rows.map((row) => number(row, field)));
const sumMetric = (rows, field) => sum(rows.map((row) => number(row, field)));

const repositoryRows = [];
for (const model of models) {
  for (const repository of repositories) {
    const rows = metrics.filter((row) => row.Modelo === model && row.Repositorio === repository);
    const baselineRows = metrics.filter((row) => row.Modelo === 'Original' && row.Repositorio === repository);
    const loc = meanMetric(rows, 'LOC');
    const baselineLoc = meanMetric(baselineRows, 'LOC');
    const cc = meanMetric(rows, 'CC_Total');
    const baselineCc = meanMetric(baselineRows, 'CC_Total');
    const decisions = meanMetric(rows, 'Decisoes_Total');
    const baselineDecisions = meanMetric(baselineRows, 'Decisoes_Total');
    const cognitive = meanMetric(rows, 'Cognitiva_Total');
    const baselineCognitive = meanMetric(baselineRows, 'Cognitiva_Total');
    const largestFunction = meanMetric(rows, 'Maior_Funcao_LOC');
    const baselineLargestFunction = meanMetric(baselineRows, 'Maior_Funcao_LOC');
    const nesting = meanMetric(rows, 'Aninhamento_Maximo');
    const baselineNesting = meanMetric(baselineRows, 'Aninhamento_Maximo');
    const duplication = meanMetric(rows, 'Duplicacao_Tokens_Pct');
    const baselineDuplication = meanMetric(baselineRows, 'Duplicacao_Tokens_Pct');
    const smells = sumMetric(rows, 'Code_Smells_Total');
    const baselineSmells = sumMetric(baselineRows, 'Code_Smells_Total');
    repositoryRows.push({
      Modelo: model,
      Repositorio: repository,
      Arquivos: rows.length,
      LOC_Media: round(loc),
      Reducao_LOC_Pct: model === 'Original' ? 0 : round(reduction(loc, baselineLoc)),
      CC_Media_Arquivo: round(cc),
      Reducao_CC_Pct: model === 'Original' ? 0 : round(reduction(cc, baselineCc)),
      Decisoes_Media_Arquivo: round(decisions),
      Reducao_Decisoes_Pct: model === 'Original' ? 0 : round(reduction(decisions, baselineDecisions)),
      Cognitiva_Media_Arquivo: round(cognitive),
      Reducao_Cognitiva_Pct: model === 'Original' ? 0 : round(reduction(cognitive, baselineCognitive)),
      Maior_Funcao_LOC_Media: round(largestFunction),
      Reducao_Maior_Funcao_Pct: model === 'Original' ? 0 : round(reduction(largestFunction, baselineLargestFunction)),
      Aninhamento_Maximo_Medio: round(nesting),
      Reducao_Aninhamento_Pct: model === 'Original' ? 0 : round(reduction(nesting, baselineNesting)),
      Duplicacao_Tokens_Media_Pct: round(duplication),
      Reducao_Duplicacao_Pct: model === 'Original' ? 0 : round(reduction(duplication, baselineDuplication)),
      Ocorrencias_Funcao_Longa: sumMetric(rows, 'Smell_Funcao_Longa'),
      Ocorrencias_CC_Alta: sumMetric(rows, 'Smell_CC_Alta'),
      Ocorrencias_Cognitiva_Alta: sumMetric(rows, 'Smell_Cognitiva_Alta'),
      Ocorrencias_Aninhamento: sumMetric(rows, 'Smell_Aninhamento'),
      Ocorrencias_Arquivo_Grande: sumMetric(rows, 'Smell_Arquivo_Grande'),
      Ocorrencias_Duplicacao: sumMetric(rows, 'Smell_Duplicacao'),
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
    const locDelta = number(row, 'LOC') - number(baseline, 'LOC');
    const ccDelta = number(row, 'CC_Total') - number(baseline, 'CC_Total');
    const decisionsDelta = number(row, 'Decisoes_Total') - number(baseline, 'Decisoes_Total');
    const cognitiveDelta = number(row, 'Cognitiva_Total') - number(baseline, 'Cognitiva_Total');
    const smellsDelta = number(row, 'Code_Smells_Total') - number(baseline, 'Code_Smells_Total');
    deltaRows.push({
      Modelo: model,
      Repositorio: row.Repositorio,
      Arquivo: row.Arquivo,
      Status_Teste: statusByOutput.get(`${model}|${row.Arquivo}`) || 'NAO_ENCONTRADO',
      Delta_LOC: locDelta,
      Reducao_LOC_Pct: round(reduction(number(row, 'LOC'), number(baseline, 'LOC'))),
      Delta_CC: ccDelta,
      Reducao_CC_Pct: round(reduction(number(row, 'CC_Total'), number(baseline, 'CC_Total'))),
      Delta_Decisoes: decisionsDelta,
      Reducao_Decisoes_Pct: round(
        reduction(number(row, 'Decisoes_Total'), number(baseline, 'Decisoes_Total')),
      ),
      Delta_Cognitiva: cognitiveDelta,
      Reducao_Cognitiva_Pct: round(
        reduction(number(row, 'Cognitiva_Total'), number(baseline, 'Cognitiva_Total')),
      ),
      Delta_Maior_Funcao_LOC: number(row, 'Maior_Funcao_LOC') - number(baseline, 'Maior_Funcao_LOC'),
      Delta_Aninhamento_Maximo: number(row, 'Aninhamento_Maximo') - number(baseline, 'Aninhamento_Maximo'),
      Delta_Duplicacao_Tokens_Pct:
        number(row, 'Duplicacao_Tokens_Pct') - number(baseline, 'Duplicacao_Tokens_Pct'),
      Delta_Funcao_Longa: number(row, 'Smell_Funcao_Longa') - number(baseline, 'Smell_Funcao_Longa'),
      Delta_CC_Alta: number(row, 'Smell_CC_Alta') - number(baseline, 'Smell_CC_Alta'),
      Delta_Cognitiva_Alta: number(row, 'Smell_Cognitiva_Alta') - number(baseline, 'Smell_Cognitiva_Alta'),
      Delta_Aninhamento: number(row, 'Smell_Aninhamento') - number(baseline, 'Smell_Aninhamento'),
      Delta_Arquivo_Grande: number(row, 'Smell_Arquivo_Grande') - number(baseline, 'Smell_Arquivo_Grande'),
      Delta_Duplicacao: number(row, 'Smell_Duplicacao') - number(baseline, 'Smell_Duplicacao'),
      Delta_Soma_Smells: smellsDelta,
    });
  }
}

const distributionRows = generatedModels.map((model) => {
  const modelDeltas = deltaRows.filter((row) => row.Modelo === model);
  const deltas = modelDeltas.map((row) => row.Delta_CC);
  const decisionDeltas = modelDeltas.map((row) => row.Delta_Decisoes);
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
    Decisoes_Melhoraram: decisionDeltas.filter((value) => value < 0).length,
    Decisoes_Iguais: decisionDeltas.filter((value) => value === 0).length,
    Decisoes_Pioraram: decisionDeltas.filter((value) => value > 0).length,
    Delta_Decisoes_Q1: round(quantile(decisionDeltas, 0.25)),
    Delta_Decisoes_Mediana: round(quantile(decisionDeltas, 0.5)),
    Delta_Decisoes_Q3: round(quantile(decisionDeltas, 0.75)),
    Delta_Decisoes_IQR: round(quantile(decisionDeltas, 0.75) - quantile(decisionDeltas, 0.25)),
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
    const loc = meanMetric(selected, 'LOC');
    const baselineLoc = meanMetric(baselines, 'LOC');
    const cc = meanMetric(selected, 'CC_Total');
    const baselineCc = meanMetric(baselines, 'CC_Total');
    const decisions = meanMetric(selected, 'Decisoes_Total');
    const baselineDecisions = meanMetric(baselines, 'Decisoes_Total');
    const cognitive = meanMetric(selected, 'Cognitiva_Total');
    const baselineCognitive = meanMetric(baselines, 'Cognitiva_Total');
    const largestFunction = meanMetric(selected, 'Maior_Funcao_LOC');
    const baselineLargestFunction = meanMetric(baselines, 'Maior_Funcao_LOC');
    const nesting = meanMetric(selected, 'Aninhamento_Maximo');
    const baselineNesting = meanMetric(baselines, 'Aninhamento_Maximo');
    const duplication = meanMetric(selected, 'Duplicacao_Tokens_Pct');
    const baselineDuplication = meanMetric(baselines, 'Duplicacao_Tokens_Pct');
    const smells = sumMetric(selected, 'Code_Smells_Total');
    const baselineSmells = sumMetric(baselines, 'Code_Smells_Total');
    sensitivityRows.push({
      Modelo: model,
      Escopo: scope,
      Arquivos: selected.length,
      LOC_Baseline_Media: round(baselineLoc),
      LOC_Media: round(loc),
      Reducao_LOC_Pct: round(reduction(loc, baselineLoc)),
      CC_Baseline_Media: round(baselineCc),
      CC_Media_Arquivo: round(cc),
      Reducao_CC_Pct: round(reduction(cc, baselineCc)),
      Decisoes_Baseline_Media: round(baselineDecisions),
      Decisoes_Media_Arquivo: round(decisions),
      Reducao_Decisoes_Pct: round(reduction(decisions, baselineDecisions)),
      Cognitiva_Baseline_Media: round(baselineCognitive),
      Cognitiva_Media_Arquivo: round(cognitive),
      Reducao_Cognitiva_Pct: round(reduction(cognitive, baselineCognitive)),
      Maior_Funcao_Baseline_Media: round(baselineLargestFunction),
      Maior_Funcao_LOC_Media: round(largestFunction),
      Reducao_Maior_Funcao_Pct: round(reduction(largestFunction, baselineLargestFunction)),
      Aninhamento_Baseline_Medio: round(baselineNesting),
      Aninhamento_Maximo_Medio: round(nesting),
      Reducao_Aninhamento_Pct: round(reduction(nesting, baselineNesting)),
      Duplicacao_Baseline_Media_Pct: round(baselineDuplication),
      Duplicacao_Tokens_Media_Pct: round(duplication),
      Reducao_Duplicacao_Pct: round(reduction(duplication, baselineDuplication)),
      Base_Funcao_Longa: sumMetric(baselines, 'Smell_Funcao_Longa'),
      Ocorrencias_Funcao_Longa: sumMetric(selected, 'Smell_Funcao_Longa'),
      Base_CC_Alta: sumMetric(baselines, 'Smell_CC_Alta'),
      Ocorrencias_CC_Alta: sumMetric(selected, 'Smell_CC_Alta'),
      Base_Cognitiva_Alta: sumMetric(baselines, 'Smell_Cognitiva_Alta'),
      Ocorrencias_Cognitiva_Alta: sumMetric(selected, 'Smell_Cognitiva_Alta'),
      Base_Aninhamento: sumMetric(baselines, 'Smell_Aninhamento'),
      Ocorrencias_Aninhamento: sumMetric(selected, 'Smell_Aninhamento'),
      Base_Arquivo_Grande: sumMetric(baselines, 'Smell_Arquivo_Grande'),
      Ocorrencias_Arquivo_Grande: sumMetric(selected, 'Smell_Arquivo_Grande'),
      Base_Duplicacao: sumMetric(baselines, 'Smell_Duplicacao'),
      Ocorrencias_Duplicacao: sumMetric(selected, 'Smell_Duplicacao'),
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
