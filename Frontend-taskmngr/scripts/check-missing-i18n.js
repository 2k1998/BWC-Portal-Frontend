// node scripts/check-missing-i18n.js
import fs from 'fs';

const src = fs.readFileSync('src/translations/index.js', 'utf-8');

// naive key extraction (works with your file style)
const pickBlock = (label) => {
  const start = src.indexOf(`${label}:`);
  if (start < 0) return '';
  let i = src.indexOf('{', start), depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') {
      depth--;
      if (depth === 0) return src.slice(i + 1, j);
    }
  }
  return '';
};

const parseKeys = (block) => {
  const keys = new Set();
  for (const line of block.split('\n')) {
    const m = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
    if (m) keys.add(m[1]);
  }
  return keys;
};

const enBlock = pickBlock('en');
const elBlock = pickBlock('el');

const en = parseKeys(enBlock);
const el = parseKeys(elBlock);

const missingInEl = [...en].filter(k => !el.has(k));
const missingInEn = [...el].filter(k => !en.has(k));

console.log('Missing in el:', missingInEl.length);
console.log(missingInEl.sort().join('\n'));
console.log('\nMissing in en:', missingInEn.length);
console.log(missingInEn.sort().join('\n'));
