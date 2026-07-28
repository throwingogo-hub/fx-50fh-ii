// keymap.js — physical key geometry and per-key function assignments.
//
// Coordinates are in the pixel space of assets/fx-50fh-ii.png (846 x 1710),
// measured directly off the product photo by connected-component detection of
// the key caps, so every hotspot sits on the real key it names.
//
// Each key carries the functions printed on/around it:
//   base        white legend on the key cap
//   shift       amber legend above the key            (SHIFT + key)
//   alpha       red legend above the key              (ALPHA + key)
//   basen       green legend above the key            (direct press, BASE mode)
//   cmplx       amber legend in a purple frame        (SHIFT + key, CMPLX mode)
//   stat        blue legend                           (direct press, SD/REG)
//   statShift   amber legend in a blue frame          (SHIFT + key, SD/REG)

export const SHELL_W = 846;
export const SHELL_H = 1710;
export const LCD_RECT = { x: 106, y: 258, w: 634, h: 249 };

// Column/row rulers taken from the measured key blobs.
const C6 = [89, 204, 318, 432, 546, 661];   // six-across function rows
const W6 = 99, H6 = 63;
const C5 = [88, 226, 363, 501, 639];        // five-across numeric block
const W5 = 122, H5 = 86;
const R = { fn1: 856, fn2: 954, fn3: 1053, n1: 1155, n2: 1275, n3: 1394, n4: 1513 };

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
  k('SHIFT', 85, 612, 93, 76, { base: 'SHIFT', kind: 'mod' }),
  k('ALPHA', 201, 627, 92, 76, { base: 'ALPHA', kind: 'mod' }),
  k('UP', 356, 611, 135, 62, { base: '▲', kind: 'cursor', pad: true }),
  k('LEFT', 322, 673, 62, 62, { base: '◀', kind: 'cursor', pad: true }),
  k('RIGHT', 463, 673, 62, 62, { base: '▶', kind: 'cursor', pad: true }),
  k('DOWN', 356, 735, 135, 62, { base: '▼', kind: 'cursor', pad: true }),
  k('MODE', 553, 630, 94, 71, { base: 'MODE', shift: 'SETUP' }),
  k('ON', 670, 612, 91, 73, { base: 'ON' }),

  // ---- program / formula row ----------------------------------------------
  k('PROG', 81, 762, 95, 62, { base: 'Prog', shift: 'EXIT', orange: true }),
  k('FMLA', 195, 762, 96, 62, { base: 'FMLA', shift: 'LOOK', orange: true }),
  k('RECIP', 555, 759, 99, 62, { base: 'x⁻¹', shift: 'x!', basen: 'LOGIC' }),
  k('CUBE', 669, 759, 99, 62, { base: 'x³', shift: '∛(' }),

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
