const fs = require('fs');
const path = require('path');

// Charger les variables du fichier .env s'il existe
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log('Chargement du fichier .env...');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const firstEqual = trimmedLine.indexOf('=');
      if (firstEqual !== -1) {
        const key = trimmedLine.substring(0, firstEqual).trim();
        const val = trimmedLine.substring(firstEqual + 1).trim();
        process.env[key] = val;
      }
    }
  });
}

const srcDir = path.join(__dirname, '..');
const distDir = path.join(__dirname, '..', 'dist');

// Variables à injecter
const envVars = {
  '__FIREBASE_API_KEY__': process.env.FIREBASE_API_KEY,
  '__FIREBASE_AUTH_DOMAIN__': process.env.FIREBASE_AUTH_DOMAIN,
  '__FIREBASE_PROJECT_ID__': process.env.FIREBASE_PROJECT_ID,
  '__FIREBASE_STORAGE_BUCKET__': process.env.FIREBASE_STORAGE_BUCKET,
  '__FIREBASE_MESSAGING_SENDER_ID__': process.env.FIREBASE_MESSAGING_SENDER_ID,
  '__FIREBASE_APP_ID__': process.env.FIREBASE_APP_ID,
  '__FIREBASE_MEASUREMENT_ID__': process.env.FIREBASE_MEASUREMENT_ID,
  '__ADMIN_PASSWORD__': process.env.ADMIN_PASSWORD
};

// Dossiers et fichiers à exclure de la copie vers dist
const exclude = ['node_modules', '.git', 'dist', 'scripts', 'package.json', 'package-lock.json', 'implementation_plan.md', 'task.md'];

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach(childItemName => {
      if (!exclude.includes(childItemName)) {
        copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
      }
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function replaceInFiles(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      replaceInFiles(filePath);
    } else if (filePath.endsWith('.js') || filePath.endsWith('.html')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      Object.keys(envVars).forEach(key => {
        const val = envVars[key];
        if (content.includes(key)) {
          if (val) {
            console.log(`Replacing ${key} in ${filePath}`);
            // Use split/join for simple replacement of all occurrences
            content = content.split(key).join(val);
            modified = true;
          } else {
            console.warn(`Warning: Environment variable for ${key} is not set.`);
          }
        }
      });

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  });
}

// Main execution
console.log('--- Starting Build Process ---');

// Clean dist folder
if (fs.existsSync(distDir)) {
  console.log('Cleaning existing dist folder...');
  fs.rmSync(distDir, { recursive: true, force: true });
}

console.log('Copying files to dist...');
copyRecursiveSync(srcDir, distDir);

console.log('Injecting environment variables...');
replaceInFiles(distDir);

console.log('--- Build Complete! ---');
