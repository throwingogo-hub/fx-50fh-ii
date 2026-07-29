// tokens.js — the machine's input alphabet.
//
// Everything the user types is stored as a list of these tokens, exactly like
// the real calculator stores key operations rather than characters: one DEL
// removes one whole token, and the byte cost drives the 99-byte input limit
// and the 680-byte program store.

/** kind -> how the parser treats it */
export const K = {
  DIGIT: 'digit',   // 0-9 . and the hex letters
  CONST: 'const',   // pi, e, Ans, variables, scientific constants, i, Ran#
  OPEN: 'open',
  CLOSE: 'close',
  SEP: 'sep',       // , ; :
  FN: 'fn',         // parenthetical function, the '(' is part of the token
  POST: 'post',     // postfix operator, priority 2
  POW: 'pow',       // infix operator that opens a parenthesis
  INFIX: 'infix',
  PRE: 'pre',       // prefix symbol, priority 4
  FRAC: 'frac',     // fraction separator, priority 3
  EST: 'est',       // statistical estimated value, postfix, priority 5
  CONV: 'conv',     // display-format override appended to an expression
  PROG: 'prog'      // program command word
};

function t(s, k, extra) {
  return Object.assign({ s, k, b: s.length > 1 ? 2 : 1 }, extra);
}

export const TOK = {
  // ---- literals ----------------------------------------------------------
  '0': t('0', K.DIGIT), '1': t('1', K.DIGIT), '2': t('2', K.DIGIT),
  '3': t('3', K.DIGIT), '4': t('4', K.DIGIT), '5': t('5', K.DIGIT),
  '6': t('6', K.DIGIT), '7': t('7', K.DIGIT), '8': t('8', K.DIGIT),
  '9': t('9', K.DIGIT), '.': t('.', K.DIGIT), EXP: t('E', K.DIGIT),
  hexA: t('A', K.DIGIT, { hex: true }), hexB: t('B', K.DIGIT, { hex: true }),
  hexC: t('C', K.DIGIT, { hex: true }), hexD: t('D', K.DIGIT, { hex: true }),
  hexE: t('E', K.DIGIT, { hex: true }), hexF: t('F', K.DIGIT, { hex: true }),

  // ---- values ------------------------------------------------------------
  pi: t('π', K.CONST), napier: t('e', K.CONST), Ans: t('Ans', K.CONST),
  Ran: t('Ran#', K.CONST), imag: t('i', K.CONST),
  varA: t('A', K.CONST, { v: 'A' }), varB: t('B', K.CONST, { v: 'B' }),
  varC: t('C', K.CONST, { v: 'C' }), varD: t('D', K.CONST, { v: 'D' }),
  varX: t('X', K.CONST, { v: 'X' }), varY: t('Y', K.CONST, { v: 'Y' }),
  varM: t('M', K.CONST, { v: 'M' }),

  // ---- grouping ----------------------------------------------------------
  '(': t('(', K.OPEN), ')': t(')', K.CLOSE),
  ',': t(',', K.SEP), ';': t(';', K.SEP), ':': t(':', K.SEP),

  // ---- parenthetical functions (priority 1) -------------------------------
  sin: t('sin(', K.FN, { f: 'sin' }), cos: t('cos(', K.FN, { f: 'cos' }),
  tan: t('tan(', K.FN, { f: 'tan' }),
  asin: t('sin⁻¹(', K.FN, { f: 'asin' }), acos: t('cos⁻¹(', K.FN, { f: 'acos' }),
  atan: t('tan⁻¹(', K.FN, { f: 'atan' }),
  sinh: t('sinh(', K.FN, { f: 'sinh' }), cosh: t('cosh(', K.FN, { f: 'cosh' }),
  tanh: t('tanh(', K.FN, { f: 'tanh' }),
  asinh: t('sinh⁻¹(', K.FN, { f: 'asinh' }), acosh: t('cosh⁻¹(', K.FN, { f: 'acosh' }),
  atanh: t('tanh⁻¹(', K.FN, { f: 'atanh' }),
  log: t('log(', K.FN, { f: 'log', varargs: true }), ln: t('ln(', K.FN, { f: 'ln' }),
  exp10: t('10^(', K.FN, { f: 'exp10' }), expe: t('e^(', K.FN, { f: 'expe' }),
  sqrt: t('√(', K.FN, { f: 'sqrt' }), cbrt: t('∛(', K.FN, { f: 'cbrt' }),
  Abs: t('Abs(', K.FN, { f: 'Abs' }), arg: t('arg(', K.FN, { f: 'arg' }),
  Conjg: t('Conjg(', K.FN, { f: 'Conjg' }),
  Pol: t('Pol(', K.FN, { f: 'Pol', varargs: true }),
  Rec: t('Rec(', K.FN, { f: 'Rec', varargs: true }),
  Rnd: t('Rnd(', K.FN, { f: 'Rnd' }),
  Not: t('Not(', K.FN, { f: 'Not' }), Neg: t('Neg(', K.FN, { f: 'Neg' }),

  // ---- postfix (priority 2) ----------------------------------------------
  sqr: t('²', K.POST, { f: 'sqr' }), cube: t('³', K.POST, { f: 'cube' }),
  recip: t('⁻¹', K.POST, { f: 'recip' }), fact: t('!', K.POST, { f: 'fact' }),
  dms: t('°', K.POST, { f: 'dms' }),
  degU: t('°', K.POST, { f: 'toDeg' }), radU: t('ʳ', K.POST, { f: 'toRad' }),
  graU: t('ᵍ', K.POST, { f: 'toGra' }),
  pct: t('%', K.POST, { f: 'pct' }),

  // ---- infix that opens a parenthesis (priority 2) ------------------------
  pow: t('^(', K.POW, { f: 'pow' }), xroot: t('ˣ√(', K.POW, { f: 'xroot' }),

  // ---- prefix (priority 4) ------------------------------------------------
  neg: t('-', K.PRE, { f: 'neg' }),
  baseD: t('d', K.PRE, { base: 10 }), baseH: t('h', K.PRE, { base: 16 }),
  baseB: t('b', K.PRE, { base: 2 }), baseO: t('o', K.PRE, { base: 8 }),

  // ---- fraction separator (priority 3) ------------------------------------
  frac: t('⌐', K.FRAC),

  // ---- infix --------------------------------------------------------------
  add: t('+', K.INFIX, { p: 8, f: 'add' }),
  sub: t('-', K.INFIX, { p: 8, f: 'sub' }),
  mul: t('×', K.INFIX, { p: 7, f: 'mul' }),
  div: t('÷', K.INFIX, { p: 7, f: 'div' }),
  nPr: t('P', K.INFIX, { p: 6, f: 'nPr' }),
  nCr: t('C', K.INFIX, { p: 6, f: 'nCr' }),
  angle: t('∠', K.INFIX, { p: 6, f: 'angle' }),
  eq: t('=', K.INFIX, { p: 9, f: 'eq' }), ne: t('≠', K.INFIX, { p: 9, f: 'ne' }),
  gt: t('>', K.INFIX, { p: 9, f: 'gt' }), lt: t('<', K.INFIX, { p: 9, f: 'lt' }),
  ge: t('≥', K.INFIX, { p: 9, f: 'ge' }), le: t('≤', K.INFIX, { p: 9, f: 'le' }),
  and: t('and', K.INFIX, { p: 10, f: 'and' }),
  or: t('or', K.INFIX, { p: 11, f: 'or' }),
  xor: t('xor', K.INFIX, { p: 11, f: 'xor' }),
  xnor: t('xnor', K.INFIX, { p: 11, f: 'xnor' }),

  // ---- statistical values (priority 1 atoms) ------------------------------
  Sx2: t('Σx²', K.CONST, { stat: 'Sx2' }), Sx: t('Σx', K.CONST, { stat: 'Sx' }),
  Sn: t('n', K.CONST, { stat: 'n' }),
  Sy2: t('Σy²', K.CONST, { stat: 'Sy2' }), Sy: t('Σy', K.CONST, { stat: 'Sy' }),
  Sxy: t('Σxy', K.CONST, { stat: 'Sxy' }),
  Sx2y: t('Σx²y', K.CONST, { stat: 'Sx2y' }), Sx3: t('Σx³', K.CONST, { stat: 'Sx3' }),
  Sx4: t('Σx⁴', K.CONST, { stat: 'Sx4' }),
  xbar: t('x̄', K.CONST, { stat: 'xbar' }),
  xsn: t('xσn', K.CONST, { stat: 'xsn' }), xsn1: t('xσn⁻¹', K.CONST, { stat: 'xsn1' }),
  ybar: t('ȳ', K.CONST, { stat: 'ybar' }),
  ysn: t('yσn', K.CONST, { stat: 'ysn' }), ysn1: t('yσn⁻¹', K.CONST, { stat: 'ysn1' }),
  minX: t('minX', K.CONST, { stat: 'minX' }), maxX: t('maxX', K.CONST, { stat: 'maxX' }),
  minY: t('minY', K.CONST, { stat: 'minY' }), maxY: t('maxY', K.CONST, { stat: 'maxY' }),
  regA: t('a', K.CONST, { stat: 'a' }), regB: t('b', K.CONST, { stat: 'b' }),
  regC: t('c', K.CONST, { stat: 'c' }), regR: t('r', K.CONST, { stat: 'r' }),
  estX: t('x̂', K.EST, { est: 'x' }), estY: t('ŷ', K.EST, { est: 'y' }),
  estX1: t('x̂1', K.EST, { est: 'x1' }), estX2: t('x̂2', K.EST, { est: 'x2' }),

  // ---- result display overrides ------------------------------------------
  toRect: t('▶a+bi', K.CONV, { conv: 'rect' }),
  toPolar: t('▶r∠θ', K.CONV, { conv: 'polar' }),

  // ---- program commands ---------------------------------------------------
  pIn: t('?', K.PROG, { c: 'input' }),
  pAsg: t('→', K.PROG, { c: 'assign' }),
  pOut: t('◢', K.PROG, { c: 'output' }),
  pJump: t('⇒', K.PROG, { c: 'Jump' }),
  pGoto: t('Goto ', K.PROG, { c: 'Goto' }), pLbl: t('Lbl ', K.PROG, { c: 'Lbl' }),
  pIf: t('If ', K.PROG, { c: 'If' }), pThen: t('Then ', K.PROG, { c: 'Then' }),
  pElse: t('Else ', K.PROG, { c: 'Else' }), pIfEnd: t('IfEnd', K.PROG, { c: 'IfEnd' }),
  pFor: t('For ', K.PROG, { c: 'For' }), pTo: t(' To ', K.PROG, { c: 'To' }),
  pStep: t(' Step ', K.PROG, { c: 'Step' }), pNext: t('Next', K.PROG, { c: 'Next' }),
  pWhile: t('While ', K.PROG, { c: 'While' }),
  pWhileEnd: t('WhileEnd', K.PROG, { c: 'WhileEnd' }),
  pBreak: t('Break', K.PROG, { c: 'Break' }),
  pDeg: t('Deg', K.PROG, { c: 'Deg' }), pRad: t('Rad', K.PROG, { c: 'Rad' }),
  pGra: t('Gra', K.PROG, { c: 'Gra' }),
  pFix: t('Fix ', K.PROG, { c: 'Fix' }), pSci: t('Sci ', K.PROG, { c: 'Sci' }),
  pNorm: t('Norm ', K.PROG, { c: 'Norm' }),
  pFreqOn: t('FreqOn', K.PROG, { c: 'FreqOn' }),
  pFreqOff: t('FreqOff', K.PROG, { c: 'FreqOff' }),
  pClrMemory: t('ClrMemory', K.PROG, { c: 'ClrMemory' }),
  pClrStat: t('ClrStat', K.PROG, { c: 'ClrStat' }),
  pMplus: t('M+', K.PROG, { c: 'M+' }), pMminus: t('M-', K.PROG, { c: 'M-' }),
  pDec: t('Dec', K.PROG, { c: 'Dec' }), pHex: t('Hex', K.PROG, { c: 'Hex' }),
  pBin: t('Bin', K.PROG, { c: 'Bin' }), pOct: t('Oct', K.PROG, { c: 'Oct' }),
  pDT: t('DT', K.PROG, { c: 'DT' })
};

// Scientific-constant tokens are generated from the constant table so the two
// can never drift apart.
export function registerConstants(list) {
  for (const c of list) {
    TOK['CONST_' + c.key] = { s: c.sym, k: K.CONST, b: 2, sci: c.key };
  }
}

// Formula variables live in their own namespace; they only appear while a
// built-in formula is being evaluated.
for (const name of ['a', 'b', 'c', 'r', 't', 'v', 'ρ', 'θ']) {
  TOK['fv_' + name] = { s: name, k: K.CONST, b: 1, fv: name };
}

export function tok(id) {
  const d = TOK[id];
  if (!d) throw new Error('unknown token ' + id);
  return Object.assign({ id }, d);
}

export function bytesOf(list) {
  return list.reduce((n, x) => n + (x.b || 1), 0);
}

export function textOf(list) {
  return list.map((x) => x.s).join('');
}
