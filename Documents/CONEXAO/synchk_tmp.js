const ts = require('typescript');
const fs = require('fs');
const files = process.argv.slice(2);
let hasError = false;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const result = ts.transpileModule(src, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
    fileName: f,
  });
  const diags = result.diagnostics || [];
  if (diags.length) {
    hasError = true;
    console.log('=== ' + f + ' ===');
    for (const d of diags) {
      const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
      if (d.file && d.start !== undefined) {
        const pos = d.file.getLineAndCharacterOfPosition(d.start);
        console.log(`  Line ${pos.line + 1}:${pos.character + 1} - ${msg}`);
      } else {
        console.log('  ' + msg);
      }
    }
  } else {
    console.log('OK: ' + f);
  }
}
process.exit(hasError ? 1 : 0);
