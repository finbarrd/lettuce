import { readFileSync, writeFileSync } from 'fs';
import { WORDS } from '../src/game/wordlist.js';

const dict = JSON.parse(readFileSync('scripts/webster.json', 'utf8'));

// Build a case-insensitive lookup
const lookup = {};
for (const [k, v] of Object.entries(dict)) {
  lookup[k.toLowerCase()] = v;
}

const definitions = {};
let count = 0;

for (const word of WORDS) {
  const key = word.toLowerCase();
  let def = lookup[key];
  if (!def) continue;

  // Clean up: normalize whitespace
  def = def.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

  // Take first sentence(s) up to ~150 chars
  const sentences = def.split(/(?<=[.!?])\s+/);
  let result = '';
  for (const s of sentences) {
    if (result.length === 0) {
      result = s;
    } else if (result.length + s.length < 150) {
      result += ' ' + s;
    } else {
      break;
    }
  }

  // Skip if too short or just a cross-reference
  if (result.length < 10) continue;
  if (result.length > 200) result = result.substring(0, 197) + '...';

  definitions[key] = result;
  count++;
}

console.log('Definitions extracted:', count);
console.log('Coverage:', Math.round(count / WORDS.length * 100) + '% of game wordlist');

// Write the bundle
const lines = [
  '// Auto-generated definitions bundle - do not edit manually',
  '// Source: Webster Unabridged Dictionary (1913, public domain)',
  '// Words with definitions: ' + count,
  '',
  'export const DEFINITIONS = ' + JSON.stringify(definitions) + ';',
  ''
];

const output = lines.join('\n');
writeFileSync('src/game/definitions-bundle.js', output);
const sizeKB = Math.round(output.length / 1024);
console.log('Bundle size:', sizeKB, 'KB');
