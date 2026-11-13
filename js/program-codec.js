// Human-readable program text <-> calculator token IDs.
// The Studio deliberately uses the calculator's own symbols so copied programs
// remain useful outside this page and can be pasted back without a private format.

import { K, TOK, tok, bytesOf } from './tokens.js';

const DEGREE_UNIT = '\u1D52';

const ASCII_ALIASES = [
  ['whileend', 'pWhileEnd'], ['whlend', 'pWhileEnd'],
  ['clrmemory', 'pClrMemory'], ['clrmem', 'pClrMemory'], ['clrstat', 'pClrStat'],
  ['freqoff', 'pFreqOff'], ['freqon', 'pFreqOn'], ['ifend', 'pIfEnd'],
  ['npr', 'nPr'], ['ncr', 'nCr'],
  ['sinh^-1(', 'asinh'], ['cosh^-1(', 'acosh'], ['tanh^-1(', 'atanh'],
  ['sin^-1(', 'asin'], ['cos^-1(', 'acos'], ['tan^-1(', 'atan'],
  ['sqrt(', 'sqrt'], ['cbrt(', 'cbrt'], ['pi', 'pi'],
  ['->', 'pAsg'], ['=>', 'pJump'], ['\u0233', 'ybar'],
  // ° is the sexagesimal key; the DRG▶ degree unit shares its glyph, so the
  // Studio writes that one as a modifier o to keep the two apart.
  ['°', 'dms'], [DEGREE_UNIT, 'degU']
];

const AMBIGUOUS_IDS = new Set([
  'neg', 'sub', 'mul', 'div', 'pow', 'EXP',
  'hexA', 'hexB', 'hexC', 'hexD', 'hexE', 'hexF',
  'varA', 'varB', 'varC', 'varD', 'varX', 'varY', 'varM',
  'regA', 'regB', 'regC', 'regR', 'Sn', 'dms', 'degU'
]);

function buildAliases() {
  const out = ASCII_ALIASES.map(([label, id]) => ({ label, id }));
  for (const [id, spec] of Object.entries(TOK)) {
    // Scientific constants share letters with variables (h, F, R…), so the
    // Studio writes each one in brackets: [h], [mp], [μ0].
    if (spec.sci) out.push({ label: `[${spec.s}]`, id, exact: true });
    const label = spec.s.trim();
    if (AMBIGUOUS_IDS.has(id) || label.length < 2) continue;
    out.push({ label, id });
  }
  const seen = new Set();
  return out
    .sort((a, b) => b.label.length - a.label.length)
    .filter(({ label, exact }) => {
      // μN and μn are different constants, so bracketed names keep their case.
      const key = exact ? label : label.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

// Scientific constants are registered after this module loads, so the word
// list is rebuilt whenever the token table has grown.
let wordCache = null;
let wordCacheSize = -1;
function words() {
  const size = Object.keys(TOK).length;
  if (size !== wordCacheSize) {
    wordCache = buildAliases();
    wordCacheSize = size;
  }
  return wordCache;
}
// Word commands such as Ans or Goto must not run into a following letter.
const isWordEnd = (text) => /[A-Za-z]$/.test(text) && text.length > 1;
const startsWordChar = (text) => /^[A-Za-z0-9]/.test(text);

function singleToken(ch, mode, previous) {
  if (ch >= '0' && ch <= '9') return ch;
  if (ch === '.') return '.';
  if (ch === '+') return 'add';
  if (ch === '×' || ch === '*') return 'mul';
  if (ch === '÷' || ch === '/') return 'div';
  if (ch === '^') return 'pow';
  if (ch === '(' || ch === ')' || ch === ',' || ch === ';' || ch === ':') return ch;
  if (ch === '→') return 'pAsg';
  if (ch === '⇒') return 'pJump';
  if (ch === '?' || ch === '◢') return ch === '?' ? 'pIn' : 'pOut';
  if (ch === 'π') return 'pi';
  if (ch === '⌐') return 'frac';
  if (ch === '²') return 'sqr';
  if (ch === '³') return 'cube';
  if (ch === '%') return 'pct';
  if (ch === '=') return 'eq';
  if (ch === '≠') return 'ne';
  if (ch === '>') return 'gt';
  if (ch === '<') return 'lt';
  if (ch === '≥') return 'ge';
  if (ch === '≤') return 'le';
  if (ch === 'E') return mode === 'BASE' ? 'hexE' : 'EXP';

  if ('ABCDXYM'.includes(ch)) {
    if (mode === 'BASE' && 'ABCDEF'.includes(ch)) return 'hex' + ch;
    return 'var' + ch;
  }
  if (mode === 'BASE' && 'F'.includes(ch)) return 'hexF';
  if (mode === 'REG' && 'abcr'.includes(ch)) return 'reg' + ch.toUpperCase();
  if ((mode === 'SD' || mode === 'REG') && ch === 'n') return 'Sn';
  if (mode === 'BASE' && 'dhbo'.includes(ch)) return 'base' + ch.toUpperCase();
  if (ch === 'e') return 'napier';
  if (ch === 'i') return 'imag';

  if (ch === '-') {
    const unary = !previous || [K.OPEN, K.FN, K.SEP, K.INFIX, K.POW, K.PRE, K.PROG].includes(previous.k);
    return unary ? 'neg' : 'sub';
  }

  const exact = Object.entries(TOK).find(([id, spec]) =>
    !AMBIGUOUS_IDS.has(id) && spec.s === ch);
  return exact?.[0] || null;
}

/** Parse a copyable Program Studio string into calculator tokens. */
export function parseProgramText(source, mode = 'COMP') {
  const text = String(source || '').replace(/\r\n?/g, '\n');
  const tokenIds = [];
  const errors = [];
  const wordList = words();
  let i = 0;

  // ◢ already ends a statement, so a separator straight after it (or after
  // another separator) would only waste a byte of program memory.
  const push = (id) => {
    if (id === ':' && [':', 'pOut'].includes(tokenIds[tokenIds.length - 1])) return;
    tokenIds.push(id);
  };

  while (i < text.length) {
    const ch = text[i];
    if (ch === '\n') { if (tokenIds.length) push(':'); i++; continue; }
    if (/\s/u.test(ch)) { i++; continue; }

    let matched = false;
    for (const entry of wordList) {
      const candidate = text.slice(i, i + entry.label.length);
      if (entry.exact ? candidate !== entry.label
        : candidate.toLocaleLowerCase() !== entry.label.toLocaleLowerCase()) continue;
      const last = entry.label[entry.label.length - 1];
      const next = text[i + entry.label.length] || '';
      // A lowercase letter would continue the word ("Ansx"); a variable or digit
      // starts a new token, so "AnsA" and "5nCr2" read as typed on the keys.
      if (/[A-Za-z]/.test(last) && /[a-z]/.test(next)) continue;
      // M+ and M- only ever end a statement; elsewhere "M-Y" is M minus Y.
      if ((entry.id === 'pMplus' || entry.id === 'pMminus')
        && !/^[ \t]*(?:$|[\n:◢])/.test(text.slice(i + entry.label.length))) continue;
      push(entry.id);
      i += entry.label.length;
      matched = true;
      break;
    }
    if (matched) continue;

    const previous = tokenIds.length ? tok(tokenIds[tokenIds.length - 1]) : null;
    const id = singleToken(ch, mode, previous);
    if (id) {
      push(id);
      i += ch === '^' && text[i + 1] === '(' ? 2 : 1;
      continue;
    }

    errors.push({ index: i, character: ch });
    i++;
  }

  if (tokenIds[tokenIds.length - 1] === ':') tokenIds.pop();
  let tokens = [];
  try { tokens = tokenIds.map(tok); }
  catch (error) { errors.push({ index: -1, character: '', message: error.message }); }
  return { tokenIds, tokens, bytes: bytesOf(tokens), errors };
}

function tokenText(token) {
  if (token.id === ':') return '\n';
  if (token.id === 'pOut') return '◢\n';
  if (token.id === 'degU') return DEGREE_UNIT;
  if (token.id === 'nCr' || token.id === 'nPr') return token.id;
  if (token.sci) return `[${token.s}]`;
  return token.s;
}

// A space is needed where two symbols would otherwise read as one longer word,
// e.g. Ans followed by A, or x̂ followed by 1 (which would read as x̂1).
function needsSpace(before, after) {
  if (!before || !after || /\s$/.test(before) || /^\s/.test(after)) return false;
  if (isWordEnd(before) && startsWordChar(after)) return true;
  const joined = (before + after).toLocaleLowerCase();
  const head = before.toLocaleLowerCase();
  return words().some(({ label }) => label.length > head.length
    && joined.startsWith(label.toLocaleLowerCase()));
}

/** One calculator statement per line, with native symbols retained. */
export function formatProgramText(tokens) {
  let text = '';
  let previous = '';
  for (const token of tokens || []) {
    const next = tokenText(token);
    if (needsSpace(previous, next)) text += ' ';
    text += next;
    previous = next;
  }
  return text
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{2,}/g, '\n')
    .trimEnd();
}
