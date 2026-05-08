import { readFileSync, writeFileSync } from 'fs';
import { WORDS } from '../src/game/wordlist.js';

const dict = JSON.parse(readFileSync('scripts/webster.json', 'utf8'));

// Common short English words for splitting stuck-together words
const commonWords = new Set([
  'a','an','the','of','to','in','on','at','by','or','is','as','it','be','do','no','so','up','we',
  'he','if','my','and','for','but','not','you','all','can','had','her','was','one','our','out','are',
  'has','his','how','its','may','new','now','old','see','way','who','any','did','get','has','him',
  'let','put','say','she','too','use','own','per','than','that','them','then','they','this','what',
  'when','will','with','been','from','into','most','much','some','very','were','your','also','each',
  'more','over','such','many','well','only','just','like','make','made','down','back','base','upon',
  'them','here','long','time','part','work','under','after','being','about','above','below','other',
  'their','which','would','could','there','where','great','every','small','large','often','first',
  'worn','called','having','through','between','before','place','state','cause','same','used','form',
  'kind','body','head','hand','side','line','word','name','home','give','take','come','know','good',
  'year','keep','last','next','high','look','turn','move','live','case','care','act','off','set',
  'run','end','does','found','give','left','while','along','might','still','thing','point','help',
  'went','number','world','right','house','near','full','open','free','even','went','seen','less',
  'went','done','bore','born','ring','late','hard','soft','dark','away','gave','half','once','both',
  'mean','ever','grow','feet','land','play','need','read','held','went','best','gave','went','rest',
  'gone','known','taken','given','brought','thought','without','another','general','special',
  'scores','alternate','toward','against','within','during','common','little','certain',
  'skirt','knee','fruit','cloth','cover','water','wind','fire','iron','wood','stone',
]);

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

  // Clean up: fix words stuck together from stripped newlines
  // Insert space before a lowercase letter followed by an uppercase letter
  def = def.replace(/([a-z])([A-Z])/g, '$1 $2');
  // Fix stuck punctuation followed by letter: ".And" -> ". And"
  def = def.replace(/([.;,!?])([A-Za-z])/g, '$1 $2');
  // Fix common stuck-together word patterns from stripped newlines
  // Match sequences of 5+ lowercase letters and try to split them
  def = def.replace(/[a-z]{5,}/g, (match) => {
    // Try to split at positions where two common words meet
    // Prefer splitting into longer left parts first
    for (let i = match.length - 2; i >= 2; i--) {
      const left = match.substring(0, i);
      const right = match.substring(i);
      if (commonWords.has(left) && commonWords.has(right)) {
        return left + ' ' + right;
      }
    }
    return match;
  });
  // Normalize whitespace
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
