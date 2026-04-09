const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const sourceDir = path.join(__dirname, '../conext-writer');
const outPath = path.join(__dirname, '../public/conext-writer.zip');

console.log('📦 Empacotando Plugin Conext Writer...');

const output = fs.createWriteStream(outPath);
const archive = archiver('zip', {
    zlib: { level: 9 } // Melhor compressão
});

output.on('close', function() {
    console.log(`✅ Plugin gerado com sucesso em: ./public/conext-writer.zip`);
    console.log(`Tamanho total: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('error', function(err) {
    throw err;
});

archive.pipe(output);

// Adiciona os arquivos principais, excluindo arquivos sensíveis ou de desenvolvimento
archive.glob('**/*', {
    cwd: sourceDir,
    ignore: [
        'activate_keys.php',
        'check_keys.php',
        '*.zip',
        '.git/**',
        '.github/**',
        '.vscode/**',
        '.DS_Store'
    ]
}, { prefix: 'conext-writer' });

archive.finalize();
