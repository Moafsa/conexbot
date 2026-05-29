const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const pluginFilePath = path.join(__dirname, '../ts-ml-integration/ts-ml-integration.php');
const pluginDir = path.join(__dirname, '../ts-ml-integration');
const destinationZip = path.join(__dirname, '../public/ts-ml-integration.zip');

if (!fs.existsSync(pluginFilePath)) {
    console.error('Plugin file not found!');
    process.exit(1);
}

// 1. Read current version
let content = fs.readFileSync(pluginFilePath, 'utf8');
const versionMatch = content.match(/Version:\s*([0-9.]+)/i);
if (!versionMatch) {
    console.error('Version header not found in plugin file!');
    process.exit(1);
}

const currentVersion = versionMatch[1];
const versionParts = currentVersion.split('.').map(Number);
// Increment patch version
versionParts[2] = (versionParts[2] || 0) + 1;
const newVersion = versionParts.join('.');

console.log(`Incrementing version: ${currentVersion} -> ${newVersion}`);

// 2. Replace version headers in main plugin file
content = content.replace(/(Version:\s*)([0-9.]+)/i, `$1${newVersion}`);
content = content.replace(/(define\('TS_ML_VERSION',\s*')([0-9.]+)('\))/i, `$1${newVersion}$3`);
fs.writeFileSync(pluginFilePath, content, 'utf8');

// 3. Compress using 'archiver' for 100% Linux/Docker cross-platform compatibility!
console.log('Zipping plugin directory using archiver...');
const output = fs.createWriteStream(destinationZip);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', function() {
    console.log(`Success! Plugin updated and zipped to public/ts-ml-integration.zip (v${newVersion})`);
    console.log(`Total size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('error', function(err) {
    throw err;
});

archive.pipe(output);
archive.directory(pluginDir, 'ts-ml-integration');
archive.finalize();
