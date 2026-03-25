const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const sourceDir = path.join(__dirname, '../conexbot-wp');
const outPath = path.join(__dirname, '../public/conexbot-wp.zip');

console.log('📦 Empacotando Plugin do WordPress...');

const output = fs.createWriteStream(outPath);
const archive = archiver('zip', {
    zlib: { level: 9 } // Melhor compressão
});

output.on('close', function() {
    console.log(`✅ Plugin gerado com sucesso em: ./public/conexbot-wp.zip`);
    console.log(`Tamanho total: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('error', function(err) {
    throw err;
});

archive.pipe(output);

// Adiciona os arquivos principais ignorando nodes_modules (se houver no futuro)
archive.directory(sourceDir, 'conexbot-wp');
archive.finalize();
