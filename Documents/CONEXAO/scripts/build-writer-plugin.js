const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const sourceDir = path.join(__dirname, '../conex-ai-writer');
const outPath = path.join(__dirname, '../public/conex-ai-writer.zip');

console.log('📦 Empacotando Plugin Conex AI Writer...');

const output = fs.createWriteStream(outPath);
const archive = archiver('zip', {
    zlib: { level: 9 } // Melhor compressão
});

output.on('close', function() {
    console.log(`✅ Plugin gerado com sucesso em: ./public/conex-ai-writer.zip`);
    console.log(`Tamanho total: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('error', function(err) {
    throw err;
});

archive.pipe(output);

// Adiciona os arquivos principais
archive.directory(sourceDir, 'conex-ai-writer');
archive.finalize();
