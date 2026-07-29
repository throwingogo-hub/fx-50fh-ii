// tests/run.js — drives the machine by key id and checks the displayed result
// against the worked examples printed in the user's guide.
//
//   node tests/run.js

import { Machine } from '../js/machine.js';
import { Program } from '../js/program.js';
import { K, TOK, tok } from '../js/tokens.js';
import { CONSTANTS } from '../js/consts.js';
import { StatStore } from '../js/stats.js';
import { KEYS, SHELL_W, SHELL_H } from '../js/keymap.js';
import { glyphLayers, hasGlyph, lcdTextCells } from '../js/font.js';
import { formatProgramText, parseProgramText } from '../js/program-codec.js';

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

function near(name, got, want, eps = 1e-9) {
  check(name, Math.abs(got - want) <= eps * Math.max(1, Math.abs(want)), true);
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

function te(name, seq, want, prep) {
  const m = new Machine();
  if (prep) prep(m);
  try {
    send(m, seq);
  } catch (e) {
    fail++;
    failures.push(`${name}\n    threw ${e.stack}`);
    return;
  }
  check(name, m.view().line1, want);
}

// ---- physical controls -----------------------------------------------------
check('keymap contains all 50 physical controls', KEYS.length, 50);
check('keymap ids are unique', new Set(KEYS.map((key) => key.id)).size, KEYS.length);
check('every key has a spoken base label', KEYS.every((key) => typeof key.base === 'string' && key.base), true);
check('every hotspot stays inside the fitted shell', KEYS.every((key) =>
  key.x >= 0 && key.y >= 0 && key.w > 0 && key.h > 0 &&
  key.x + key.w <= SHELL_W && key.y + key.h <= SHELL_H), true);

// ---- shared LCD menu layout ------------------------------------------------
{
  const m = new Machine();
  m.openModeMenu();
  let v = m.view();
  check('MODE page 1 keeps numbers in their physical LCD cells', v.line2Cells.join(''), '1   2   3 ');
  check('MODE menu shows both paging arrows', v.scrollLeft && v.scrollRight, true);
  m.press('RIGHT');
  v = m.view();
  check('MODE page 2 keeps numbers in their physical LCD cells', v.line2Cells.join(''), '4   5   6 ');

  m.openConstMenu(0);
  v = m.view();
  check('four-choice menus keep 1–4 under their labels', v.line2Cells.join(''), '1  2  3  4');

  m.openDrgMenu();
  v = m.view();
  check('DRG renders three choices rather than a title-only screen',
    v.line1 === 'D    R     G    ' && v.line2Cells.join('') === '1   2   3 ', true);

  m.openSetup(2);
  v = m.view();
  check('two-item SETUP pages retain the three-slot family anchors', v.line2Cells.join(''), '1   2     ');

  m.openRegTypeMenu();
  m.press('RIGHT');
  v = m.view();
  check('short REG pages retain the four-slot family anchors', v.line2Cells.join(''), '1  2  3   ');

  m.openPCmd(3);
  v = m.view();
  check('short P-CMD pages retain the four-slot family anchors', v.line2Cells.join(''), '1  2      ');
}
{
  const m = new Machine();
  const specs = [];
  const collect = (open) => { open(); specs.push(m.menu); };
  collect(() => m.openModeMenu());
  for (let page = 0; page < 6; page++) collect(() => m.openSetup(page));
  collect(() => m.openClrMenu());
  collect(() => m.openDrgMenu());
  collect(() => m.openConstMenu(0));
  collect(() => m.openLogicMenu(0));
  m.mode = 'SD';
  collect(() => m.openSSum(0));
  collect(() => m.openSVar());
  m.mode = 'REG';
  collect(() => m.openSSum(0));
  collect(() => m.openSVar());
  collect(() => m.openRegVar(0));
  collect(() => m.openRegMinMax(0));
  collect(() => m.openRegTypeMenu());
  collect(() => m.openPCmd(0));

  let layoutsValid = true;
  let pagedArrowsValid = true;
  let glyphsValid = true;
  for (const spec of specs) {
    m.menu = spec;
    for (let page = 0; page < spec.pages.length; page++) {
      spec.page = page;
      const view = m.menuView();
      const source = spec.pages[page];
      layoutsValid &&= source.title ? view.line2Cells === null : view.line2Cells.length === 10;
      pagedArrowsValid &&= spec.pages.length === 1 || (view.scrollLeft && view.scrollRight);
      for (const text of [source.title || '', ...source.items.map((item) => item.label)]) {
        for (const ch of text) glyphsValid &&= hasGlyph(ch);
      }
    }
  }
  check('every menu page preserves all ten lower LCD cells', layoutsValid, true);
  check('every multi-page menu exposes both paging arrows', pagedArrowsValid, true);
  check('every menu symbol has a real LCD glyph instead of fallback square', glyphsValid, true);
}
{
  const m = new Machine();
  m.mode = 'SD';
  m.openSVar();
  const cells = lcdTextCells(m.view().line1);
  check('S-VAR x-bar occupies one physical LCD cell', cells[0], 'x̄');
  check('S-VAR still fills exactly sixteen upper LCD cells', cells.length, 16);
  check('combined LCD marks draw as an overlay rather than a second character', glyphLayers(cells[0]).length, 2);
}

// ---- ON / power reset ------------------------------------------------------
{
  const m = new Machine();
  send(m, '2+3=');
  m.press('ON');
  check('ON clears a calculation at the home screen', m.view().line2, '0');
  check('ON clears entry and result state', m.tokens.length === 0 && m.result === null, true);
  check('ON clears calculation history and its indicator', m.history.length === 0 && !m.view().histUp, true);
}
{
  const m = new Machine();
  send(m, '7*8=@[AC]');
  check('SHIFT AC turns the calculator off', m.off, true);
  m.press('ON');
  check('ON powers the calculator back on', m.off, false);
  check('power-on returns to a clear home screen', m.view().line2, '0');
}
{
  const m = new Machine();
  send(m, '[MODE]3' + '101');
  m.press('ON');
  check('ON clears without changing the active calculation mode', m.mode, 'BASE');
  send(m, '@[AC]');
  m.press('ON');
  check('power-on restores the mode active before power-off', m.mode, 'BASE');
}
{
  const m = new Machine();
  send(m, '[MODE]6' + '1' + '1' + '2' + '12'); // P1, CMPLX, body "12"
  m.press('ON');
  check('ON saves the program being edited', m.programs[0].tokens.length, 2);
  check('ON exits program editing to its original mode', m.mode, 'CMPLX');
  check('ON leaves the program editor on a clear home screen', m.prog === null && m.view().line2 === '0', true);
}
{
  const m = new Machine();
  send(m, '[MODE]6');
  m.press('ON');
  check('ON leaves the PRGM menu for the default calculation home', m.mode === 'COMP' && m.screen === 'input', true);
}

// ---- calculation history / REPLAY -----------------------------------------
{
  const m = new Machine();
  send(m, '1+1=2+2=3+3=');
  check('history indicator is available when an older calculation exists', m.view().histUp, true);
  m.press('UP');
  check('first REPLAY up skips the calculation already on screen', m.view().line1, '2+2');
  check('history browse exposes the down/back indicator', m.view().histDown, true);
  m.press('UP');
  check('REPLAY up reaches the oldest calculation', m.view().line1, '1+1');
  check('oldest history record has no older-record indicator', m.view().histUp, false);
  m.press('DOWN');
  check('REPLAY down moves forward through history', m.view().line1, '2+2');
  m.press('DOWN');
  check('REPLAY down returns to the calculation that was on screen', m.view().line1, '3+3');
  check('returning from history exits browse state', m.histIndex === -1 && !m.view().histDown, true);
}
{
  const m = new Machine();
  send(m, '1+1=2+2=9');
  m.press('UP');
  m.press('DOWN');
  check('REPLAY down restores the in-progress expression it left', m.view().line1, '9');
}
{
  const m = new Machine();
  m.mode = 'SD';
  send(m, '2+2=');
  check('calculation history is limited to COMP, CMPLX and BASE modes', m.history.length, 0);
}
{
  const m = new Machine();
  send(m, '1+1=2+2=');
  send(m, '@[N9]2');
  check('CLR Setup clears calculation history as a reset operation', m.history.length, 0);
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
{
  const m = new Machine();
  send(m, '1'.repeat(91));
  check('input cursor becomes block with 8 bytes left', m.view().cursorKind, 'full');
  send(m, '1'.repeat(20));
  check('input area stops at 99 bytes', String(m.tokens.length), '99');
  check('full input does not raise Stack ERROR', m.view().line1 === 'Stack ERROR', false);
}
{
  let deepNumeric = '1';
  for (let i = 0; i < 10; i++) deepNumeric = `1*(${deepNumeric}+1)`;
  te('numeric stack limit', deepNumeric + '=', 'Stack ERROR');
  te('command stack limit', '('.repeat(25) + '1' + ')'.repeat(25) + '=', 'Stack ERROR');
}

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
te('general result overflow', '1[EXP]99*10=', 'Math ERROR');
te('10^ input range', '@[LOG]100)=', 'Math ERROR');
te('e^ input range', '@[LN]231)=', 'Math ERROR');
te('sinh input range', '[HYP][SIN]231)=', 'Math ERROR');
te('sin degree input range', '[SIN]9000000000)=', 'Math ERROR');

// ---- other functions --------------------------------------------------------
t('(5+3)!', '(5+3)@[RECIP]=', '40320');
t('Abs(2−7)', '@)2-7)=', '5');
t('10P4', '10@*4=', '5040');
t('10C4', '10@/4=', '210');
te('nPr n input range', '10000000000@*1=', 'Math ERROR');
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
{
  const m = new Machine();
  send(m, '9[EXP]99[MPLUS]9[EXP]99[MPLUS]');
  check('independent memory overflow', m.view().line1, 'Math ERROR');
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
te('BIN positive overflow', '[MODE]3[LOG]111111111+1=', 'Math ERROR');
te('OCT positive overflow', '[MODE]3[LN]3777777777+1=', 'Math ERROR');
te('DEC positive overflow', '[MODE]3' + '2147483647+1=', 'Math ERROR');
te('HEX positive overflow', '[MODE]3[POW]7[TAN][TAN][TAN][TAN][TAN][TAN][TAN]+1=', 'Math ERROR');
te('BIN oversized input', '[MODE]3[LOG]10000000000=', 'Math ERROR');
te('DEC oversized input', '[MODE]3' + '2147483648=', 'Math ERROR');
t('DEC minimum via HEX conversion', '[MODE]3[POW]8' + '0000000=[SQR]', '-2147483648');
te('negating DEC minimum overflows', '[MODE]3[POW]8' + '0000000=[SQR][AC]0-[ANS]=', 'Math ERROR');

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

// Non-linear regression linearises data only for coefficients. The guide's
// S-SUM, S-VAR and MINMAX commands always describe the original samples.
function regMachine(typeKey, data) {
  const m = new Machine();
  send(m, '[MODE]5' + typeKey);
  for (const [x, y] of data) send(m, `${x},${y}[MPLUS]`);
  return m;
}
function statCommand(m, seq) {
  send(m, seq + '=');
  return shown(m);
}
{
  const m = regMachine('2', [[1, 2], [10, 3]]); // Log
  check('Log REG Sx uses raw x', statCommand(m, '@1' + '2'), '11');
  send(m, '[AC]');
  check('Log REG xbar uses raw x', statCommand(m, '@2' + '1' + '1'), '5.5');
  send(m, '[AC]');
  check('Log REG minX uses raw x', statCommand(m, '@2' + '2' + '1'), '1');
}
{
  const m = regMachine('3', [[1, 2], [10, 20]]); // Exp
  check('Exp REG Sy uses raw y', statCommand(m, '@1[RIGHT]' + '2'), '22');
  send(m, '[AC]');
  check('Exp REG ybar uses raw y', statCommand(m, '@2' + '1[RIGHT]' + '1'), '11');
  send(m, '[AC]');
  check('Exp REG maxY uses raw y', statCommand(m, '@2' + '2[RIGHT]' + '2'), '20');
}
{
  const m = regMachine('4', [[1, 2], [10, 20]]); // Pwr
  check('Pwr REG Sx uses raw x', statCommand(m, '@1' + '2'), '11');
  send(m, '[AC]');
  check('Pwr REG Sy uses raw y', statCommand(m, '@1[RIGHT]' + '2'), '22');
}
{
  const m = new Machine();
  send(m, '[MODE]5[RIGHT]' + '1'); // Inv
  for (const [x, y] of [[1, 2], [10, 20]]) send(m, `${x},${y}[MPLUS]`);
  check('Inv REG maxX uses raw x', statCommand(m, '@2' + '2' + '2'), '10');
}
{
  const m = new Machine();
  send(m, '[MODE]5[RIGHT]' + '3'); // AB-Exp
  for (const [x, y] of [[1, 2], [10, 20]]) send(m, `${x},${y}[MPLUS]`);
  check('AB-Exp REG minY uses raw y', statCommand(m, '@2' + '2[RIGHT]' + '1'), '2');
}

// The guide's sample-memory limits depend on mode and frequency setting.
{
  const m = new Machine();
  send(m, '[MODE]4');
  for (let i = 0; i < 40; i++) send(m, '1[MPLUS]');
  send(m, '1[MPLUS]');
  check('SD FreqOn data limit', m.view().line1, 'Data Full');
}
{
  const m = new Machine();
  send(m, '@[MODE][RIGHT][RIGHT][RIGHT][RIGHT]' + '2'); // FreqOff
  send(m, '[MODE]5' + '1');
  for (let i = 0; i < 40; i++) send(m, '1,2[MPLUS]');
  send(m, '1,2[MPLUS]');
  check('REG FreqOff data limit', m.view().line1, 'Data Full');
}

// Coefficients and estimates for all seven regression models. The datasets
// lie exactly on each model, so every expected parameter is independent of the
// implementation's fitting path.
const REG_MODEL_CASES = [
  ['Lin', [[1, 3], [2, 5], [3, 7], [4, 9]], { a: 1, b: 2 }, ['y', 5, 11], ['x', 11, 5]],
  ['Log', [[1, 1], [Math.E, 3], [Math.E ** 2, 5]], { a: 1, b: 2 }, ['y', Math.E ** 3, 7], ['x', 7, Math.E ** 3]],
  ['Exp', [[0, 2], [1, 2 * Math.exp(.5)], [2, 2 * Math.E]], { a: 2, b: .5 }, ['y', 3, 2 * Math.exp(1.5)], ['x', 2 * Math.exp(1.5), 3]],
  ['Pwr', [[1, 3], [2, 12], [4, 48]], { a: 3, b: 2 }, ['y', 3, 27], ['x', 27, 3]],
  ['Inv', [[1, 9], [2, 6.5], [4, 5.25]], { a: 4, b: 5 }, ['y', 5, 5], ['x', 5, 5]],
  ['AB-Exp', [[0, 2], [1, 6], [2, 18]], { a: 2, b: 3 }, ['y', 3, 54], ['x', 54, 3]]
];
for (const [type, data, coef, yCase, xCase] of REG_MODEL_CASES) {
  const s = new StatStore();
  s.type = type;
  for (const [x, y] of data) s.add(x, y);
  near(`${type} REG coefficient a`, s.value('a', true), coef.a);
  near(`${type} REG coefficient b`, s.value('b', true), coef.b);
  near(`${type} REG estimated y`, s.estimate(yCase[0], yCase[1]), yCase[2]);
  near(`${type} REG estimated x`, s.estimate(xCase[0], xCase[1]), xCase[2]);
}
{
  const s = new StatStore();
  s.type = 'Quad';
  for (const x of [-2, -1, 0, 1, 2]) s.add(x, 1 + 2 * x + 3 * x * x);
  near('Quad REG coefficient a', s.value('a', true), 1);
  near('Quad REG coefficient b', s.value('b', true), 2);
  near('Quad REG coefficient c', s.value('c', true), 3);
  near('Quad REG estimated y', s.estimate('y', 3), 34);
  const target = 34;
  const roots = [s.estimate('x1', target), s.estimate('x2', target)].sort((a, b) => a - b);
  near('Quad REG estimated x1', roots[0], -11 / 3);
  near('Quad REG estimated x2', roots[1], 3);
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
  const m4 = new Machine();
  send(m4, '[FMLA]07=9[EXP]99=9[EXP]99=1=');
  check('formula result overflow', m4.view().line1, 'Math ERROR');
}

const FORMULA_CASES = [
  ['02', '3=4=90=', '5'],
  ['04', '0=', '0.500000001'],
  ['05', '0=', '5.24808641e-10'],
  ['06', '1=1=1=', '8987551788'],
  ['07', '2=3=6=', '1'],
  ['08', '2=3=4=30=', '12'],
  ['09', '10=2=5=10=', '3.678794412'],
  ['10', '2=4=', '6.020599913'],
  ['11', '3=1=1=1=', '6.819365652'],
  ['12', '3=1=1=1=', '0.163049804'],
  ['13', '1=1=', '0.159154943'],
  ['14', '2=3=', '50.129925'],
  ['16', '1=1=', '6.283185307'],
  ['17', '100=340=0=0=', '100'],
  ['18', '1=300=1=', '2494.3416'],
  ['19', '2=3=6=', '3'],
  ['20', '2=3=', '9'],
  ['21', '2=3=4=8=', '33.41995'],
  ['22', '100=0=2=30=', '86.60254038'],
  ['23', '100=0=2=60=', '50']
];
for (const [no, inputs, want] of FORMULA_CASES) {
  t(`formula ${no} catalogue path`, `[FMLA]${no}=${inputs}`, want);
}

// ---- scientific constants ---------------------------------------------------
const R = (n) => '[RIGHT]'.repeat(n);
t('speed of light', '@7' + R(6) + '4=', '299792458');
t('1/√(ε0 μ0)', '1/[SQRT]@7' + R(7) + '4' + '@7' + R(8) + '1)=', '299792458');
t('standard gravity', '@7' + R(8) + '3=', '9.80665');
for (let i = 0; i < CONSTANTS.length; i++) {
  const m = new Machine();
  send(m, '@7' + R(Math.floor(i / 4)) + String(i % 4 + 1) + '=');
  check(`constant ${String(i + 1).padStart(2, '0')} menu path`, m.result.z.re === CONSTANTS[i].v, true);
}

// ---- program mode -----------------------------------------------------------
{
  const m = new Machine();
  m.setStudioProgram(0, 'COMP', '123456789012345678'.split(''));
  m.editProgramSlot(0);
  m.press('UP');
  check('program REPLAY up jumps to the first token', m.prog.cursor, 0);
  check('program start jump keeps the cursor visible', m.view().cursor, 0);
  m.press('DOWN');
  const end = m.view();
  check('program REPLAY down jumps to the end', m.prog.cursor, 18);
  check('long-program end jump reserves a visible LCD cursor cell', end.cursor, 15);
  check('long-program end jump scrolls to the final text', end.scrollLeft && !end.scrollRight, true);
}
{
  const m = new Machine();
  m.setStudioProgram(0, 'COMP', '1234567890123456'.split(''));
  m.editProgramSlot(0);
  const end = m.view();
  check('exactly full program line still reserves the end cursor', end.cursor, 15);
  check('exactly full program line reveals the preceding-text arrow', end.scrollLeft, true);
}
{
  const m = new Machine();
  m.setStudioProgram(0, 'SD', ['xbar', '1']);
  m.editProgramSlot(0);
  check('program cursor counts a combining statistic glyph as one LCD cell', m.view().cursor, 2);
}
{
  const source = '?→A\nA×2.54◢';
  const parsed = parseProgramText(source, 'COMP');
  check('Program Studio parses copyable calculator notation', parsed.errors.length, 0);
  check('Program Studio preserves the guide example token sequence', parsed.tokenIds.join(','),
    'pIn,pAsg,varA,:,varA,mul,2,.,5,4,pOut');
  check('Program Studio text round-trips', formatProgramText(parsed.tokens), source);
}
{
  const parsed = parseProgramText('For 1->A To 5\nA M+\nNext', 'COMP');
  check('Program Studio accepts ASCII assignment arrows', parsed.errors.length, 0);
  check('Program Studio recognizes loop commands', parsed.tokenIds.includes('pFor') && parsed.tokenIds.includes('pNext'), true);
}
{
  const commandsRoundTrip = Object.entries(TOK)
    .filter(([, spec]) => spec.k === K.PROG)
    .every(([id, spec]) => {
      const text = formatProgramText([{ ...spec, id }]);
      const parsed = parseProgramText(text, 'COMP');
      return parsed.errors.length === 0 && parsed.tokenIds.length === 1 && parsed.tokenIds[0] === id;
    });
  check('every program command survives copy and paste', commandsRoundTrip, true);
}
{
  const parsed = parseProgramText('For 1→A', 'COMP');
  check('Program Studio preserves structurally incomplete drafts as tokens', parsed.errors.length, 0);
}
{
  const m = new Machine();
  send(m, '[MODE]6' + '1' + '1' + '1' + '12');
  const snapshot = m.programSnapshot();
  const restored = new Machine();
  check('autosave snapshot includes the active unsaved editor', snapshot.slots[0].tokens.join(','), '1,2');
  check('autosave snapshot restores successfully', restored.restoreProgramSnapshot(snapshot), true);
  check('restored draft remains available in P1', restored.programs[0].tokens.map((token) => token.id).join(','), '1,2');
}
{
  const m = new Machine();
  m.setStudioProgram(0, 'COMP', Array(400).fill('1'));
  let rejected = false;
  try { m.setStudioProgram(1, 'COMP', Array(281).fill('2')); }
  catch { rejected = true; }
  check('Program Studio enforces the shared 680-byte memory', rejected, true);
}
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
for (const [key, mode, secondPage] of [
  ['1', 'COMP', false], ['2', 'CMPLX', false],
  ['3', 'BASE', true], ['4', 'SD', true], ['5', 'REG', true]
]) {
  const m = new Machine();
  send(m, '[MODE]6' + '1' + '1' + (secondPage ? '[RIGHT]' : '') + key);
  check(`program run-mode key ${key}`, m.programs[0].mode, mode);
}
{
  const m = new Machine();
  send(m, '[MODE]6' + '1');
  check('program picker shows all four slots and free bytes', m.view().line2, 'P----- 680');
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
{
  const m = new Machine();
  try {
    new Program('COMP', ['pIf', '1', ':', '1'].map(tok)).start(m);
    check('program: If requires Then', 'no error', 'Syntax ERROR');
  } catch (e) {
    check('program: If requires Then', e.message, 'Syntax ERROR');
  }
}
{
  // If 0 : Then 7 -> A (no IfEnd). The guide says omission itself is not an
  // error; the remaining statements are treated as part of the branch.
  const m = new Machine();
  const ids = ['pIf', '0', ':', 'pThen', '7', 'pAsg', 'varA'];
  let result;
  try { result = new Program('COMP', ids.map(tok)).start(m).step(); }
  catch (e) { result = e.message; }
  check('program: missing IfEnd is accepted', typeof result === 'object' && result.done, true);
  check('program: false missing-IfEnd branch is skipped', String(m.vars.A), '0');
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
