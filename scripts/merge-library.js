// Merge data/library-v2.js into data/library.json and the LIB block in public/app.html. Idempotent (replaces chapters by code).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const L = JSON.parse(fs.readFileSync(path.join(root, 'data/library.json'), 'utf8'));
const V2 = require('../data/library-v2.js');
let added = 0, sets = 0;
for (const lang of Object.keys(V2)) {
  L[lang] = L[lang] || [];
  for (const ch of V2[lang]) {
    ch.sets = ch.sets.map((s, i) => ({ ...s, c: `${ch.code}-${String(i + 1).padStart(2, '0')}` }));
    const i = L[lang].findIndex(c => c.code === ch.code);
    if (i >= 0) L[lang][i] = ch; else { L[lang].push(ch); added++; }
    sets += ch.sets.length;
  }
}
fs.writeFileSync(path.join(root, 'data/library.json'), JSON.stringify(L));
const p = path.join(root, 'public/app.html'); let h = fs.readFileSync(p, 'utf8');
h = h.replace(/<script id="LIB" type="application\/json">[\s\S]*?<\/script>/, '<script id="LIB" type="application/json">' + JSON.stringify(L).replace(/<\/script/g, '<\\/script') + '</script>');
fs.writeFileSync(p, h);
const total = Object.values(L).reduce((n, arr) => n + arr.reduce((m, c) => m + c.sets.length, 0), 0);
console.log(`merged ${added} new chapters, ${sets} v2 sets; library now ${Object.values(L).reduce((n, a) => n + a.length, 0)} chapters, ${total} sets`);
