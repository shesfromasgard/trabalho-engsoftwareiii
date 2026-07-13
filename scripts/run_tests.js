const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const baseDir = path.join(__dirname, '..');
const refactoredDir = path.join(baseDir, 'Amostras_Refatoradas');
const originalsDir = path.join(baseDir, 'Amostras_Originais');
const resultsDir = path.join(baseDir, 'resultados');
const logsDir = path.join(resultsDir, 'logs', 'testes');

const takenoteDir = path.resolve(
  process.env.TAKENOTE_DIR || path.join(baseDir, 'repos', 'takenote'),
);
const reactAdminDir = path.resolve(
  process.env.REACT_ADMIN_DIR || path.join(baseDir, 'repos', 'react-material-admin'),
);

const expectedCommits = {
  TakeNote: 'e0eddbb9a21ae4cf4c4c7c183f29cfd666e08331',
  ReactAdmin: 'dd136027c2253253cfb5b8a4cb698696fb63f8cd',
};

const fileMappings = {
  'TakeNote_SettingsModal.tsx': 'src/client/containers/SettingsModal.tsx',
  'TakeNote_NoteList.tsx': 'src/client/containers/NoteList.tsx',
  'TakeNote_ContextMenuOptions.tsx': 'src/client/containers/ContextMenuOptions.tsx',
  'TakeNote_CategoryList.tsx': 'src/client/containers/CategoryList.tsx',
  'TakeNote_NoteMenuBar.tsx': 'src/client/containers/NoteMenuBar.tsx',
  'TakeNote_CategoryOption.tsx': 'src/client/containers/CategoryOption.tsx',
  'TakeNote_LandingPage.tsx': 'src/client/components/LandingPage.tsx',
  'TakeNote_ContextMenu.tsx': 'src/client/containers/ContextMenu.tsx',
  'TakeNote_KeyboardShortcuts.tsx': 'src/client/containers/KeyboardShortcuts.tsx',
  'TakeNote_TakeNoteApp.tsx': 'src/client/containers/TakeNoteApp.tsx',
  'TakeNote_AppSidebar.tsx': 'src/client/containers/AppSidebar.tsx',
  'TakeNote_NoteEditor.tsx': 'src/client/containers/NoteEditor.tsx',
  'TakeNote_FolderOption.tsx': 'src/client/components/AppSidebar/FolderOption.tsx',
  'TakeNote_PreviewEditor.tsx': 'src/client/components/Editor/PreviewEditor.tsx',
  'TakeNote_App.tsx': 'src/client/containers/App.tsx',
  'ReactAdmin_Dashboard.js': 'src/pages/dashboard/Dashboard.js',
  'ReactAdmin_AddUser.js': 'src/pages/user/AddUser.js',
  'ReactAdmin_Ecommerce.js': 'src/pages/ecommerce/Ecommerce.js',
  'ReactAdmin_UserList.js': 'src/pages/user/UserList.js',
  'ReactAdmin_Products.js': 'src/pages/ecommerce/Products.js',
};

const llms = ['Gemini', 'DeepSeek', 'Mistral'];
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function csvEscape(value) {
  const text = String(value ?? '');
  return /[\n\r,\"]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function normalizedText(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function run(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    env: { ...process.env, CI: 'true', FORCE_COLOR: '0', NO_COLOR: '1' },
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    windowsHide: true,
    shell: process.platform === 'win32',
  });
}

function currentCommit(repoDir) {
  const result = run('git', ['rev-parse', 'HEAD'], repoDir);
  return result.status === 0 ? result.stdout.trim() : null;
}

function assertRepository(repoName, repoDir) {
  const packageFile = path.join(repoDir, 'package.json');
  if (!fs.existsSync(packageFile)) {
    throw new Error(`${repoName}: repositório ausente em ${repoDir}`);
  }
  const commit = currentCommit(repoDir);
  if (commit !== expectedCommits[repoName]) {
    throw new Error(
      `${repoName}: commit ${commit || 'não identificado'}; esperado ${expectedCommits[repoName]}`,
    );
  }
}

function testCommand(repoName) {
  return repoName === 'TakeNote'
    ? ['test', '--', '--runInBand', '--watchAll=false']
    : ['test', '--', '--reporter=dot'];
}

function parseTestCount(output) {
  const patterns = [
    /Tests:\s+(\d+) passed/i,
    /Tests\s+(\d+) passed/i,
    /Tests:\s+\d+ failed,\s+(\d+) passed/i,
  ];
  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match) return Number(match[1]);
  }
  return '';
}

function summarizeFailure(output) {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.replace(/\x1b\[[0-9;]*m/g, '').trim())
    .filter(Boolean);
  const relevant = lines.find((line) => /FAIL|Error:|failed|Cannot find|SyntaxError/i.test(line));
  return (relevant || lines.at(-1) || 'Falha sem mensagem').slice(0, 300);
}

function executeSuite(repoName, repoDir, logStem) {
  const result = run(npmCommand, testCommand(repoName), repoDir);
  const output = `${result.stdout || ''}\n${result.stderr || ''}\n${result.error?.stack || ''}`.trim();
  fs.writeFileSync(path.join(logsDir, `${logStem}.log`), output, 'utf8');
  return {
    status: result.status === 0 ? 'PASS' : 'FAIL',
    exitCode: result.status ?? -1,
    testsPassed: parseTestCount(output),
    evidence: result.status === 0 ? 'Suíte concluída sem falhas' : summarizeFailure(output),
  };
}

fs.mkdirSync(logsDir, { recursive: true });
assertRepository('TakeNote', takenoteDir);
assertRepository('ReactAdmin', reactAdminDir);

const metadata = {
  executedAt: new Date().toISOString(),
  platform: `${os.platform()} ${os.release()} ${os.arch()}`,
  node: process.version,
  repositories: {
    TakeNote: { path: takenoteDir, commit: expectedCommits.TakeNote },
    ReactAdmin: { path: reactAdminDir, commit: expectedCommits.ReactAdmin },
  },
  modelMetadata: {
    labels: llms,
    fullVersions: 'não preservadas nos artefatos originais',
    samplingParameters: 'não preservados nos artefatos originais',
  },
};

console.log('Executando baselines...');
metadata.baseline = {
  TakeNote: executeSuite('TakeNote', takenoteDir, 'baseline_takenote'),
  ReactAdmin: executeSuite('ReactAdmin', reactAdminDir, 'baseline_reactadmin'),
};
if (metadata.baseline.TakeNote.status !== 'PASS' || metadata.baseline.ReactAdmin.status !== 'PASS') {
  throw new Error('Ao menos uma suíte falhou no baseline; a substituição foi interrompida.');
}

const results = [];
for (const llm of llms) {
  for (const [file, relativeTarget] of Object.entries(fileMappings)) {
    const source = path.join(refactoredDir, llm, file);
    if (!fs.existsSync(source)) {
      throw new Error(`Amostra ausente: ${source}`);
    }

    const repoName = file.startsWith('TakeNote_') ? 'TakeNote' : 'ReactAdmin';
    const repoDir = repoName === 'TakeNote' ? takenoteDir : reactAdminDir;
    const target = path.join(repoDir, relativeTarget);
    if (!fs.existsSync(target)) {
      throw new Error(`Arquivo-alvo ausente: ${target}`);
    }

    const archivedOriginal = path.join(originalsDir, file);
    if (!fs.existsSync(archivedOriginal)) {
      throw new Error(`Original arquivado ausente: ${archivedOriginal}`);
    }
    if (normalizedText(archivedOriginal) !== normalizedText(target)) {
      throw new Error(`Original arquivado diverge do commit esperado: ${file}`);
    }

    const original = fs.readFileSync(target);
    console.log(`[${llm}] ${file}`);
    let testResult;
    try {
      fs.copyFileSync(source, target);
      testResult = executeSuite(
        repoName,
        repoDir,
        `${llm.toLowerCase()}_${file.replace(/[^a-zA-Z0-9_.-]/g, '_')}`,
      );
    } finally {
      fs.writeFileSync(target, original);
    }

    results.push({
      LLM: llm,
      Repositorio: repoName,
      Arquivo: file,
      Status: testResult.status,
      CodigoSaida: testResult.exitCode,
      TestesAprovados: testResult.testsPassed,
      SHA256Entrada: sha256(source),
      Evidencia: testResult.evidence,
    });
  }
}

const headers = Object.keys(results[0]);
const csv = [
  headers.join(','),
  ...results.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
].join('\n');
fs.writeFileSync(path.join(resultsDir, 'Resultados_Testes_reexecucao.csv'), `${csv}\n`, 'utf8');
fs.writeFileSync(
  path.join(resultsDir, 'metadados_reexecucao.json'),
  `${JSON.stringify({ ...metadata, runs: results.length }, null, 2)}\n`,
  'utf8',
);

const counts = results.reduce((acc, row) => {
  acc[row.LLM] ||= { PASS: 0, FAIL: 0 };
  acc[row.LLM][row.Status] += 1;
  return acc;
}, {});
console.log('Resumo:', counts);
