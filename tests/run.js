// tests/run.js — drives the machine by key id and checks the displayed result
// against the worked examples printed in the user's guide.
//
//   node tests/run.js

import { Machine } from '../js/machine.js';

// ---- key sequence DSL -------------------------------------------------------
// digits and operators are literal; @ prefixes SHIFT, # prefixes ALPHA,
// [NAME] presses a key by id.
const LIT = {
  '0': 'N0', '1': 'N1', '2': 'N2', '3': 'N3', '4': 'N4',
  '5': 'N5', '6': 'N6', '7': 'N7', '8': 'N8', '9': 'N9',
  '.': 'DOT', '+': 'ADD', '-': 'SUB', '*': 'MUL', '/': 'DIV',
  '(': 'LPAR', ')': 'RPAR', ',': 'COMMA', '=': 'EXE'
};

function send(m, seq) {
  let i = 0;
  while (i < seq.length) {
    const ch = seq[i];
    if (ch === ' ') { i++; continue; }
    if (ch === '@') { m.press('SHIFT'); i++; continue; }
    if (ch === '#') { m.press('ALPHA'); i++; continue; }
    if (ch === '[') {
      const j = seq.indexOf(']', i);
      m.press(seq.slice(i + 1, j));
      i = j + 1;
      continue;
    }
    if (LIT[ch]) { m.press(LIT[ch]); i++; continue; }
    throw new Error('bad key in sequence: ' + ch + ' (' + seq + ')');
  }
  return m;
}

let pass = 0, fail = 0;
const failures = [];

function check(name, got, want) {
  if (got === want) { pass++; return; }
  fail++;
  failures.push(`${name}\n    expected ${JSON.stringify(want)}\n    got      ${JSON.stringify(got)}`);
}

/** Run a key sequence on a fresh machine (or the supplied one) and read line 2. */
function shown(m) {
  const v = m.view();
  return v.line2 + (v.exp ? 'e' + v.exp : '');
}

function t(name, seq, want, prep) {
  const m = new Machine();
  if (prep) prep(m);
  try {
    send(m, seq);
  } catch (e) {
    fail++;
    failures.push(`${name}\n    threw ${e.stack}`);
    return;
  }
  check(name, shown(m), want);
}

// ---- basic arithmetic -------------------------------------------------------
t('2×(5+4)−2×(−3)', '2*(5+4)-2*[NEG]3=', '24');
t('2.5+1−2', '2.5+1-2=', '1.5');
t('7×8−4×5', '7*8-4*5=', '36');
t('(2+3)×(4−1 with open paren', '(2+3)*(4-1=', '15');
t('sin 30', '[SIN]30)=', '0.5');
t('sin⁻¹ 0.5', '@[SIN]0.5)=', '30');
t('100÷7 Norm1', '100/7=', '14.28571429');
t('1÷200 Norm1', '1/200=', '5.e-03');
t('omitted × before (', '2(5+4)=', '18');
t('Ans chaining', '3*4=/30=', '0.4');
t('√3²+4²', '3[SQR]+4[SQR]=[SQRT]=', '5');

// ---- fractions --------------------------------------------------------------
t('3 1/4 + 1 2/3', '3[ABC]1[ABC]4+1[ABC]2[ABC]3=', '4⌐11⌐12');
t('4 − 3 1/2', '4-3[ABC]1[ABC]2=', '1⌐2');
t('2/3 + 1/2 as d/c', '2[ABC]3+1[ABC]2=', '7⌐6', (m) => { m.setup.frac = 'd/c'; });
t('1.5 → fraction', '1.5=[ABC]', '1⌐1⌐2');

// ---- percent ----------------------------------------------------------------
t('2%', '2@(=', '0.02');
t('150×20%', '150*20@(=', '30');
t('660÷880%', '660/880@(=', '75');
t('2500+2500×15%', '2500+2500*15@(=', '2875');
t('3500−3500×25%', '3500-3500*25@(=', '2625');
t('(500+300)÷500%', '(500+300)/500@(=', '160');

// ---- sexagesimal ------------------------------------------------------------
t('2°20′30″ + 0°39′30″', '2[DMS]20[DMS]30[DMS]+0[DMS]39[DMS]30[DMS]=', '3°0°0');
t('2°20′ × 3.5', '2[DMS]20[DMS]*3.5=', '8°10°0');
t('2.255 → sexagesimal', '2.255=[DMS]', '2°15°18');

// ---- logs, powers, roots ----------------------------------------------------
t('log(2,16)', '[LOG]2,16)=', '4');
t('log 16', '[LOG]16)=', '1.204119983');
t('ln 90', '[LN]90)=', '4.49980967');
t('e^10', '@[LN]10)=', '22026.46579');
t('(√2+1)(√2−1)', '([SQRT]2)+1)([SQRT]2)-1)=', '1');
t('(1+1)^(2+2)', '(1+1)[POW]2+2)=', '16');
t('−2^(2/3)', '[NEG]2[POW]2[ABC]3)=', '-1.587401052');
t('sinh 1', '[HYP][SIN]1)=', '1.175201194');
t('3√8 via xroot', '3@[POW]8)=', '2');
t('cube root 27', '@[CUBE]27)=', '3');

// ---- other functions --------------------------------------------------------
t('(5+3)!', '(5+3)@[RECIP]=', '40320');
t('Abs(2−7)', '@)2-7)=', '5');
t('10P4', '10@*4=', '5040');
t('10C4', '10@/4=', '210');
t('Pol(√2,√2) r', '@+[SQRT]2),[SQRT]2))=', '2');
t('Rec(2,30) x', '@-2,30)=', '1.732050808');

// ---- Pol/Rec side effects ---------------------------------------------------
{
  const m = new Machine();
  send(m, '@+[SQRT]2),[SQRT]2))=');
  check('Pol sets Y to θ', String(m.vars.Y), '45');
  const m2 = new Machine();
  send(m2, '@-2,30)=');
  check('Rec sets Y to y', String(Math.round(m2.vars.Y * 1e9) / 1e9), '1');
}

// ---- display settings -------------------------------------------------------
t('Fix 2: 100÷7', '[MODE]1@[MODE][RIGHT]1' + '2' + '100/7=', '14.29');
t('Sci 5: 1÷7', '[MODE]1@[MODE][RIGHT]2' + '5' + '1/7=', '1.4286e-01');
t('Norm2: 1÷200', '@[MODE][RIGHT]3' + '2' + '1/200=', '0.005');
t('Rnd under Fix 3', '@[MODE][RIGHT]1' + '3' + '200/7=@0[ANS])=*14=', '399.994');
t('no Rnd under Fix 3', '@[MODE][RIGHT]1' + '3' + '200/7=*14=', '400.000');
t('1234 in ENG', '1234=[ENG]', '1.234e03');

// ---- memory and variables ---------------------------------------------------
{
  const m = new Machine();
  send(m, '23+9[MPLUS]53-6[MPLUS]45*2@[MPLUS]99/3[MPLUS][RCL][MPLUS]');
  check('independent memory total', shown(m), '22');
}
{
  const m = new Machine();
  send(m, '9*6+3@[RCL][DMS]5*8@[RCL][HYP]#[DMS]/#[HYP]=');
  check('B ÷ C', shown(m), '1.425');
}

// ---- BASE mode --------------------------------------------------------------
t('BIN 1+1', '[MODE]3[LOG]1+1=', '10');
t('OCT 7+1', '[MODE]3[LN]7+1=', '10');
t('HEX 1F+1', '[MODE]3[POW]1[TAN]+1=', '20');
t('DEC 30 → BIN', '[MODE]330=[LOG]', '11110');
t('DEC 30 → OCT', '[MODE]330=[LN]', '36');
t('DEC 30 → HEX', '[MODE]330=[POW]', '1E');
t('1010 and 1100', '[MODE]3[LOG]1010[RECIP]1' + '1100=', '1000');
t('1011 or 11010', '[MODE]3[LOG]1011[RECIP]2' + '11010=', '11011');
t('1010 xor 1100', '[MODE]3[LOG]1010[RECIP][RIGHT]1' + '1100=', '110');
t('1111 xnor 101', '[MODE]3[LOG]1111[RECIP]3' + '101=', '1111110101');
t('Not(1010)', '[MODE]3[LOG][RECIP][RIGHT]2' + '1010)=', '1111110101');
t('Neg(101101)', '[MODE]3[LOG][RECIP][RIGHT]3' + '101101)=', '1111010011');
t('d5 + h5 in binary', '[MODE]3[LOG][RECIP][LEFT]1' + '5+[RECIP][LEFT]2' + '5=', '1010');

// ---- CMPLX mode -------------------------------------------------------------
t('2×(√3+i) real part', '[MODE]22*([SQRT]3)+#[ENG])=', '3.464101615');
{
  const m = new Machine();
  send(m, '[MODE]22*([SQRT]3)+#[ENG])=@[EXE]');
  check('2×(√3+i) imaginary part', shown(m), '2');
  const m2 = new Machine();
  send(m2, '[MODE]2[SQRT]2)@[NEG]45=');
  check('√2∠45 real part', shown(m2), '1');
  send(m2, '@[EXE]');
  check('√2∠45 imaginary part', shown(m2), '1');
  const m3 = new Machine();
  send(m3, '[MODE]2@,2+3#[ENG])=');
  check('Conjg(2+3i) real', shown(m3), '2');
  send(m3, '@[EXE]');
  check('Conjg(2+3i) imaginary', shown(m3), '-3');
}
t('Abs(2+2i)', '[MODE]2@)2+2#[ENG])=', '2.828427125');
t('arg(2+2i)', '[MODE]2@(2+2#[ENG])=', '45');
t('1+1i in polar', '[MODE]2@[MODE][RIGHT][RIGHT][RIGHT]2' + '1+1#[ENG]=', '1.414213562');

// ---- statistics -------------------------------------------------------------
{
  const m = new Machine();
  const data = [[55, 1], [57, 2], [59, 2], [61, 5], [63, 8], [65, 9],
    [67, 8], [69, 6], [71, 4], [73, 3], [75, 2]];
  send(m, '[MODE]4');
  for (const [x, f] of data) send(m, `${x}@,${f}[MPLUS]`);
  send(m, '@2' + '1' + '=');
  check('SD mean of pulse data', shown(m), '65.68');
  send(m, '[AC]@2' + '3' + '=');
  check('SD sample standard deviation', shown(m), '4.635444632');
  send(m, '[AC]@1' + '3' + '=');
  check('SD n', shown(m), '50');
}
{
  // linear regression through an exact line: y = 2x + 1
  const m = new Machine();
  send(m, '[MODE]5' + '1');
  for (const [x, y] of [[1, 3], [2, 5], [3, 7], [4, 9]]) send(m, `${x},${y}[MPLUS]`);
  send(m, '@2' + '1' + '[RIGHT][RIGHT]1' + '=');
  check('REG constant a', shown(m), '1');
  send(m, '[AC]@2' + '1' + '[RIGHT][RIGHT]2' + '=');
  check('REG coefficient b', shown(m), '2');
  send(m, '[AC]@2' + '1' + '[RIGHT][RIGHT]3' + '=');
  check('REG correlation r', shown(m), '1');
  send(m, '[AC]10@2' + '1' + '[LEFT]2' + '=');
  check('REG estimated y at x=10', shown(m), '21');
}

// ---- built-in formulas ------------------------------------------------------
{
  const m = new Machine();
  send(m, '[FMLA]03=8=5=5=');
  check('Heron 8,5,5', shown(m), '12');
  const m2 = new Machine();
  send(m2, '[FMLA]01=1=[NEG]5=6=');
  check('Quadratic x²−5x+6 first root', shown(m2), '3');
  send(m2, '[DOWN]');
  check('Quadratic second root', shown(m2), '2');
  const m3 = new Machine();
  send(m3, '[FMLA]15=1=');
  check('Pendulum of 1 m', shown(m3), '2.006409293');
}

// ---- scientific constants ---------------------------------------------------
const R = (n) => '[RIGHT]'.repeat(n);
t('speed of light', '@7' + R(6) + '4=', '299792458');
t('1/√(ε0 μ0)', '1/[SQRT]@7' + R(7) + '4' + '@7' + R(8) + '1)=', '299792458');
t('standard gravity', '@7' + R(8) + '3=', '9.80665');

// ---- program mode -----------------------------------------------------------
{
  // ? -> A : A x 2.54     (the inches-to-centimetres example from the guide)
  const m = new Machine();
  send(m, '[MODE]6' + '1' + '1' + '1');       // PRGM, EDIT, area 1, run mode COMP
  send(m, '@3' + '1');                        // P-CMD page 1, "?"
  send(m, '@[RCL]#[NEG]');                    // -> A
  send(m, '=');                               // ":"
  send(m, '#[NEG]*2.54');
  send(m, '[AC]');
  send(m, '[MODE]1[PROG]1');                  // COMP, run program 1
  send(m, '10=');
  check('program: 10 inches in cm', shown(m), '25.4');
}
{
  // For 1 -> A To 5 : A^2 -> B : B (sum check via memory)
  const m = new Machine();
  send(m, '[MODE]6' + '1' + '1' + '1');
  send(m, '@3[RIGHT][RIGHT][RIGHT][RIGHT][RIGHT]1');   // For
  send(m, '1@[RCL]#[NEG]');
  send(m, '@3[RIGHT][RIGHT][RIGHT][RIGHT][RIGHT]2');   // To
  send(m, '5=');
  send(m, '#[NEG][MPLUS]=');                            // A M+  :
  send(m, '@3[RIGHT][RIGHT][RIGHT][RIGHT][RIGHT]4');   // Next
  send(m, '[AC]');
  send(m, '[MODE]1[PROG]1');
  send(m, '[RCL][MPLUS]');
  check('program: For loop accumulates 1..5', shown(m), '15');
}

// ---- error handling ---------------------------------------------------------
{
  const m = new Machine();
  send(m, '14/0*2=');
  check('divide by zero', m.view().line1, 'Math ERROR');
  const m2 = new Machine();
  send(m2, '1+=');
  check('dangling operator', m2.view().line1, 'Syntax ERROR');
  const m3 = new Machine();
  send(m3, '25=[SQRT]=');
  check('lone √( takes Ans', shown(m3), '5');
  const m4 = new Machine();
  send(m4, '14/0*2=[LEFT]');
  check('AC-free error recovery keeps the entry', m4.view().line1.includes('14'), true);
}

// ---- report -----------------------------------------------------------------
console.log(`\n${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log('\nfailures:\n');
  for (const f of failures) console.log('  ' + f + '\n');
}
process.exit(fail ? 1 : 0);
