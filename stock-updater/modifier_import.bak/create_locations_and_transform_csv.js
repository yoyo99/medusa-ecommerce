#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/sync');

const INPUT = 'mbwood_complete.csv';
const OUTPUT = 'mapping.json';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { defaultId: process.env.DEFAULT_ID || '', empty: false, dry: false };
  for (const a of args) {
    if (a.startsWith('--default=')) out.defaultId = a.split('=')[1];
    if (a === '--empty') out.empty = true;
    if (a === '--dry-run' || a === '--dry') out.dry = true;
  }
  if (out.empty) out.defaultId = '';
  return out;
}

function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return parse.parse(raw, { columns: true, skip_empty_lines: true });
}

(function main(){
  try {
    const args = parseArgs();
    const csvPath = path.resolve(INPUT);
    if (!fs.existsSync(csvPath)) {
      console.error(`Fichier introuvable : ${csvPath}`);
      process.exit(2);
    }
    console.log(`Lecture de ${INPUT} ...`);
    const records = readCsv(csvPath);
    if (!records.length) {
      console.error('Aucune ligne trouvée dans le CSV.');
      process.exit(3);
    }
    const headers = Object.keys(records[0]);
    // trouver la colonne Product Tag 2 (tolérance)
    const tagHeader = headers.find(h => /product.*tag.*2/i.test(h)) || headers.find(h => /tag.*2/i.test(h));
    if (!tagHeader) {
      console.error('Impossible de trouver la colonne "Product Tag 2". En-têtes détectées:');
      console.error(headers.join(', '));
      process.exit(4);
    }
    const codesSet = new Set();
    for (const r of records) {
      const raw = r[tagHeader];
      if (!raw) continue;
      const code = raw.toString().trim();
      if (code) codesSet.add(code);
    }
    const codes = Array.from(codesSet).sort((a,b)=>a.localeCompare(b,'fr'));
    console.log(`Codes uniques trouvés (${codes.length}).`);
    const mapping = {};
    const defaultVal = args.defaultId || '';
    for (const c of codes) mapping[c] = defaultVal;
    if (args.dry) {
      console.log('Dry-run: pas d\'écriture.');
      process.exit(0);
    }
    fs.writeFileSync(path.resolve(OUTPUT), JSON.stringify(mapping, null, 2), 'utf8');
    console.log(`mapping.json écrit (${Object.keys(mapping).length} entrées).`);
  } catch (err) {
    console.error('Erreur:', err.message || err);
    process.exit(1);
  }
})();
