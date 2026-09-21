import fs from 'fs';
const DENY = JSON.parse(fs.readFileSync('data/denylist.json'));
const V2 = (await import('../data/library-v2.js')).default;
const norm = s => String(s||'').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ').trim();
const hit = (phrase, term) => new RegExp('(^|[^a-z0-9])' + term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + 's?([^a-z0-9]|$)').test(phrase);
let n=0, flagged=[];
for (const lang of Object.keys(V2)) for (const c of V2[lang]) for (const s of c.sets) {
  const marks=(s.n||s.sp.flat()).map(x=>x.split('|')[0]); const phrase=norm(marks.join(' ')+' '+s.a); n++;
  for (const cat of Object.keys(DENY)) { if (cat[0]==='_'||cat==='allow') continue; for (const term of DENY[cat]) if (hit(phrase,term)) flagged.push(`${s.c||c.code} "${s.a}" → ${cat}:${term}`); }
  for (const m of marks) if ([...m].length>7 && !/\p{Extended_Pictographic}/u.test(m)) flagged.push(`${c.code} "${s.a}" mark too long: ${m}`);
  const h=(s.n||s.sp[0]); if(h.length!==5) flagged.push(`${c.code} "${s.a}" not five nails`);
}
console.log('screened', n, 'sets;', flagged.length, 'flags'); flagged.forEach(f=>console.log(' ', f));
