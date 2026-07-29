// machine.js — the calculator itself: modes, menus, setup, the input line,
// calculation history, statistics entry, built-in formulas and program mode.

import { tok, bytesOf, textOf, K, registerConstants } from './tokens.js';
import { parse, evaluate, CalcError, C, isReal, r15 } from './expr.js';
import { formatReal, formatEng, formatFraction, formatDms, formatBase } from './format.js';
import { CONSTANTS, CONST_BY_KEY, CONST_PAGES } from './consts.js';
import { FORMULAS, formulaTitle } from './formulas.js';
import { StatStore, REG_TYPES } from './stats.js';
import { Program, PROGRAM_MEMORY } from './program.js';
import { lcdTextCells } from './font.js';

registerConstants(CONSTANTS);

const MODES = ['COMP', 'CMPLX', 'BASE', 'SD', 'REG', 'PRGM'];
const VAR_KEYS = { NEG: 'A', DMS: 'B', HYP: 'C', SIN: 'D', RPAR: 'X', COMMA: 'Y', MPLUS: 'M' };
const HEX_KEYS = { NEG: 'A', DMS: 'B', HYP: 'C', SIN: 'D', COS: 'E', TAN: 'F' };
const INPUT_BYTES = 99;

export class Machine {
  constructor() {
    this.setup = {
      angle: 'Deg', disp: 'Norm', digits: 0, norm: 1,
      frac: 'ab/c', cplx: 'a+bi', freq: true, contrast: 8
    };
    this.mode = 'COMP';
    this.base = 10;
    this.vars = { A: 0, B: 0, C: 0, D: 0, X: 0, Y: 0, M: 0 };
    this.fvars = {};
    this.ans = C(0);
    this.stat = new StatStore();
    this.programs = [null, null, null, null];
    this.reset();
  }

  reset() {
    this.shift = false;
    this.alpha = false;
    this.hyp = 0;                 // 0 none, 1 hyp, 2 inverse hyp
    this.insert = true;
    this.tokens = [];
    this.cursor = 0;
    this.result = null;
    this.screen = 'input';
    this.menu = null;
    this.pending = null;          // 'sto' | 'rcl'
    this.error = null;
    this.history = [];
    this.histIndex = -1;
    this.statBrowse = null;
    this.formula = null;
    this.prog = null;
    this.message = null;
    this.off = false;
  }

  // ==========================================================================
  // evaluation context
  ctx() {
    const self = this;
    return {
      mode: this.mode,
      angle: this.setup.angle,
      base: this.base,
      vars: this.vars,
      fvars: this.fvars,
      ans: this.ans,
      setVar: (n, v) => { self.vars[n] = v; },
      sci: (key) => CONST_BY_KEY[key].v,
      stat: (name) => self.stat.value(name, self.mode === 'REG'),
      est: (kind, v) => self.stat.estimate(kind, v),
      roundToDisplay: (x) => self.roundToDisplay(x)
    };
  }

  roundToDisplay(x) {
    const s = this.setup;
    if (s.disp === 'Fix') return Number(x.toFixed(s.digits));
    if (s.disp === 'Sci') return Number(x.toPrecision(s.digits === 0 ? 10 : s.digits));
    return Number(x.toPrecision(10));
  }

  // ==========================================================================
  // key entry point
  press(id) {
    if (this.off) {
      if (id === 'ON') this.pressOn();
      return;
    }
    if (id === 'SHIFT') { this.shift = !this.shift; this.alpha = false; return; }
    if (id === 'ALPHA') { this.alpha = !this.alpha; this.shift = false; return; }

    const shift = this.shift, alpha = this.alpha;
    this.shift = false;
    this.alpha = false;

    if (id === 'ON') { this.pressOn(); return; }
    if (shift && id === 'AC') { this.off = true; return; }

    try {
      this.dispatch(id, shift, alpha);
    } catch (e) {
      if (e instanceof CalcError) this.raise(e.kind);
      else if (e && e.mathError) this.raise('Math');
      else throw e;
    }
  }

  raise(kind) {
    this.error = kind;
    this.screen = 'error';
  }

  // ON is both the power-on and all-clear key. In the program editor it also
  // stores the program and returns to the calculation mode chosen for it,
  // rather than leaving the machine stranded on a PRGM screen.
  pressOn() {
    let returnMode = this.mode;
    if (this.prog && this.prog.stage === 'edit') {
      const stored = this.programs[this.prog.slot];
      returnMode = stored ? stored.mode : 'COMP';
      this.saveProgram();
    } else if (this.prog && this.prog.stage === 'running') {
      returnMode = this.prog.savedMode || this.mode;
    } else if (this.mode === 'PRGM') {
      returnMode = 'COMP';
    }

    this.off = false;
    this.mode = returnMode;
    this.menu = null;
    this.menuReturn = null;
    this.pending = null;
    this.error = null;
    this.formula = null;
    this.statBrowse = null;
    this.prog = null;
    this.message = null;
    this.clearEntry();
  }

  dispatch(id, shift, alpha) {
    // MODE always works, from any screen, and leaving PRGM saves the program.
    if (id === 'MODE' && this.screen !== 'menu') {
      return shift ? this.openSetup(0) : this.openModeMenu();
    }

    // menus swallow most keys
    if (this.screen === 'menu') return this.menuKey(id, shift);
    if (this.screen === 'error') {
      if (id === 'AC') { this.error = null; this.screen = this.tokens.length ? 'input' : 'input'; return; }
      if (id === 'LEFT' || id === 'RIGHT') { this.error = null; this.screen = 'input'; return; }
      if (id === 'ON') { this.error = null; this.screen = 'input'; return; }
      return;
    }
    if (this.screen === 'formula') return this.formulaKey(id, shift, alpha);
    if (this.screen === 'prog') return this.progKey(id, shift, alpha);
    if (this.screen === 'stat') return this.statKey(id, shift, alpha);

    // pending STO / RCL target
    if (this.pending) {
      const v = VAR_KEYS[id];
      if (v) {
        if (this.pending === 'sto') this.storeTo(v);
        else this.recallFrom(v);
        this.pending = null;
        return;
      }
      if (id === 'AC') { this.pending = null; return; }
      return;
    }

    switch (id) {
      case 'MODE':
        return shift ? this.openSetup(0) : this.openModeMenu();
      case 'AC':
        return this.clearEntry();
      case 'DEL':
        return shift ? (this.insert = !this.insert) : this.deleteToken();
      case 'EXE':
        if (shift && this.mode === 'CMPLX') return this.toggleReIm();
        return this.execute();
      case 'PROG':
        return shift ? this.exitContext() : this.openProgram();
      case 'FMLA':
        return shift ? this.formulaLook() : this.openFormula();
      case 'UP': case 'DOWN': case 'LEFT': case 'RIGHT':
        return this.cursorKey(id);
      case 'RCL':
        this.pending = shift ? 'sto' : 'rcl';
        return;
      case 'N7':
        if (shift) return this.openConstMenu(0);
        break;
      case 'N9':
        if (shift) return this.openClrMenu();
        break;
      case 'N3':
        if (shift && this.mode === 'PRGM') return this.openPCmd(0);
        break;
      case 'N1':
        if (shift && (this.mode === 'SD' || this.mode === 'REG')) return this.openSSum(0);
        break;
      case 'N2':
        if (shift && (this.mode === 'SD' || this.mode === 'REG')) return this.openSVar();
        break;
      case 'ANS':
        if (shift) return this.openDrgMenu();
        break;
      case 'RECIP':
        if (!shift && this.mode === 'BASE') return this.openLogicMenu(0);
        break;
      case 'ABC':
        // a b/c toggles a displayed result between decimal and fraction;
        // SHIFT (d/c) swaps mixed and improper form.
        if (shift) return this.toggleImproper();
        if (!alpha && this.screen === 'result') return this.toggleFraction();
        break;
      case 'DMS':
        if (!alpha && !shift && this.screen === 'result') return this.toggleDms();
        break;
      case 'ENG':
        if (!alpha) return this.engShift(shift ? -1 : 1);
        break;
      case 'MPLUS':
        if (this.mode === 'SD' || this.mode === 'REG') {
          if (alpha) break;
          return shift ? this.statDelete() : this.statEnter();
        }
        if (!alpha) return this.memoryAdd(shift ? -1 : 1);
        break;
      case 'HYP':
        if (!alpha) { this.hyp = shift ? 2 : 1; return; }
        break;
      default:
        break;
    }

    const t = this.tokenFor(id, shift, alpha);
    if (t) this.insertToken(t);
  }

  // ==========================================================================
  // token production
  tokenFor(id, shift, alpha) {
    const inBase = this.mode === 'BASE';

    if (alpha && VAR_KEYS[id]) return tok('var' + VAR_KEYS[id]);
    if (alpha && id === 'LN') return tok('napier');
    if (alpha && id === 'ENG') return this.mode === 'CMPLX' ? tok('imag') : null;

    if (inBase && HEX_KEYS[id] && !shift && !alpha) {
      if (this.activeBase() !== 16) return null;
      return tok('hex' + HEX_KEYS[id]);
    }
    if (inBase && !shift) {
      if (id === 'SQR') { this.base = 10; this.convertResult(); return null; }
      if (id === 'POW') { this.base = 16; this.convertResult(); return null; }
      if (id === 'LOG') { this.base = 2; this.convertResult(); return null; }
      if (id === 'LN') { this.base = 8; this.convertResult(); return null; }
    }

    const digits = {
      N0: '0', N1: '1', N2: '2', N3: '3', N4: '4',
      N5: '5', N6: '6', N7: '7', N8: '8', N9: '9', DOT: '.'
    };
    if (!shift && digits[id]) {
      if (inBase) {
        if (id === 'DOT') return null;
        const b = this.activeBase();
        const d = '0123456789'.indexOf(digits[id]);
        if (d < 0 || d >= b) return null;
      }
      return tok(digits[id]);
    }

    const cm = this.mode === 'CMPLX';
    const st = this.mode === 'SD' || this.mode === 'REG';

    const table = {
      RECIP: [tok('recip'), tok('fact')],
      CUBE: [tok('cube'), tok('cbrt')],
      ABC: [tok('frac'), null],
      SQRT: [tok('sqrt'), null],
      SQR: [tok('sqr'), null],
      POW: [tok('pow'), tok('xroot')],
      LOG: [tok('log'), tok('exp10')],
      LN: [tok('ln'), tok('expe')],
      NEG: [tok('neg'), cm ? tok('angle') : null],
      DMS: [tok('dms'), null],
      SIN: [this.trig('sin'), this.trig('asin')],
      COS: [this.trig('cos'), this.trig('acos')],
      TAN: [this.trig('tan'), this.trig('atan')],
      LPAR: [tok('('), cm ? tok('arg') : tok('pct')],
      RPAR: [tok(')'), tok('Abs')],
      COMMA: [tok(','), cm ? tok('Conjg') : (st ? tok(';') : tok(':'))],
      MUL: [tok('mul'), tok('nPr')],
      DIV: [tok('div'), tok('nCr')],
      ADD: [tok('add'), cm ? tok('toPolar') : tok('Pol')],
      SUB: [tok('sub'), cm ? tok('toRect') : tok('Rec')],
      EXP: [tok('EXP'), tok('pi')],
      ANS: [tok('Ans'), null],
      N0: [null, tok('Rnd')],
      DOT: [null, tok('Ran')]
    };
    const pair = table[id];
    if (!pair) return null;
    return shift ? pair[1] : pair[0];
  }

  // Which base the digit being typed belongs to: the default number base,
  // unless the current literal was opened with a d / h / b / o tag.
  activeBase() {
    let i = this.cursor - 1;
    while (i >= 0 && this.tokens[i].k === K.DIGIT) i--;
    if (i >= 0 && this.tokens[i].k === K.PRE && this.tokens[i].base) return this.tokens[i].base;
    return this.base;
  }

  trig(base) {
    const h = this.hyp;
    this.hypUsed = true;
    if (h === 0) return tok(base);
    const map = {
      sin: ['sinh', 'asinh'], cos: ['cosh', 'acosh'], tan: ['tanh', 'atanh'],
      asin: ['sinh', 'asinh'], acos: ['cosh', 'acosh'], atan: ['tanh', 'atanh']
    };
    return tok(map[base][h - 1]);
  }

  insertToken(t) {
    // While the program editor is open every token goes into the program.
    if (this.prog && this.prog.stage === 'edit') return this.progInsert(t);
    if (this.screen === 'result') this.startFromResult(t);
    // The input area is a fixed 99 bytes. Once full, further key operations are
    // ignored; Stack ERROR belongs to evaluation-stack overflow, not typing.
    if (bytesOf(this.tokens) + (t.b || 1) > INPUT_BYTES) return;
    if (this.insert || this.cursor >= this.tokens.length) {
      this.tokens.splice(this.cursor, 0, t);
    } else {
      this.tokens.splice(this.cursor, 1, t);
    }
    this.cursor++;
    this.hyp = 0;
    this.screen = 'input';
    this.histIndex = -1;
  }

  // A new operator typed straight after a result silently takes Ans as its
  // left-hand side, exactly like the machine does.
  startFromResult(t) {
    const takesLeft = t.k === K.INFIX || t.k === K.POST || t.k === K.POW ||
      t.k === K.FRAC || t.k === K.EST || t.k === K.CONV;
    this.tokens = [];
    this.cursor = 0;
    if (takesLeft) { this.tokens.push(tok('Ans')); this.cursor = 1; }
    this.result = null;
  }

  deleteToken() {
    if (this.screen === 'result') { this.screen = 'input'; return; }
    if (this.insert) {
      if (this.cursor > 0) { this.tokens.splice(this.cursor - 1, 1); this.cursor--; }
    } else if (this.cursor < this.tokens.length) {
      this.tokens.splice(this.cursor, 1);
    }
  }

  clearEntry() {
    this.tokens = [];
    this.cursor = 0;
    this.result = null;
    this.screen = 'input';
    this.histIndex = -1;
    this.hyp = 0;
    this.message = null;
  }

  cursorKey(id) {
    if (this.screen === 'result' && (id === 'LEFT' || id === 'RIGHT')) {
      this.screen = 'input';
      this.cursor = id === 'LEFT' ? this.tokens.length : 0;
      return;
    }
    if (id === 'LEFT') { if (this.cursor > 0) this.cursor--; return; }
    if (id === 'RIGHT') { if (this.cursor < this.tokens.length) this.cursor++; return; }
    if (id === 'UP') return this.historyUp();
    if (id === 'DOWN') return this.historyDown();
  }

  historyUp() {
    if ((this.mode === 'SD' || this.mode === 'REG') && this.stat.count && !this.tokens.length) {
      return this.openStatBrowse(this.stat.count - 1);
    }
    if (!this.history.length) return;
    if (this.histIndex < 0) this.histIndex = this.history.length - 1;
    else if (this.histIndex > 0) this.histIndex--;
    this.loadHistory();
  }

  historyDown() {
    if ((this.mode === 'SD' || this.mode === 'REG') && this.stat.count && !this.tokens.length) {
      return this.openStatBrowse(0);
    }
    if (this.histIndex < 0) return;
    if (this.histIndex < this.history.length - 1) this.histIndex++;
    else { this.histIndex = -1; this.clearEntry(); return; }
    this.loadHistory();
  }

  loadHistory() {
    const h = this.history[this.histIndex];
    this.tokens = h.tokens.map((t) => Object.assign({}, t));
    this.cursor = this.tokens.length;
    this.result = h.result;
    this.screen = 'result';
  }

  // ==========================================================================
  // execution
  execute() {
    if (this.mode === 'PRGM' && this.prog) return this.progKey('EXE', false, false);
    if (!this.tokens.length) {
      if (this.result) return;
      return;
    }
    // A lone parenthetical function executed straight after a result takes
    // Ans as its argument.
    let toks = this.tokens;
    if (toks.length === 1 && toks[0].k === K.FN && this.ans) {
      toks = toks.concat([tok('Ans')]);
    }
    const ast = parse(toks, this.ctx());
    const z = evaluate(ast, this.ctx());
    this.ans = C(z.re, z.im);
    this.result = {
      z: C(z.re, z.im),
      view: this.naturalView(),
      engShift: 0,
      part: 0,
      improper: this.setup.frac === 'd/c',
      forceFormat: z.forceFormat || null
    };
    if (this.result.view === 'frac' && !formatFraction(z.re, this.result.improper)) {
      this.result.view = 'normal';
    }
    if (this.result.view === 'dms' && !formatDms(z.re)) this.result.view = 'normal';
    this.history.push({ tokens: this.tokens.map((t) => Object.assign({}, t)), result: this.result });
    if (this.history.length > 30) this.history.shift();
    this.histIndex = -1;
    this.screen = 'result';
  }

  // Sexagesimal input yields a sexagesimal result; a calculation written with
  // fraction separators and no decimal point yields a fraction.
  naturalView() {
    if (this.mode === 'BASE') return 'normal';
    let hasFrac = false, hasDot = false, hasDms = false;
    for (const t of this.tokens) {
      if (t.k === K.FRAC) hasFrac = true;
      if (t.id === '.') hasDot = true;
      if (t.id === 'dms') hasDms = true;
    }
    if (hasDms) return 'dms';
    if (hasFrac && !hasDot) return 'frac';
    return 'normal';
  }

  storeTo(v) {
    let value;
    if (this.screen === 'result' && this.result) value = this.result.z.re;
    else if (this.tokens.length) {
      value = evaluate(parse(this.tokens, this.ctx()), this.ctx()).re;
    } else value = this.ans.re;
    this.vars[v] = r15(value);
    this.ans = C(this.vars[v]);
    this.result = { z: C(this.vars[v]), view: 'normal', engShift: 0, part: 0 };
    this.screen = 'result';
  }

  recallFrom(v) {
    const value = this.vars[v] || 0;
    this.ans = C(value);
    this.result = { z: C(value), view: 'normal', engShift: 0, part: 0 };
    this.tokens = [];
    this.cursor = 0;
    this.screen = 'result';
  }

  memoryAdd(sign) {
    let value;
    if (this.screen === 'result' && this.result) value = this.result.z.re;
    else if (this.tokens.length) value = evaluate(parse(this.tokens, this.ctx()), this.ctx()).re;
    else value = this.ans.re;
    const next = this.vars.M + sign * value;
    if (!Number.isFinite(next) || Math.abs(next) >= 1e100) throw new CalcError('Math');
    this.vars.M = r15(next);
    this.result = { z: C(value), view: 'normal', engShift: 0, part: 0 };
    this.screen = 'result';
  }

  // ==========================================================================
  // result presentation toggles
  toggleFraction() {
    if (!this.result) return;
    if (this.result.view === 'frac') { this.result.view = 'normal'; return; }
    this.result.improper = this.setup.frac === 'd/c';
    if (formatFraction(this.result.z.re, this.result.improper)) this.result.view = 'frac';
  }

  toggleImproper() {
    if (this.screen !== 'result' || !this.result) return;
    const next = this.result.view === 'frac' ? !this.result.improper : this.setup.frac !== 'd/c';
    if (formatFraction(this.result.z.re, next)) {
      this.result.view = 'frac';
      this.result.improper = next;
    }
  }

  toggleDms() {
    if (this.screen !== 'result' || !this.result) return;
    this.result.view = this.result.view === 'dms' ? 'normal' : 'dms';
  }

  // ENG steps the exponent down in threes, SHIFT ENG steps it up.  The first
  // press only normalises, unless the value is already a valid engineering
  // form (mantissa 1 to 999 at exponent 0), in which case it shifts at once.
  engShift(dir) {
    if (this.screen !== 'result' || !this.result) return;
    const x = this.result.z.re;
    if (x === 0) return;
    if (this.result.view !== 'eng') {
      const nat = Math.floor(Math.floor(Math.log10(Math.abs(x))) / 3) * 3;
      this.result.view = 'eng';
      this.result.engExp = nat === 0 ? -3 * dir : nat;
      return;
    }
    this.result.engExp -= 3 * dir;
  }

  toggleReIm() {
    if (!this.result) return;
    this.result.part = this.result.part ? 0 : 1;
  }

  convertResult() {
    // base change while a result is displayed re-renders it in the new base
    if (this.screen === 'result' && this.result) this.result.view = 'normal';
    this.tokens = [];
    this.cursor = 0;
  }

  // ==========================================================================
  // menus
  openMenu(spec) {
    this.menuReturn = this.screen === 'menu' ? this.menuReturn : this.screen;
    this.menu = spec;
    this.screen = 'menu';
  }

  closeMenu() {
    this.menu = null;
    const back = this.menuReturn;
    this.screen = (back && back !== 'menu') ? back : (this.result ? 'result' : 'input');
  }

  menuKey(id, shift) {
    const m = this.menu;
    if (id === 'AC' || (shift && id === 'PROG')) {
      this.closeMenu();
      return;
    }
    if (id === 'LEFT') { m.page = (m.page - 1 + m.pages.length) % m.pages.length; return; }
    if (id === 'RIGHT') { m.page = (m.page + 1) % m.pages.length; return; }
    if (id === 'DOWN' && m.scroll) { m.page = (m.page + 1) % m.pages.length; return; }
    if (id === 'UP' && m.scroll) { m.page = (m.page - 1 + m.pages.length) % m.pages.length; return; }
    // Fix / Sci ask for a digit rather than a menu position.
    if (m.anyDigit) {
      const d = { N0: 0, N1: 1, N2: 2, N3: 3, N4: 4, N5: 5, N6: 6, N7: 7, N8: 8, N9: 9 }[id];
      if (d === undefined) return;
      return m.anyDigit(this, d);
    }
    const n = { N1: 1, N2: 2, N3: 3, N4: 4, N5: 5, N6: 6 }[id];
    if (!n) return;
    const page = m.pages[m.page];
    // Some menus (the mode menu) accept every number on every screen.
    const item = (m.keyMap && m.keyMap[n]) || page.items[n - 1];
    if (!item) return;
    this.closeMenu();
    item.run(this);
  }

  openModeMenu() {
    const item = (name) => ({ label: name, run: (s) => s.setMode(name) });
    const keyMap = {};
    MODES.forEach((name, i) => { keyMap[i + 1] = item(name); });
    this.openMenu({
      page: 0,
      keyMap,
      pages: [
        { items: MODES.slice(0, 3).map(item) },
        { items: MODES.slice(3).map(item) }
      ],
      numbersFrom: (p) => (p === 0 ? 1 : 4)
    });
  }

  setMode(m) {
    if (this.prog && this.prog.stage === 'edit') this.saveProgram();
    this.prog = null;
    this.formula = null;
    this.statBrowse = null;
    if (m === this.mode && m !== 'REG') { this.clearEntry(); return; }
    this.mode = m;
    this.stat.clear();
    this.fvars = {};
    this.clearEntry();
    this.history = [];
    if (m === 'BASE') this.base = 10;
    if (m === 'REG') this.openRegTypeMenu();
    if (m === 'PRGM') this.openProgramRoot();
  }

  openSetup(page) {
    const S = (fn) => (s) => { fn(s.setup, s); s.clearEntry(); };
    this.openMenu({
      page,
      pages: [
        {
          items: [
            { label: 'Deg', run: S((c) => (c.angle = 'Deg')) },
            { label: 'Rad', run: S((c) => (c.angle = 'Rad')) },
            { label: 'Gra', run: S((c) => (c.angle = 'Gra')) }
          ]
        },
        {
          items: [
            { label: 'Fix', run: (s) => s.openDigitMenu('Fix') },
            { label: 'Sci', run: (s) => s.openDigitMenu('Sci') },
            { label: 'Norm', run: (s) => s.openNormMenu() }
          ]
        },
        {
          items: [
            { label: 'ab/c', run: S((c) => (c.frac = 'ab/c')) },
            { label: 'd/c', run: S((c) => (c.frac = 'd/c')) }
          ]
        },
        {
          items: [
            { label: 'a+bi', run: S((c) => (c.cplx = 'a+bi')) },
            { label: 'r∠θ', run: S((c) => (c.cplx = 'r∠θ')) }
          ]
        },
        {
          items: [
            { label: 'FreqOn', run: S((c, s) => { c.freq = true; s.stat.clear(); }) },
            { label: 'FreqOff', run: S((c, s) => { c.freq = false; s.stat.clear(); }) }
          ]
        },
        { items: [{ label: 'Contrast', run: (s) => s.openContrast() }] }
      ]
    });
  }

  openDigitMenu(kind) {
    this.openMenu({
      page: 0,
      pages: [{ items: [], title: kind + ' 0~9?' }],
      anyDigit: (s, d) => {
        s.setup.disp = kind;
        s.setup.digits = kind === 'Sci' && d === 0 ? 10 : d;
        s.menu = null;
        s.clearEntry();
      }
    });
  }

  openNormMenu() {
    this.openMenu({
      page: 0,
      pages: [{
        title: 'Norm 1~2?',
        items: [
          { label: 'Norm1', run: (s) => { s.setup.disp = 'Norm'; s.setup.norm = 1; s.clearEntry(); } },
          { label: 'Norm2', run: (s) => { s.setup.disp = 'Norm'; s.setup.norm = 2; s.clearEntry(); } }
        ]
      }]
    });
  }

  openContrast() {
    this.screen = 'contrast';
  }

  openClrMenu() {
    const statMode = this.mode === 'SD' || this.mode === 'REG';
    this.openMenu({
      page: 0,
      pages: [{
        items: [
          statMode
            ? { label: 'Stat', run: (s) => { s.stat.clear(); s.clearEntry(); } }
            : {
              label: 'Mem',
              run: (s) => {
                for (const k of Object.keys(s.vars)) s.vars[k] = 0;
                s.ans = C(0); s.fvars = {}; s.clearEntry();
              }
            },
          {
            label: 'Setup',
            run: (s) => {
              s.setup = {
                angle: 'Deg', disp: 'Norm', digits: 0, norm: 1,
                frac: 'ab/c', cplx: 'a+bi', freq: true, contrast: s.setup.contrast
              };
              s.mode = 'COMP';
              s.clearEntry();
            }
          },
          {
            label: 'All',
            run: (s) => {
              const contrast = s.setup.contrast;
              s.setup = {
                angle: 'Deg', disp: 'Norm', digits: 0, norm: 1,
                frac: 'ab/c', cplx: 'a+bi', freq: true, contrast
              };
              s.mode = 'COMP';
              s.base = 10;
              for (const k of Object.keys(s.vars)) s.vars[k] = 0;
              s.ans = C(0);
              s.fvars = {};
              s.stat.clear();
              s.programs = [null, null, null, null];
              s.reset();
            }
          }
        ]
      }]
    });
  }

  openDrgMenu() {
    const push = (t) => (s) => s.insertToken(tok(t));
    this.openMenu({
      page: 0,
      pages: [{
        items: [
          { label: 'D', run: push('degU') },
          { label: 'R', run: push('radU') },
          { label: 'G', run: push('graU') }
        ]
      }]
    });
  }

  openConstMenu(page) {
    const pages = CONST_PAGES.map((p) => ({
      items: p.map((c) => ({
        label: c.sym,
        run: (s) => s.insertToken(tok('CONST_' + c.key))
      }))
    }));
    this.openMenu({ page, pages });
  }

  openLogicMenu(page) {
    const push = (t) => (s) => s.insertToken(tok(t));
    this.openMenu({
      page,
      pages: [
        { items: [{ label: 'and', run: push('and') }, { label: 'or', run: push('or') }, { label: 'xnor', run: push('xnor') }] },
        { items: [{ label: 'xor', run: push('xor') }, { label: 'Not', run: push('Not') }, { label: 'Neg', run: push('Neg') }] },
        {
          items: [
            { label: 'd', run: push('baseD') }, { label: 'h', run: push('baseH') },
            { label: 'b', run: push('baseB') }, { label: 'o', run: push('baseO') }
          ]
        }
      ]
    });
  }

  openSSum(page) {
    const push = (t) => (s) => s.insertToken(tok(t));
    const pages = this.mode === 'SD'
      ? [{ items: [{ label: 'Σx²', run: push('Sx2') }, { label: 'Σx', run: push('Sx') }, { label: 'n', run: push('Sn') }] }]
      : [
        { items: [{ label: 'Σx²', run: push('Sx2') }, { label: 'Σx', run: push('Sx') }, { label: 'n', run: push('Sn') }] },
        { items: [{ label: 'Σy²', run: push('Sy2') }, { label: 'Σy', run: push('Sy') }, { label: 'Σxy', run: push('Sxy') }] },
        { items: [{ label: 'Σx²y', run: push('Sx2y') }, { label: 'Σx³', run: push('Sx3') }, { label: 'Σx⁴', run: push('Sx4') }] }
      ];
    this.openMenu({ page, pages });
  }

  openSVar() {
    const push = (t) => (s) => s.insertToken(tok(t));
    if (this.mode === 'SD') {
      this.openMenu({
        page: 0,
        pages: [
          { items: [{ label: 'x̄', run: push('xbar') }, { label: 'xσn', run: push('xsn') }, { label: 'xσn-1', run: push('xsn1') }] },
          { items: [{ label: 'minX', run: push('minX') }, { label: 'maxX', run: push('maxX') }] }
        ]
      });
      return;
    }
    this.openMenu({
      page: 0,
      pages: [{
        items: [
          { label: 'VAR', run: (s) => s.openRegVar(0) },
          { label: 'MINMAX', run: (s) => s.openRegMinMax(0) },
          { label: 'TYPE', run: (s) => s.openRegTypeMenu() }
        ]
      }]
    });
  }

  openRegVar(page) {
    const push = (t) => (s) => s.insertToken(tok(t));
    const quad = this.stat.type === 'Quad';
    this.openMenu({
      page,
      pages: [
        { items: [{ label: 'x̄', run: push('xbar') }, { label: 'xσn', run: push('xsn') }, { label: 'xσn-1', run: push('xsn1') }] },
        { items: [{ label: 'ȳ', run: push('ybar') }, { label: 'yσn', run: push('ysn') }, { label: 'yσn-1', run: push('ysn1') }] },
        quad
          ? { items: [{ label: 'a', run: push('regA') }, { label: 'b', run: push('regB') }, { label: 'c', run: push('regC') }] }
          : { items: [{ label: 'a', run: push('regA') }, { label: 'b', run: push('regB') }, { label: 'r', run: push('regR') }] },
        quad
          ? { items: [{ label: 'x̂1', run: push('estX1') }, { label: 'x̂2', run: push('estX2') }, { label: 'ŷ', run: push('estY') }] }
          : { items: [{ label: 'x̂', run: push('estX') }, { label: 'ŷ', run: push('estY') }] }
      ]
    });
  }

  openRegMinMax(page) {
    const push = (t) => (s) => s.insertToken(tok(t));
    this.openMenu({
      page,
      pages: [
        { items: [{ label: 'minX', run: push('minX') }, { label: 'maxX', run: push('maxX') }] },
        { items: [{ label: 'minY', run: push('minY') }, { label: 'maxY', run: push('maxY') }] }
      ]
    });
  }

  openRegTypeMenu() {
    const set = (t) => (s) => { s.stat.type = t; s.clearEntry(); };
    this.openMenu({
      page: 0,
      pages: [
        {
          items: [
            { label: 'Lin', run: set('Lin') }, { label: 'Log', run: set('Log') },
            { label: 'Exp', run: set('Exp') }, { label: 'Pwr', run: set('Pwr') }
          ]
        },
        {
          items: [
            { label: 'Inv', run: set('Inv') }, { label: 'Quad', run: set('Quad') },
            { label: 'AB-Exp', run: set('AB-Exp') }
          ]
        }
      ]
    });
  }

  openPCmd(page) {
    const push = (t) => (s) => s.insertToken(tok(t));
    this.openMenu({
      page,
      pages: [
        { items: [{ label: '?', run: push('pIn') }, { label: '→', run: push('pAsg') }, { label: ':', run: push(':') }, { label: '◢', run: push('pOut') }] },
        { items: [{ label: 'Goto', run: push('pGoto') }, { label: 'Lbl', run: push('pLbl') }, { label: '⇒', run: push('pJump') }] },
        { items: [{ label: '=', run: push('eq') }, { label: '≠', run: push('ne') }, { label: '>', run: push('gt') }, { label: '<', run: push('lt') }] },
        { items: [{ label: '≥', run: push('ge') }, { label: '≤', run: push('le') }] },
        { items: [{ label: 'If', run: push('pIf') }, { label: 'Then', run: push('pThen') }, { label: 'Else', run: push('pElse') }, { label: 'IfEnd', run: push('pIfEnd') }] },
        { items: [{ label: 'For', run: push('pFor') }, { label: 'To', run: push('pTo') }, { label: 'Step', run: push('pStep') }, { label: 'Next', run: push('pNext') }] },
        { items: [{ label: 'While', run: push('pWhile') }, { label: 'WhlEnd', run: push('pWhileEnd') }, { label: 'Break', run: push('pBreak') }] },
        { items: [{ label: 'Deg', run: push('pDeg') }, { label: 'Rad', run: push('pRad') }, { label: 'Gra', run: push('pGra') }] },
        { items: [{ label: 'Fix', run: push('pFix') }, { label: 'Sci', run: push('pSci') }, { label: 'Norm', run: push('pNorm') }] },
        { items: [{ label: 'FreqOn', run: push('pFreqOn') }, { label: 'FreqOff', run: push('pFreqOff') }] },
        { items: [{ label: 'ClrMem', run: push('pClrMemory') }, { label: 'ClrStat', run: push('pClrStat') }] },
        { items: [{ label: 'M+', run: push('pMplus') }, { label: 'M-', run: push('pMminus') }, { label: 'DT', run: push('pDT') }] },
        { items: [{ label: 'Dec', run: push('pDec') }, { label: 'Hex', run: push('pHex') }, { label: 'Bin', run: push('pBin') }, { label: 'Oct', run: push('pOct') }] }
      ]
    });
  }

  exitContext() {
    this.menu = null;
    this.formula = null;
    this.statBrowse = null;
    this.screen = 'input';
  }

  // ==========================================================================
  // statistics entry and browsing
  statEnter() {
    const parts = this.splitStatInput();
    if (!parts) { this.raise('Syntax'); return; }
    const limit = this.mode === 'SD'
      ? (this.setup.freq ? 40 : 80)
      : (this.setup.freq ? 26 : 40);
    if (this.stat.count >= limit) throw new CalcError('Data Full');
    this.stat.add(parts.x, parts.y, parts.f);
    this.result = { z: C(parts.x), view: 'normal', engShift: 0, part: 0 };
    this.ans = C(parts.x);
    this.tokens = [];
    this.cursor = 0;
    this.message = { l1: 'Line   =', l2: String(this.stat.count) };
    this.screen = 'statmsg';
  }

  splitStatInput() {
    if (!this.tokens.length) return null;
    const groups = [[]];
    let seps = [];
    for (const t of this.tokens) {
      if (t.k === K.SEP && (t.s === ',' || t.s === ';')) {
        seps.push(t.s);
        groups.push([]);
      } else groups[groups.length - 1].push(t);
    }
    const val = (g) => {
      if (!g.length) return null;
      return evaluate(parse(g, this.ctx()), this.ctx()).re;
    };
    const paired = this.mode === 'REG';
    let x = 0, y = 0, f = 1;
    if (!paired) {
      x = val(groups[0]);
      if (seps.includes(';')) f = val(groups[1]);
    } else {
      x = val(groups[0]);
      y = groups.length > 1 ? val(groups[1]) : 0;
      if (seps.includes(';')) f = val(groups[groups.length - 1]);
      if (groups.length < 2) return null;
    }
    if (x === null || y === null) return null;
    if (!this.setup.freq) f = 1;
    return { x, y, f };
  }

  openStatBrowse(index) {
    this.statBrowse = { index: Math.max(0, Math.min(index, this.stat.count - 1)), field: 0, edit: [] };
    this.screen = 'stat';
  }

  statFields() {
    const paired = this.mode === 'REG';
    const f = [];
    f.push('x');
    if (paired) f.push('y');
    if (this.setup.freq) f.push('Freq');
    return f;
  }

  statKey(id, shift) {
    const b = this.statBrowse;
    const fields = this.statFields();
    if (id === 'AC') { this.statBrowse = null; this.clearEntry(); return; }
    if (id === 'DOWN') {
      b.edit = [];
      b.field++;
      if (b.field >= fields.length) { b.field = 0; b.index++; }
      if (b.index >= this.stat.count) { this.statBrowse = null; this.clearEntry(); }
      return;
    }
    if (id === 'UP') {
      b.edit = [];
      b.field--;
      if (b.field < 0) { b.field = fields.length - 1; b.index--; }
      if (b.index < 0) { this.statBrowse = null; this.clearEntry(); }
      return;
    }
    if (id === 'MPLUS' && shift) {
      this.stat.removeAt(b.index);
      if (!this.stat.count) { this.statBrowse = null; this.clearEntry(); return; }
      b.index = Math.min(b.index, this.stat.count - 1);
      b.edit = [];
      this.message = { l1: 'Line   =', l2: String(b.index + 1) };
      return;
    }
    if (id === 'EXE') {
      if (b.edit.length) {
        const v = evaluate(parse(b.edit, this.ctx()), this.ctx()).re;
        const d = this.stat.data[b.index];
        const key = fields[b.field] === 'Freq' ? 'f' : fields[b.field];
        d[key] = key === 'f' ? Math.max(1, Math.round(v)) : v;
        b.edit = [];
      }
      return;
    }
    if (id === 'DEL') { b.edit.pop(); return; }
    const t = this.tokenFor(id, shift, false);
    if (t && (t.k === K.DIGIT || t.k === K.PRE || t.k === K.CONST)) b.edit.push(t);
  }

  statDelete() {
    if (this.stat.count) {
      this.stat.removeAt(this.stat.count - 1);
      this.message = { l1: 'Line   =', l2: String(this.stat.count) };
      this.screen = 'statmsg';
    }
  }

  // ==========================================================================
  // built-in formulas
  openFormula() {
    this.formula = { stage: 'pick', digits: '', index: 0, values: {}, results: null, varIdx: 0, edit: [] };
    this.screen = 'formula';
  }

  formulaLook() {
    if (this.screen === 'formula' && this.formula && this.formula.stage === 'vars') {
      this.formula.look = !this.formula.look;
      this.formula.lookScroll = 0;
    }
  }

  formulaKey(id, shift) {
    const f = this.formula;
    if (id === 'AC' || (shift && id === 'PROG')) { this.formula = null; this.clearEntry(); return; }
    if (shift && id === 'FMLA') return this.formulaLook();

    if (f.stage === 'pick') {
      const d = { N0: '0', N1: '1', N2: '2', N3: '3', N4: '4', N5: '5', N6: '6', N7: '7', N8: '8', N9: '9' }[id];
      if (d) {
        f.digits += d;
        if (f.digits.length === 2) {
          const no = Number(f.digits);
          if (no < 1 || no > 23) { f.digits = ''; this.raise('Syntax'); return; }
          f.index = no - 1;
          f.digits = '';
        }
        return;
      }
      if (id === 'DOWN') { f.index = (f.index + 1) % FORMULAS.length; return; }
      if (id === 'UP') { f.index = (f.index - 1 + FORMULAS.length) % FORMULAS.length; return; }
      if (id === 'EXE') { this.formulaStart(); return; }
      return;
    }

    if (f.stage === 'vars') {
      if (f.look) {
        if (id === 'RIGHT') f.lookScroll++;
        if (id === 'LEFT') f.lookScroll = Math.max(0, f.lookScroll - 1);
        if (id === 'EXE' || id === 'AC') f.look = false;
        return;
      }
      if (id === 'DEL') { f.edit.pop(); return; }
      if (id === 'EXE') {
        const spec = FORMULAS[f.index];
        const name = spec.vars[f.varIdx];
        if (f.edit.length) {
          f.values[name] = evaluate(parse(f.edit, this.ctx()), this.ctx()).re;
        } else if (f.values[name] === undefined) {
          f.values[name] = this.fvars[name] || 0;
        }
        this.fvars[name] = f.values[name];
        f.edit = [];
        f.varIdx++;
        if (f.varIdx >= spec.vars.length) this.formulaRun();
        return;
      }
      const t = this.tokenFor(id, shift, false);
      if (t && (t.k === K.DIGIT || t.k === K.PRE || t.k === K.CONST || t.k === K.INFIX)) f.edit.push(t);
      return;
    }

    if (f.stage === 'result') {
      if (id === 'EXE') { this.formulaStart(); return; }
      if (id === 'DOWN' || id === 'UP') {
        const spec = FORMULAS[f.index];
        if (spec.extra) f.showExtra = !f.showExtra;
        return;
      }
    }
  }

  formulaStart() {
    const f = this.formula;
    const spec = FORMULAS[f.index];
    f.stage = 'vars';
    f.varIdx = 0;
    f.edit = [];
    f.values = {};
    for (const v of spec.vars) f.values[v] = this.fvars[v] !== undefined ? this.fvars[v] : 0;
    f.results = null;
    f.showExtra = false;
  }

  formulaRun() {
    const f = this.formula;
    const spec = FORMULAS[f.index];
    const deg = (x) => x * { Deg: Math.PI / 180, Rad: 1, Gra: Math.PI / 200 }[this.setup.angle];
    let out;
    try {
      out = spec.run(f.values, deg);
      if (Object.values(out).some((x) => !Number.isFinite(x) || Math.abs(x) >= 1e100)) {
        throw new CalcError('Math');
      }
    } catch (e) {
      this.formula = null;
      this.raise('Math');
      return;
    }
    for (const [k, v] of Object.entries(out)) this.fvars[k] = r15(v);
    f.results = out;
    f.stage = 'result';
    const first = spec.result;
    this.ans = C(r15(out[first] !== undefined ? out[first] : Object.values(out)[0]));
  }

  // ==========================================================================
  // program mode
  openProgramRoot() {
    this.prog = { stage: 'root' };
    this.screen = 'prog';
  }

  openProgram() {
    if (this.mode === 'PRGM') { this.openProgramRoot(); return; }
    this.prog = { stage: 'runpick' };
    this.screen = 'prog';
  }

  progKey(id, shift, alpha) {
    const p = this.prog;
    if (!p) return;
    const nkey = { N1: 0, N2: 1, N3: 2, N4: 3 }[id];

    if (id === 'AC' || (shift && id === 'PROG')) {
      if (p.stage === 'edit') { this.saveProgram(); }
      this.prog = null;
      this.clearEntry();
      if (this.mode === 'PRGM') this.openProgramRoot();
      return;
    }

    if (p.stage === 'root') {
      if (id === 'N1') { this.prog = { stage: 'editpick' }; return; }
      if (id === 'N2') { this.prog = { stage: 'runpick' }; return; }
      if (id === 'N3') { this.prog = { stage: 'delpick' }; return; }
      return;
    }

    if (p.stage === 'editpick') {
      if (nkey === undefined) return;
      if (!this.programs[nkey]) { this.prog = { stage: 'newmode', slot: nkey, page: 0 }; return; }
      this.prog = { stage: 'edit', slot: nkey, tokens: this.programs[nkey].tokens.slice(), cursor: 0 };
      return;
    }

    if (p.stage === 'newmode') {
      if (id === 'LEFT' || id === 'RIGHT') { p.page = p.page ? 0 : 1; return; }
      const runMode = p.page === 0
        ? { N1: 'COMP', N2: 'CMPLX' }[id]
        : { N3: 'BASE', N4: 'SD', N5: 'REG' }[id];
      if (!runMode) return;
      this.programs[p.slot] = new Program(runMode, []);
      this.prog = { stage: 'edit', slot: p.slot, tokens: [], cursor: 0 };
      return;
    }

    if (p.stage === 'delpick') {
      if (nkey === undefined) return;
      this.programs[nkey] = null;
      return;
    }

    if (p.stage === 'runpick') {
      if (nkey === undefined) return;
      const prog = this.programs[nkey];
      if (!prog) return;
      this.runProgram(nkey);
      return;
    }

    if (p.stage === 'edit') return this.progEditKey(id, shift, alpha);
    if (p.stage === 'running') return this.progRunKey(id, shift, alpha);
  }

  progEditKey(id, shift, alpha) {
    const p = this.prog;
    if (id === 'LEFT') { p.cursor = Math.max(0, p.cursor - 1); return; }
    if (id === 'RIGHT') { p.cursor = Math.min(p.tokens.length, p.cursor + 1); return; }
    if (id === 'UP') { p.cursor = 0; return; }
    if (id === 'DOWN') { p.cursor = p.tokens.length; return; }
    if (id === 'DEL') {
      if (shift) { this.insert = !this.insert; return; }
      if (p.cursor > 0) { p.tokens.splice(p.cursor - 1, 1); p.cursor--; }
      return;
    }
    if (id === 'EXE') { p.tokens.splice(p.cursor, 0, tok(':')); p.cursor++; return; }
    if (shift && id === 'N3') return this.openPCmd(0);
    if (shift && id === 'N7') return this.openConstMenu(0);
    if (shift && id === 'ANS') return this.openDrgMenu();
    if (id === 'RCL') {
      // STO in a program writes the assignment arrow
      if (shift) this.progInsert(tok('pAsg'));
      return;
    }
    if (id === 'MPLUS' && !alpha) {
      const prog = this.programs[p.slot];
      // In a statistics program the M+ key writes DT, as it does live.
      if (prog && (prog.mode === 'SD' || prog.mode === 'REG')) {
        return this.progInsert(tok('pDT'));
      }
      return this.progInsert(tok(shift ? 'pMminus' : 'pMplus'));
    }
    const t = this.tokenFor(id, shift, alpha);
    if (t) this.progInsert(t);
  }

  progInsert(t) {
    const p = this.prog;
    if (PROGRAM_MEMORY - this.programBytes() - (t.b || 1) < 0) { this.raise('Memory'); return; }
    p.tokens.splice(p.cursor, 0, t);
    p.cursor++;
    this.hyp = 0;
    this.screen = 'prog';
  }

  programBytes() {
    let n = 0;
    for (const pr of this.programs) if (pr) n += bytesOf(pr.tokens);
    if (this.prog && this.prog.stage === 'edit') {
      n -= this.programs[this.prog.slot] ? bytesOf(this.programs[this.prog.slot].tokens) : 0;
      n += bytesOf(this.prog.tokens);
    }
    return n;
  }

  saveProgram() {
    const p = this.prog;
    if (p && p.stage === 'edit') {
      const existing = this.programs[p.slot];
      this.programs[p.slot] = new Program(existing ? existing.mode : 'COMP', p.tokens.slice());
    }
  }

  /** Serializable program state. An active editor is included on every autosave. */
  programSnapshot() {
    const slots = this.programs.map((program) => program
      ? { mode: program.mode, tokens: program.tokens.map((token) => token.id) }
      : null);
    if (this.prog?.stage === 'edit') {
      const stored = this.programs[this.prog.slot];
      slots[this.prog.slot] = {
        mode: stored?.mode || 'COMP',
        tokens: this.prog.tokens.map((token) => token.id)
      };
    }
    return { version: 1, updatedAt: Date.now(), slots };
  }

  restoreProgramSnapshot(snapshot) {
    const modes = new Set(['COMP', 'CMPLX', 'BASE', 'SD', 'REG']);
    if (!snapshot || snapshot.version !== 1 || !Array.isArray(snapshot.slots)) return false;
    const restored = [null, null, null, null];
    try {
      for (let i = 0; i < restored.length; i++) {
        const saved = snapshot.slots[i];
        if (!saved) continue;
        const mode = modes.has(saved.mode) ? saved.mode : 'COMP';
        restored[i] = new Program(mode, saved.tokens.map(tok));
      }
    } catch {
      return false;
    }
    this.programs = restored;
    return true;
  }

  setStudioProgram(slot, mode, tokenIds) {
    if (slot < 0 || slot > 3) throw new Error('invalid program slot');
    const tokens = tokenIds.map(tok);
    const otherBytes = this.programs.reduce((sum, program, index) =>
      sum + (index !== slot && program ? bytesOf(program.tokens) : 0), 0);
    if (otherBytes + bytesOf(tokens) > PROGRAM_MEMORY) throw new Error('program memory exceeded');
    this.programs[slot] = new Program(mode, tokens);
    if (this.prog?.stage === 'edit' && this.prog.slot === slot) {
      this.prog.tokens = tokens.slice();
      this.prog.cursor = Math.min(this.prog.cursor, tokens.length);
    }
  }

  clearStudioProgram(slot) {
    if (slot < 0 || slot > 3) return;
    this.programs[slot] = null;
    if (this.prog?.slot === slot) {
      this.prog = null;
      this.clearEntry();
    }
  }

  editProgramSlot(slot) {
    if (!this.programs[slot]) this.programs[slot] = new Program('COMP', []);
    this.mode = 'PRGM';
    this.prog = {
      stage: 'edit', slot,
      tokens: this.programs[slot].tokens.slice(),
      cursor: this.programs[slot].tokens.length
    };
    this.screen = 'prog';
  }

  runProgram(slot) {
    const prog = this.programs[slot];
    if (!prog) return;
    const savedMode = this.mode;
    this.mode = prog.mode;
    const run = prog.start(this);
    this.prog = { stage: 'running', slot, run, savedMode };
    this.stepProgram();
  }

  stepProgram() {
    const p = this.prog;
    if (!p || !p.run) return;
    let out;
    try {
      out = p.run.step();
    } catch (e) {
      this.mode = p.savedMode;
      this.prog = null;
      if (e instanceof CalcError) return this.raise(e.kind);
      if (e && e.mathError) return this.raise('Math');
      throw e;
    }
    if (out.done) {
      this.mode = p.savedMode;
      this.prog = null;
      this.result = out.value ? { z: out.value, view: 'normal', engShift: 0, part: 0 } : this.result;
      this.screen = this.result ? 'result' : 'input';
      return;
    }
    p.state = out;
    this.screen = 'prog';
  }

  progRunKey(id, shift, alpha) {
    const p = this.prog;
    const st = p.state;
    if (!st) return;
    if (st.kind === 'input') {
      if (id === 'EXE') {
        const v = st.edit && st.edit.length
          ? evaluate(parse(st.edit, this.ctx()), this.ctx()).re
          : (this.vars[st.varName] || 0);
        p.run.provide(v);
        return this.stepProgram();
      }
      if (id === 'DEL') { if (st.edit) st.edit.pop(); return; }
      st.edit = st.edit || [];
      const t = this.tokenFor(id, shift, alpha);
      if (t && bytesOf(st.edit) + (t.b || 1) <= INPUT_BYTES) st.edit.push(t);
      return;
    }
    if (st.kind === 'output') {
      if (id === 'EXE') { p.run.resume(); return this.stepProgram(); }
    }
  }

  // ==========================================================================
  // rendering
  view() {
    if (this.off) return { indicators: new Set(), line1: '', line2: '' };
    const ind = new Set();
    if (this.shift) ind.add('S');
    if (this.alpha) ind.add('A');
    if (this.vars.M) ind.add('M');
    if (this.pending === 'sto') ind.add('STO');
    if (this.pending === 'rcl') ind.add('RCL');
    if (this.mode === 'SD') ind.add('SD');
    if (this.mode === 'REG') ind.add('REG');
    if (this.mode === 'PRGM') ind.add('PRG');
    if (this.screen === 'formula') ind.add('FMLA');
    ind.add({ Deg: 'D', Rad: 'R', Gra: 'G' }[this.setup.angle]);
    if (this.setup.disp === 'Fix') ind.add('FIX');
    if (this.setup.disp === 'Sci') ind.add('SCI');
    if (this.mode === 'CMPLX' && this.result && !isReal(this.result.z)) ind.add('R⇔I');
    if (this.mode === 'CMPLX' && this.result && this.result.part === 1) ind.add('i');

    const lowInputMemory = this.screen === 'input' && INPUT_BYTES - bytesOf(this.tokens) <= 8;
    const base = {
      indicators: ind,
      cursor: -1,
      cursorKind: lowInputMemory ? 'full' : (this.insert ? 'insert' : 'overwrite')
    };

    if (this.screen === 'error') {
      const message = this.error === 'Data Full' ? this.error : this.error + ' ERROR';
      return Object.assign(base, { line1: message, line2: '' });
    }
    if (this.screen === 'contrast') {
      return Object.assign(base, { line1: 'LIGHT ▮▮▮▮ DARK', line2: '' });
    }
    if (this.screen === 'menu') return Object.assign(base, this.menuView());
    if (this.screen === 'statmsg') {
      return Object.assign(base, { line1: this.message.l1, line2: this.message.l2 });
    }
    if (this.screen === 'stat') return Object.assign(base, this.statView());
    if (this.screen === 'formula') return Object.assign(base, this.formulaView());
    if (this.screen === 'prog') return Object.assign(base, this.progView());

    // input / result
    const text = textOf(this.tokens);
    const win = this.window(text, this.cursorChar());
    const out = {
      line1: win.text,
      cursor: this.screen === 'input' ? win.cursor : -1,
      scrollLeft: win.left,
      scrollRight: win.right,
      histUp: this.history.length > 0
    };
    if (this.result) {
      const l2 = this.line2For(this.result);
      out.line2 = l2 ? l2.main : '';
      out.exp = l2 ? l2.exp : '';
      out.left = l2 ? l2.left : '';
    } else {
      out.line2 = this.screen === 'input' && !this.tokens.length ? '0' : '';
    }
    return Object.assign(base, out);
  }

  cursorChar() {
    let n = 0;
    for (let i = 0; i < this.cursor; i++) n += lcdTextCells(this.tokens[i].s).length;
    return n;
  }

  window(text, cursor) {
    const W = 16;
    const cells = lcdTextCells(text);
    if (cells.length <= W) return { text, cursor: Math.min(cursor, W - 1), left: false, right: false };
    let start = Math.max(0, Math.min(cursor - W + 1, cells.length - W));
    if (cursor < start) start = cursor;
    return {
      text: cells.slice(start, start + W).join(''),
      cursor: cursor - start,
      left: start > 0,
      right: start + W < cells.length
    };
  }

  // Casio menus keep a fixed slot grid across every page in a family. A
  // four-slot family, for example, uses lower cells 0/3/6/9 even when a page
  // contains only two or three choices. This is not label-centering: the upper
  // and lower LCD rows have different physical pitches.
  menuView() {
    const m = this.menu;
    const page = m.pages[m.page];
    if (page.title) {
      return { line1: page.title.slice(0, 16), line2: '', line2Cells: null };
    }

    const items = page.items;
    const slots = Math.max(1, ...m.pages.map((p) => p.items?.length || 0));
    const base = m.numbersFrom ? m.numbersFrom(m.page) : 1;
    const row1 = new Array(16).fill(' ');
    const row2 = new Array(10).fill(' ');

    items.forEach((it, i) => {
      const label = lcdTextCells(it.label).slice(0, Math.floor(16 / slots));
      let start = Math.round((i * 16) / slots);
      start = Math.min(start, 16 - label.length);
      for (let c = 0; c < label.length; c++) row1[start + c] = label[c];

      const cell = slots === 1 ? 0 : i * (7 - slots);
      const digit = String(base + i);
      row2[Math.max(0, Math.min(9, cell))] = digit;
    });

    const paged = m.pages.length > 1;
    return {
      line1: row1.join(''),
      line2: row2.join('').replace(/\s+$/, ''),
      line2Cells: row2,
      scrollLeft: paged,
      scrollRight: paged
    };
  }

  statView() {
    const b = this.statBrowse;
    const fields = this.statFields();
    const name = fields[b.field];
    const d = this.stat.data[b.index];
    const label = (name === 'Freq' ? 'Freq' : name) + String(b.index + 1) + '=';
    const value = b.edit.length ? textOf(b.edit)
      : this.fmtPlain(name === 'Freq' ? d.f : d[name]);
    return { line1: label, line2: value };
  }

  formulaView() {
    const f = this.formula;
    const spec = FORMULAS[f.index];
    if (f.stage === 'pick') {
      return {
        line1: f.digits ? 'Formula No.?' : formulaTitle(spec),
        line2: f.digits || '',
        histUp: true
      };
    }
    if (f.look) {
      const s = spec.look;
      return { line1: s.substr(f.lookScroll, 16), scrollRight: f.lookScroll + 16 < s.length };
    }
    if (f.stage === 'vars') {
      const name = spec.vars[f.varIdx];
      const value = f.edit.length ? textOf(f.edit) : this.fmtPlain(f.values[name] || 0);
      return { line1: formulaTitle(spec), left: name, line2: value };
    }
    const key = f.showExtra && spec.extra ? spec.extra[0] : spec.result;
    const val = f.results[key];
    const l2 = formatReal(r15(val), this.setup);
    return { line1: formulaTitle(spec), left: key, line2: l2.main, exp: l2.exp };
  }

  progView() {
    const p = this.prog;
    const used = this.programs.map((x, i) => (x ? String(i + 1) : '-')).join('');
    const free = String(PROGRAM_MEMORY - this.programBytes());
    if (p.stage === 'root') return { line1: 'EDIT  RUN  DEL', line2: '1     2    3' };
    if (p.stage === 'editpick') {
      return { line1: 'EDIT    Program', line2: `P-${used} ${free.padStart(3, ' ')}` };
    }
    if (p.stage === 'runpick') return { line1: 'RUN     Program', line2: 'P-' + used };
    if (p.stage === 'delpick') {
      return { line1: 'DELETE  Program', line2: `P-${used} ${free.padStart(3, ' ')}` };
    }
    if (p.stage === 'newmode') {
      return p.page === 0
        ? { line1: 'MODE:COMP CMPLX', line2: '1    2' }
        : { line1: 'MODE:BASE SD REG', line2: '3    4  5' };
    }
    if (p.stage === 'edit') {
      const text = textOf(p.tokens);
      let n = 0;
      for (let i = 0; i < p.cursor; i++) n += p.tokens[i].s.length;
      const win = this.window(text, n);
      return {
        line1: win.text,
        cursor: win.cursor,
        scrollLeft: win.left,
        scrollRight: win.right,
        line2: String(bytesOf(p.tokens)).padStart(3, '0')
      };
    }
    if (p.stage === 'running' && p.state) {
      const st = p.state;
      if (st.kind === 'input') {
        return {
          line1: st.varName + '?',
          line2: st.edit && st.edit.length ? textOf(st.edit) : this.fmtPlain(this.vars[st.varName] || 0)
        };
      }
      if (st.kind === 'output') {
        const l2 = this.line2For({ z: st.value, view: 'normal', engShift: 0, part: 0 });
        return { line1: st.text || '', line2: l2.main, exp: l2.exp, pause: true };
      }
    }
    return { line1: '', line2: '' };
  }

  fmtPlain(x) {
    const f = formatReal(x, this.setup);
    return f.main;
  }

  /** Build the lower-line payload for a result object. */
  line2For(res) {
    const z = res.z;
    if (this.mode === 'BASE') {
      return Object.assign({ left: '' }, formatBase(Math.trunc(z.re), this.base));
    }
    let x = z.re;
    let left = '';
    if (this.mode === 'CMPLX' && !isReal(z)) {
      const polar = (res.forceFormat === 'polar') ||
        (this.setup.cplx === 'r∠θ' && res.forceFormat !== 'rect');
      if (polar) {
        const r = Math.hypot(z.re, z.im);
        const th = Math.atan2(z.im, z.re) /
          { Deg: Math.PI / 180, Rad: 1, Gra: Math.PI / 200 }[this.setup.angle];
        x = res.part ? th : r;
      } else {
        x = res.part ? z.im : z.re;
      }
    } else if (this.mode === 'CMPLX' && res.part === 1) {
      x = 0;
    }

    if (res.view === 'frac') {
      const f = formatFraction(x, res.improper);
      if (f) return Object.assign({ left }, f);
    }
    if (res.view === 'dms') {
      const f = formatDms(x);
      if (f) return Object.assign({ left }, f);
    }
    if (res.view === 'eng') {
      return Object.assign({ left }, formatEng(x, res.engExp || 0));
    }
    return Object.assign({ left }, formatReal(x, this.setup));
  }
}
