import { access, readFile } from 'node:fs/promises';
const required=['index.html','src/main.js','src/data/paviaProject.js','src/styles/app.css','public/projects/pavia/battlefield.svg','public/sw.js','.github/workflows/pages.yml'];
for (const file of required) { await access(new URL(`../${file}`, import.meta.url)); }
const project = await readFile(new URL('../src/data/paviaProject.js', import.meta.url),'utf8');
for (const token of ['Vernavola','Masonry wall','Porta Pescarina','Corso avenue','candidates']) if (!project.includes(token)) throw new Error(`Project check failed: missing ${token}`);
console.log(`Repository check passed: ${required.length} required files and Pavia feature data present.`);
