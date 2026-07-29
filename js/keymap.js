// keymap.js — physical key geometry and per-key function assignments.
//
// Coordinates are in the native pixel space of the generated faceplate
// (881 x 1785), measured directly from its key caps. The chroma-key removal
// preserves every opaque RGB pixel, so this map follows the unmodified artwork.
//
// Each key carries the functions printed on/around it:
//   base        white legend on the key cap
//   shift       amber legend above the key            (SHIFT + key)
//   alpha       red legend above the key              (ALPHA + key)
//   basen       green legend above the key            (direct press, BASE mode)
//   cmplx       amber legend in a purple frame        (SHIFT + key, CMPLX mode)
//   stat        blue legend                           (direct press, SD/REG)
//   statShift   amber legend in a blue frame          (SHIFT + key, SD/REG)

export const SHELL_W = 881;
export const SHELL_H = 1785;
export const LCD_RECT = { x: 145, y: 288, w: 588, h: 245 };

// Column/row rulers measured from the generated key blobs.
const C6 = [131, 236, 341, 446, 550, 655];  // six-across function rows
const W6 = 94, H6 = 64;
const C5 = [132, 258, 384, 511, 637];       // five-across numeric block
const W5 = 112, H5 = 88;
const R = { fn1: 863, fn2: 951, fn3: 1052, n1: 1148, n2: 1263, n3: 1372, n4: 1491 };

function k(id, x, y, w, h, spec) {
  return Object.assign({ id, x, y, w, h }, spec);
}
function row6(y, defs) {
  return defs.map((d, i) => k(d.id, C6[i], y, W6, H6, d));
}
function row5(y, defs) {
  return defs.map((d, i) => k(d.id, C5[i], y, W5, H5, d));
}

export const KEYS = [
  // ---- top row: modifiers, cursor pad, mode, power -------------------------
  k('SHIFT', 126, 641, 92, 73, { base: 'SHIFT', kind: 'mod' }),
  k('ALPHA', 232, 648, 90, 73, { base: 'ALPHA', kind: 'mod' }),
  k('UP', 376, 629, 136, 64, { base: '▲', kind: 'cursor', pad: true }),
  k('LEFT', 342, 684, 68, 64, { base: '◀', kind: 'cursor', pad: true }),
  k('RIGHT', 478, 684, 68, 64, { base: '▶', kind: 'cursor', pad: true }),
  k('DOWN', 376, 739, 136, 64, { base: '▼', kind: 'cursor', pad: true }),
  k('MODE', 555, 645, 92, 72, { base: 'MODE', shift: 'SETUP' }),
  k('ON', 660, 630, 92, 72, { base: 'ON' }),

  // ---- program / formula row ----------------------------------------------
  k('PROG', 124, 769, 94, 62, { base: 'Prog', shift: 'EXIT', orange: true }),
  k('FMLA', 230, 769, 94, 62, { base: 'FMLA', shift: 'LOOK', orange: true }),
  k('RECIP', 557, 768, 96, 62, { base: 'x⁻¹', shift: 'x!', basen: 'LOGIC' }),
  k('CUBE', 662, 768, 96, 62, { base: 'x³', shift: '∛(' }),

  // ---- function rows -------------------------------------------------------
  ...row6(R.fn1, [
    { id: 'ABC', base: 'a b/c', shift: 'd/c' },
    { id: 'SQRT', base: '√(' },
    { id: 'SQR', base: 'x²', basen: 'DEC' },
    { id: 'POW', base: '^(', shift: 'ˣ√(', basen: 'HEX' },
    { id: 'LOG', base: 'log(', shift: '10^(', basen: 'BIN' },
    { id: 'LN', base: 'ln(', shift: 'e^(', alpha: 'e', basen: 'OCT' }
  ]),
  ...row6(R.fn2, [
    { id: 'NEG', base: '(-)', shift: '∠', alpha: 'A', hex: 'A' },
    { id: 'DMS', base: '°′″', shift: '◀', alpha: 'B', hex: 'B' },
    { id: 'HYP', base: 'hyp', alpha: 'C', hex: 'C' },
    { id: 'SIN', base: 'sin(', shift: 'sin⁻¹(', alpha: 'D', hex: 'D' },
    { id: 'COS', base: 'cos(', shift: 'cos⁻¹(', hex: 'E' },
    { id: 'TAN', base: 'tan(', shift: 'tan⁻¹(', hex: 'F' }
  ]),
  ...row6(R.fn3, [
    { id: 'RCL', base: 'RCL', shift: 'STO' },
    { id: 'ENG', base: 'ENG', shift: '◀ENG', alpha: 'i' },
    { id: 'LPAR', base: '(', shift: '%', cmplx: 'arg(' },
    { id: 'RPAR', base: ')', shift: 'Abs(', alpha: 'X' },
    { id: 'COMMA', base: ',', shift: ':', alpha: 'Y', cmplx: 'Conjg(' },
    { id: 'MPLUS', base: 'M+', shift: 'M-', alpha: 'M', stat: 'DT', statShift: 'CL' }
  ]),

  // ---- numeric block -------------------------------------------------------
  ...row5(R.n1, [
    { id: 'N7', base: '7', shift: 'CONST' },
    { id: 'N8', base: '8' },
    { id: 'N9', base: '9', shift: 'CLR' },
    { id: 'DEL', base: 'DEL', shift: 'INS' },
    { id: 'AC', base: 'AC', shift: 'OFF' }
  ]),
  ...row5(R.n2, [
    { id: 'N4', base: '4' },
    { id: 'N5', base: '5' },
    { id: 'N6', base: '6' },
    { id: 'MUL', base: '×', shift: 'nPr' },
    { id: 'DIV', base: '÷', shift: 'nCr' }
  ]),
  ...row5(R.n3, [
    { id: 'N1', base: '1', statShift: 'S-SUM' },
    { id: 'N2', base: '2', statShift: 'S-VAR' },
    { id: 'N3', base: '3', shift: 'P-CMD' },
    { id: 'ADD', base: '+', shift: 'Pol(', cmplx: '▶r∠θ' },
    { id: 'SUB', base: '-', shift: 'Rec(', cmplx: '▶a+bi' }
  ]),
  ...row5(R.n4, [
    { id: 'N0', base: '0', shift: 'Rnd(' },
    { id: 'DOT', base: '.', shift: 'Ran#' },
    { id: 'EXP', base: 'EXP', shift: 'π' },
    { id: 'ANS', base: 'Ans', shift: 'DRG▶' },
    { id: 'EXE', base: 'EXE', cmplx: 'Re⇔Im' }
  ])
];

export const KEY_BY_ID = Object.fromEntries(KEYS.map((key) => [key.id, key]));

// Physical-keyboard shortcuts. Values are key ids; a leading '!' means the
// SHIFT modifier is applied first, exactly as on the real machine.
export const PC_KEYS = {
  '0': 'N0', '1': 'N1', '2': 'N2', '3': 'N3', '4': 'N4',
  '5': 'N5', '6': 'N6', '7': 'N7', '8': 'N8', '9': 'N9',
  '.': 'DOT', '+': 'ADD', '-': 'SUB', '*': 'MUL', '/': 'DIV',
  '(': 'LPAR', ')': 'RPAR', ',': 'COMMA', '^': 'POW', '=': 'EXE',
  Enter: 'EXE', Backspace: 'DEL', Delete: 'DEL', Escape: 'AC',
  ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
  s: 'SIN', c: 'COS', t: 'TAN', l: 'LOG', n: 'LN', r: 'SQRT',
  x: 'SQR', p: '!EXP', e: 'EXP', m: 'MPLUS', a: 'ANS',
  ' ': 'SHIFT', Tab: 'ALPHA', F1: 'MODE', F2: 'PROG', F3: 'FMLA'
};
