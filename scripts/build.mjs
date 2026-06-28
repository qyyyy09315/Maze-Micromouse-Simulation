/**
 * Cross-platform build script (replaces Unix-only rm/cp/touch commands).
 */
import { execSync } from 'child_process';
import { rmSync, cpSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');

// 1. Clean dist
if (existsSync(dist)) {
  rmSync(dist, { recursive: true, force: true });
}

// 2. Build with Vite
console.log('Building with Vite...');
execSync('npx vite build --outDir dist/static', { stdio: 'inherit', cwd: root });

// 3. Copy package.json to dist
cpSync(
  resolve(root, 'package.json'),
  resolve(dist, 'package.json'),
);

// 4. Create build flag
writeFileSync(resolve(dist, 'build.flag'), new Date().toISOString());

console.log('Build complete!');
