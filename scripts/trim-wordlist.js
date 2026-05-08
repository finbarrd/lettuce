import { writeFileSync } from 'fs';
import { WORDS } from '../src/game/wordlist.js';
import { DEFINITIONS } from '../src/game/definitions-bundle.js';

const defSet = new Set(Object.keys(DEFINITIONS));
const kept = WORDS.filter(w => defSet.has(w.toLowerCase()));

// Build wordlist file
const chunks = [];
for (let i = 0; i < kept.length; i += 15) {
  const line = kept.slice(i, i + 15).map(w => "'" + w + "'").join(',');
  chunks.push('  ' + line);
}

const output = [
  '// Word list filtered to words with known definitions',
  '// Words: ' + kept.length,
  'export const WORDS = [',
  chunks.join(',\n') + ',',
  '];',
  ''
].join('\n');

writeFileSync('src/game/wordlist.js', output);
console.log('Wrote', kept.length, 'words to wordlist.js');
console.log('File size:', Math.round(output.length / 1024), 'KB');
