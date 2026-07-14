const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const baseDir = path.join(__dirname, '..');
const resultsDir = path.join(baseDir, 'resultados');
const groups = [
  ['Original', path.join(baseDir, 'Amostras_Originais')],
  ['Gemini', path.join(baseDir, 'Amostras_Refatoradas', 'Gemini')],
  ['DeepSeek', path.join(baseDir, 'Amostras_Refatoradas', 'DeepSeek')],
  ['Mistral', path.join(baseDir, 'Amostras_Refatoradas', 'Mistral')],
];

const isFunctionLike = (node) =>
  ts.isFunctionDeclaration(node) ||
  ts.isFunctionExpression(node) ||
  ts.isArrowFunction(node) ||
  ts.isMethodDeclaration(node) ||
  ts.isGetAccessorDeclaration(node) ||
  ts.isSetAccessorDeclaration(node) ||
  ts.isConstructorDeclaration(node);

const isDecision = (node) =>
  ts.isIfStatement(node) ||
  ts.isForStatement(node) ||
  ts.isForInStatement(node) ||
  ts.isForOfStatement(node) ||
  ts.isWhileStatement(node) ||
  ts.isDoStatement(node) ||
  ts.isCaseClause(node) ||
  ts.isCatchClause(node) ||
  ts.isConditionalExpression(node) ||
  (ts.isBinaryExpression(node) &&
    [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(
      node.operatorToken.kind,
    ));

const isNestingStructure = (node) =>
  ts.isIfStatement(node) ||
  ts.isForStatement(node) ||
  ts.isForInStatement(node) ||
  ts.isForOfStatement(node) ||
  ts.isWhileStatement(node) ||
  ts.isDoStatement(node) ||
  ts.isSwitchStatement(node) ||
  ts.isCatchClause(node) ||
  ts.isConditionalExpression(node);

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[\n\r,\"]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(filePath, rows) {
  const headers = Object.keys(rows[0]);
  const content = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n');
  fs.writeFileSync(filePath, `${content}\n`, 'utf8');
}

function tokenMetrics(source, scriptKind, sourceFile) {
  const languageVariant = scriptKind === ts.ScriptKind.TSX || scriptKind === ts.ScriptKind.JSX
    ? ts.LanguageVariant.JSX
    : ts.LanguageVariant.Standard;
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, languageVariant, source);
  const tokens = [];
  const codeLines = new Set();
  for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken; kind = scanner.scan()) {
    const startPosition = scanner.getTokenPos();
    const endPosition = Math.max(startPosition, scanner.getTextPos() - 1);
    const startLine = sourceFile.getLineAndCharacterOfPosition(startPosition).line + 1;
    const endLine = sourceFile.getLineAndCharacterOfPosition(endPosition).line + 1;
    for (let line = startLine; line <= endLine; line += 1) codeLines.add(line);
    if (kind === ts.SyntaxKind.Identifier || kind === ts.SyntaxKind.PrivateIdentifier) tokens.push('ID');
    else if (kind === ts.SyntaxKind.NumericLiteral || kind === ts.SyntaxKind.BigIntLiteral) tokens.push('NUM');
    else if (
      kind === ts.SyntaxKind.StringLiteral ||
      kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
      kind === ts.SyntaxKind.TemplateHead ||
      kind === ts.SyntaxKind.TemplateMiddle ||
      kind === ts.SyntaxKind.TemplateTail ||
      kind === ts.SyntaxKind.JsxText
    ) tokens.push('STR');
    else tokens.push(ts.tokenToString(kind) || ts.SyntaxKind[kind]);
  }

  const shingleSize = 20;
  const occurrences = new Map();
  for (let index = 0; index <= tokens.length - shingleSize; index += 1) {
    const shingle = tokens.slice(index, index + shingleSize).join(' ');
    const positions = occurrences.get(shingle) || [];
    positions.push(index);
    occurrences.set(shingle, positions);
  }
  const duplicated = new Set();
  for (const positions of occurrences.values()) {
    if (positions.length < 2) continue;
    for (const start of positions) {
      for (let offset = 0; offset < shingleSize; offset += 1) duplicated.add(start + offset);
    }
  }
  return {
    loc: codeLines.size,
    codeLines,
    duplicatePercent: tokens.length ? (duplicated.size / tokens.length) * 100 : 0,
  };
}

function analyzeFunction(node, sourceFile, codeLines) {
  let cyclomatic = 1;
  let cognitive = 0;
  let maxNesting = 0;

  function visit(current, nesting, root) {
    if (!root && isFunctionLike(current)) return;
    if (isDecision(current)) cyclomatic += 1;

    const structural = isNestingStructure(current);
    if (structural) {
      cognitive += 1 + nesting;
      maxNesting = Math.max(maxNesting, nesting + 1);
    } else if (
      ts.isBinaryExpression(current) &&
      [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(
        current.operatorToken.kind,
      )
    ) {
      cognitive += 1;
    }

    ts.forEachChild(current, (child) => visit(child, structural ? nesting + 1 : nesting, false));
  }

  visit(node.body || node, 0, true);
  const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
  const loc = [...codeLines].filter((line) => line >= startLine && line <= endLine).length;
  return { cyclomatic, cognitive, loc, maxNesting };
}

function analyzeFile(filePath, model) {
  const source = fs.readFileSync(filePath, 'utf8');
  const extension = path.extname(filePath).toLowerCase();
  const scriptKind = extension === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.JSX;
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, scriptKind);
  const tokenData = tokenMetrics(source, scriptKind, sourceFile);
  const functions = [];
  function collect(node) {
    if (isFunctionLike(node) && node.body) functions.push(analyzeFunction(node, sourceFile, tokenData.codeLines));
    ts.forEachChild(node, collect);
  }
  collect(sourceFile);

  const cyclomaticValues = functions.map((item) => item.cyclomatic);
  const cognitiveValues = functions.map((item) => item.cognitive);
  const functionLocValues = functions.map((item) => item.loc);
  const nestingValues = functions.map((item) => item.maxNesting);
  const smells = {
    FuncaoLonga: functions.filter((item) => item.loc > 50).length,
    ComplexidadeCiclomaticaAlta: functions.filter((item) => item.cyclomatic > 10).length,
    ComplexidadeCognitivaAlta: functions.filter((item) => item.cognitive > 15).length,
    AninhamentoProfundo: functions.filter((item) => item.maxNesting > 3).length,
    ArquivoGrande: tokenData.loc > 300 ? 1 : 0,
    DuplicacaoElevada: tokenData.duplicatePercent >= 10 ? 1 : 0,
  };

  return {
    Modelo: model,
    Repositorio: path.basename(filePath).startsWith('TakeNote_') ? 'TakeNote' : 'ReactAdmin',
    Arquivo: path.basename(filePath),
    LOC: tokenData.loc,
    Funcoes: functions.length,
    CC_Total: cyclomaticValues.reduce((sum, value) => sum + value, 0),
    Decisoes_Total: cyclomaticValues.reduce((sum, value) => sum + value, 0) - functions.length,
    CC_Media_Funcao: round(mean(cyclomaticValues)),
    CC_Mediana_Funcao: round(median(cyclomaticValues)),
    CC_Maxima: Math.max(0, ...cyclomaticValues),
    Cognitiva_Total: cognitiveValues.reduce((sum, value) => sum + value, 0),
    Cognitiva_Media_Funcao: round(mean(cognitiveValues)),
    Cognitiva_Maxima: Math.max(0, ...cognitiveValues),
    Maior_Funcao_LOC: Math.max(0, ...functionLocValues),
    Aninhamento_Maximo: Math.max(0, ...nestingValues),
    Duplicacao_Tokens_Pct: round(tokenData.duplicatePercent),
    Smell_Funcao_Longa: smells.FuncaoLonga,
    Smell_CC_Alta: smells.ComplexidadeCiclomaticaAlta,
    Smell_Cognitiva_Alta: smells.ComplexidadeCognitivaAlta,
    Smell_Aninhamento: smells.AninhamentoProfundo,
    Smell_Arquivo_Grande: smells.ArquivoGrande,
    Smell_Duplicacao: smells.DuplicacaoElevada,
    Code_Smells_Total: Object.values(smells).reduce((sum, value) => sum + value, 0),
    Diagnosticos_Sintaticos: sourceFile.parseDiagnostics.length,
  };
}

fs.mkdirSync(resultsDir, { recursive: true });
const details = [];
for (const [model, directory] of groups) {
  const files = fs
    .readdirSync(directory)
    .filter((file) => /\.(js|tsx)$/i.test(file))
    .sort();
  for (const file of files) details.push(analyzeFile(path.join(directory, file), model));
}

const original = details.filter((row) => row.Modelo === 'Original');
const originalMeans = {
  LOC: mean(original.map((row) => row.LOC)),
  CC: mean(original.map((row) => row.CC_Total)),
  Decisoes: mean(original.map((row) => row.Decisoes_Total)),
  Cognitiva: mean(original.map((row) => row.Cognitiva_Total)),
  Smells: original.reduce((sum, row) => sum + row.Code_Smells_Total, 0),
};

const summaries = groups.map(([model]) => {
  const rows = details.filter((row) => row.Modelo === model);
  const loc = mean(rows.map((row) => row.LOC));
  const cc = mean(rows.map((row) => row.CC_Total));
  const decisions = mean(rows.map((row) => row.Decisoes_Total));
  const cognitive = mean(rows.map((row) => row.Cognitiva_Total));
  const smells = rows.reduce((sum, row) => sum + row.Code_Smells_Total, 0);
  const reduction = (value, baseline) => (baseline ? ((baseline - value) / baseline) * 100 : 0);
  return {
    Modelo: model,
    Arquivos: rows.length,
    LOC_Media: round(loc),
    Reducao_LOC_Pct: model === 'Original' ? 0 : round(reduction(loc, originalMeans.LOC)),
    CC_Media_Arquivo: round(cc),
    Decisoes_Media_Arquivo: round(decisions),
    Reducao_Decisoes_Pct: model === 'Original' ? 0 : round(reduction(decisions, originalMeans.Decisoes)),
    CC_Mediana_Funcao_Media: round(mean(rows.map((row) => row.CC_Mediana_Funcao))),
    CC_Maxima_Media: round(mean(rows.map((row) => row.CC_Maxima))),
    Cognitiva_Media_Arquivo: round(cognitive),
    Cognitiva_Maxima_Media: round(mean(rows.map((row) => row.Cognitiva_Maxima))),
    Maior_Funcao_LOC_Media: round(mean(rows.map((row) => row.Maior_Funcao_LOC))),
    Aninhamento_Maximo_Medio: round(mean(rows.map((row) => row.Aninhamento_Maximo))),
    Duplicacao_Media_Pct: round(mean(rows.map((row) => row.Duplicacao_Tokens_Pct))),
    Ocorrencias_Funcao_Longa: rows.reduce((sum, row) => sum + row.Smell_Funcao_Longa, 0),
    Ocorrencias_CC_Alta: rows.reduce((sum, row) => sum + row.Smell_CC_Alta, 0),
    Ocorrencias_Cognitiva_Alta: rows.reduce((sum, row) => sum + row.Smell_Cognitiva_Alta, 0),
    Ocorrencias_Aninhamento: rows.reduce((sum, row) => sum + row.Smell_Aninhamento, 0),
    Ocorrencias_Arquivo_Grande: rows.reduce((sum, row) => sum + row.Smell_Arquivo_Grande, 0),
    Ocorrencias_Duplicacao: rows.reduce((sum, row) => sum + row.Smell_Duplicacao, 0),
    Code_Smells_Total: smells,
    Reducao_CC_Pct: model === 'Original' ? 0 : round(reduction(cc, originalMeans.CC)),
    Reducao_Cognitiva_Pct: model === 'Original' ? 0 : round(reduction(cognitive, originalMeans.Cognitiva)),
    Reducao_Smells_Pct: model === 'Original' ? 0 : round(reduction(smells, originalMeans.Smells)),
    Diagnosticos_Sintaticos: rows.reduce((sum, row) => sum + row.Diagnosticos_Sintaticos, 0),
  };
});

writeCsv(path.join(resultsDir, 'metricas_por_arquivo.csv'), details);
writeCsv(path.join(resultsDir, 'metricas_resumo.csv'), summaries);
fs.writeFileSync(
  path.join(resultsDir, 'metodologia_metricas.json'),
  `${JSON.stringify(
    {
      parser: `TypeScript ${ts.version}`,
      definitions: {
        LOC: 'número de linhas atravessadas por ao menos um token não trivial; a mesma regra delimita LOC de arquivo e de função',
        cyclomatic: 'soma por arquivo da CC das funções: 1 por função mais if, laços, case, catch, ternário e operadores &&, || e ??',
        decisions: 'CC total menos o número de funções; aproxima os pontos de decisão sem o custo-base de 1 por função',
        cognitive: 'incremento estrutural ponderado pelo nível de aninhamento; operadores lógicos acrescentam 1',
        duplication: 'percentual de tokens cobertos por sequências normalizadas repetidas de 20 tokens no mesmo arquivo',
        interpretation: 'definições operacionais exploratórias; não equivalem a métricas de ferramenta comercial',
        smells: {
          longFunction: 'função com mais de 50 linhas',
          highCyclomatic: 'complexidade ciclomática maior que 10',
          highCognitive: 'complexidade cognitiva maior que 15',
          deepNesting: 'aninhamento maior que 3',
          largeFile: 'arquivo com mais de 300 LOC',
          highDuplication: 'duplicação de tokens igual ou superior a 10%',
        },
        smellThresholdStatus: 'limiares pré-especificados para esta análise, não pontos de corte validados para React',
        smellAggregation: 'soma exploratória de eventos heterogêneos; não constitui escala direta de qualidade',
      },
    },
    null,
    2,
  )}\n`,
  'utf8',
);
console.table(summaries);
