const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const watchDir = path.join(__dirname, '../ts-ml-integration');
const buildScript = path.join(__dirname, 'build-plugin.js');

console.log(`👀 Monitorando alterações na pasta: ${watchDir}`);
console.log('Toda vez que você salvar um arquivo, o plugin será re-buildado e zipado automaticamente.');

let timeout = null;
fs.watch(watchDir, { recursive: true }, (eventType, filename) => {
    // Evitar buildar se a alteração for no próprio zip temporário ou arquivos não relacionados
    if (filename && (filename.endsWith('.php') || filename.endsWith('.css') || filename.endsWith('.js'))) {
        // Debounce para evitar múltiplos disparos no mesmo salvamento
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            console.log(`\n⚡ Alteração detectada no arquivo: ${filename}`);
            try {
                execSync(`node "${buildScript}"`, { stdio: 'inherit' });
            } catch (err) {
                console.error('Erro no build automático:', err.message);
            }
        }, 150);
    }
});
