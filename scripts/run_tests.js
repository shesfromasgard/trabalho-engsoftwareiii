const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const baseDir = __dirname;
const origDir = path.join(baseDir, 'Amostras_Originais');
const refactoredDir = path.join(baseDir, 'Amostras_Refatoradas');
const takenoteDir = path.join(baseDir, 'takenote-master');
const reactAdminDir = path.join(baseDir, 'react-material-admin-master');

const fileMappings = {
  "TakeNote_SettingsModal.tsx": "src/client/containers/SettingsModal.tsx",
  "TakeNote_NoteList.tsx": "src/client/containers/NoteList.tsx",
  "TakeNote_ContextMenuOptions.tsx": "src/client/containers/ContextMenuOptions.tsx",
  "TakeNote_CategoryList.tsx": "src/client/containers/CategoryList.tsx",
  "TakeNote_NoteMenuBar.tsx": "src/client/containers/NoteMenuBar.tsx",
  "TakeNote_CategoryOption.tsx": "src/client/containers/CategoryOption.tsx",
  "TakeNote_LandingPage.tsx": "src/client/components/LandingPage.tsx",
  "TakeNote_ContextMenu.tsx": "src/client/containers/ContextMenu.tsx",
  "TakeNote_KeyboardShortcuts.tsx": "src/client/containers/KeyboardShortcuts.tsx",
  "TakeNote_TakeNoteApp.tsx": "src/client/containers/TakeNoteApp.tsx",
  "TakeNote_AppSidebar.tsx": "src/client/containers/AppSidebar.tsx",
  "TakeNote_NoteEditor.tsx": "src/client/containers/NoteEditor.tsx",
  "TakeNote_FolderOption.tsx": "src/client/components/AppSidebar/FolderOption.tsx",
  "TakeNote_PreviewEditor.tsx": "src/client/components/Editor/PreviewEditor.tsx",
  "TakeNote_App.tsx": "src/client/containers/App.tsx",
  "ReactAdmin_Dashboard.js": "src/pages/dashboard/Dashboard.js",
  "ReactAdmin_AddUser.js": "src/pages/user/AddUser.js",
  "ReactAdmin_Ecommerce.js": "src/pages/ecommerce/Ecommerce.js",
  "ReactAdmin_UserList.js": "src/pages/user/UserList.js",
  "ReactAdmin_Products.js": "src/pages/ecommerce/Products.js"
};

const llms = ['Gemini', 'DeepSeek', 'Mistral'];
const results = [];

console.log("Iniciando bateria de testes de regressão...");

for (const llm of llms) {
  const llmDir = path.join(refactoredDir, llm);
  if (!fs.existsSync(llmDir)) continue;

  const files = fs.readdirSync(llmDir);
  for (const file of files) {
    if (!fileMappings[file]) continue;

    const refactoredFilePath = path.join(llmDir, file);
    const isTakeNote = file.startsWith("TakeNote_");
    const repoDir = isTakeNote ? takenoteDir : reactAdminDir;
    const originalRelativePath = fileMappings[file];
    const originalFilePath = path.join(repoDir, originalRelativePath);
    const backupFilePath = originalFilePath + ".backup";

    console.log(`[${llm}] Testando ${file}...`);
    try {
      fs.copyFileSync(originalFilePath, backupFilePath);
      fs.copyFileSync(refactoredFilePath, originalFilePath);

      const cmd = isTakeNote ? 'npm run test -- --watchAll=false' : 'npm run test';
      execSync(cmd, { cwd: repoDir, env: { ...process.env, CI: 'true' }, stdio: 'ignore' });
      
      console.log(`=> SUCESSO`);
      results.push({ llm, file, status: 'PASS' });
    } catch (error) {
      console.log(`=> FALHA`);
      results.push({ llm, file, status: 'FAIL' });
    } finally {
      if (fs.existsSync(backupFilePath)) {
        fs.copyFileSync(backupFilePath, originalFilePath);
        fs.unlinkSync(backupFilePath);
      }
    }
  }
}

const resultsPath = path.join(baseDir, 'Resultados_Testes.csv');
let csvContent = "LLM,Arquivo,Status\n";
results.forEach(r => csvContent += `${r.llm},${r.file},${r.status}\n`);
fs.writeFileSync(resultsPath, csvContent);
console.log(`\nFinalizado! Resultados em ${resultsPath}`);
