const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseDir = path.join(__dirname, '..');
const roots = ['Amostras_Originais', 'Amostras_Refatoradas', 'resultados', 'scripts'];
const excluded = new Set(['manifesto_sha256.csv']);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function csv(value) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const rootFiles = fs
  .readdirSync(baseDir, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => path.join(baseDir, entry.name));

const files = [...roots.flatMap((root) => walk(path.join(baseDir, root))), ...rootFiles]
  .filter((file) => !excluded.has(path.basename(file)))
  .sort((a, b) => a.localeCompare(b));

const rows = files.map((file) => {
  const relative = path.relative(baseDir, file).split(path.sep).join('/');
  return [relative, fs.statSync(file).size, sha256(file)].map(csv).join(',');
});

const output = ['Caminho,Bytes,SHA256', ...rows].join('\n');
fs.writeFileSync(path.join(baseDir, 'resultados', 'manifesto_sha256.csv'), `${output}\n`, 'utf8');
console.log(`Manifesto gerado para ${rows.length} arquivos.`);
