import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const testsDir = path.join(root, 'tests');
const manifestPath = path.join(testsDir, 'current-tests.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const wanted = manifest.files || [];
const missing = wanted.filter(name => !fs.existsSync(path.join(testsDir, name)));
if (missing.length) {
  console.error(`Current-test manifest is missing ${missing.length} required file(s):`);
  for (const name of missing) console.error(`  - ${name}`);
  process.exit(1);
}
const present = fs.readdirSync(testsDir).filter(name => name.endsWith('.test.mjs'));
const wantedSet = new Set(wanted);
const ignored = present.filter(name => !wantedSet.has(name)).sort();
console.log(`Battle Axe test manifest ${manifest.release}: ${wanted.length} test files.`);
if (ignored.length) {
  console.warn(`Ignoring ${ignored.length} non-current test file(s) retained in the repository:`);
  for (const name of ignored) console.warn(`  - ${name}`);
}
const args = ['--test', ...wanted.map(name => path.join('tests', name))];
const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
process.exit(result.status ?? 1);
