const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const index = trimmed.indexOf('=');
      if (index === -1) return;
      const key = trimmed.substring(0, index).trim();
      let value = trimmed.substring(index + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    });
    console.log('Loaded env variables from .env');
  } else {
    console.log('.env file not found');
  }

  const cmd = process.argv.slice(2).join(' ') || 'npx prisma db push';
  console.log(`Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
} catch (e) {
  console.error('Error running command:', e.message);
  process.exit(1);
}
