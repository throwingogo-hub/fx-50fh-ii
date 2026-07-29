// program.js — the BASIC-like program store and interpreter.
//
// Program memory holds 680 bytes shared by four areas.  A program runs as a
// resumable state machine so that "?" input prompts and "◢" output pauses can
// hand control back to the keyboard between steps.

import { parse, evaluate, CalcError, C, r15 } from './expr.js';
import { K, textOf, bytesOf } from './tokens.js';

export const PROGRAM_MEMORY = 680;

export class Program {
  constructor(mode, tokens) {
    this.mode = mode;
    this.tokens = tokens;
  }
  get bytes() { return bytesOf(this.tokens); }
  start(machine) { return new Run(machine, this.tokens); }
}

const err = (kind) => { throw new CalcError(kind); };

function splitStatements(tokens) {
  const stmts = [];
  let cur = [];
  for (const t of tokens) {
    if (t.k === K.SEP && t.s === ':') { stmts.push({ toks: cur, pause: false }); cur = []; continue; }
    if (t.c === 'output') { stmts.push({ toks: cur, pause: true }); cur = []; continue; }
    cur.push(t);
  }
  stmts.push({ toks: cur, pause: false });
  return stmts.filter((s, i) => s.toks.length || s.pause || i === 0);
}

export class Run {
  constructor(machine, tokens) {
    this.m = machine;
    this.stmts = splitStatements(tokens);
    this.pc = 0;
    this.ifStack = [];
    this.loops = [];
    this.last = null;
    this.waiting = null;
    this.index();
  }

  index() {
    this.labels = {};
    this.ifMap = {};
    this.loopMap = {};
    const ifs = [], fors = [], whiles = [];
    this.stmts.forEach((s, i) => {
      const c = s.toks[0] && s.toks[0].c;
      if (c === 'Lbl') {
        const d = s.toks[1];
        if (d && d.k === K.DIGIT) this.labels[d.s] = i;
      } else if (c === 'If') ifs.push({ i, elseIdx: -1, hasThen: false });
      else if (c === 'Then') {
        if (!ifs.length || ifs[ifs.length - 1].hasThen) err('Syntax');
        ifs[ifs.length - 1].hasThen = true;
      }
      else if (c === 'Else') {
        if (!ifs.length || !ifs[ifs.length - 1].hasThen || ifs[ifs.length - 1].elseIdx >= 0) err('Syntax');
        ifs[ifs.length - 1].elseIdx = i;
      }
      else if (c === 'IfEnd') {
        const f = ifs.pop();
        if (!f || !f.hasThen) err('Syntax');
        this.ifMap[f.i] = { elseIdx: f.elseIdx, endIdx: i };
        if (f.elseIdx >= 0) this.ifMap[f.elseIdx] = { endIdx: i };
      } else if (c === 'For') fors.push(i);
      else if (c === 'Next') {
        const f = fors.pop();
        if (f === undefined) err('Syntax');
        this.loopMap[f] = i;
        this.loopMap[i] = f;
      } else if (c === 'While') whiles.push(i);
      else if (c === 'WhileEnd') {
        const w = whiles.pop();
        if (w === undefined) err('Syntax');
        this.loopMap[w] = i;
        this.loopMap[i] = w;
      }
    });
    // The guide explicitly permits a missing IfEnd (with a warning that it can
    // make everything after the If part of the branch). Close such frames at
    // end-of-program, but an If without Then is always a Syntax ERROR.
    while (ifs.length) {
      const f = ifs.pop();
      if (!f.hasThen) err('Syntax');
      this.ifMap[f.i] = { elseIdx: f.elseIdx, endIdx: this.stmts.length };
      if (f.elseIdx >= 0) this.ifMap[f.elseIdx] = { endIdx: this.stmts.length };
    }
    if (fors.length || whiles.length) err('Syntax');
  }

  ctx() { return this.m.ctx(); }

  evalTokens(toks) {
    if (!toks.length) err('Syntax');
    return evaluate(parse(toks, this.ctx()), this.ctx());
  }

  /** Advance until the program finishes or needs the keyboard. */
  step() {
    let guard = 0;
    for (;;) {
      if (guard++ > 200000) err('Time');
      if (this.pc >= this.stmts.length) {
        return { done: true, value: this.last };
      }
      const s = this.stmts[this.pc];
      const r = this.exec(s);
      if (r && r.wait) return r;
      if (r && r.jumped) continue;
      if (s.pause) {
        this.pc++;
        this.waiting = 'output';
        return { kind: 'output', value: this.last || C(0), text: textOf(s.toks).slice(0, 16) };
      }
      this.pc++;
    }
  }

  provide(value) {
    if (!this.waiting || this.waiting.kind !== 'input') err('Syntax');
    this.m.vars[this.waiting.varName] = r15(value);
    this.last = C(r15(value));
    this.waiting = null;
    this.pc++;
  }

  resume() { this.waiting = null; }

  exec(s) {
    const toks = s.toks;
    if (!toks.length) return null;
    const head = toks[0];
    const c = head.c;

    // conditional jump:  cond ⇒ statement
    const jumpAt = toks.findIndex((t) => t.c === 'Jump');
    if (jumpAt >= 0 && !c) {
      const cond = this.evalTokens(toks.slice(0, jumpAt));
      this.last = cond;
      this.m.ans = cond;
      if (cond.re !== 0) return this.exec({ toks: toks.slice(jumpAt + 1), pause: false });
      return null;
    }

    switch (c) {
      case 'Lbl': return null;
      case 'Goto': {
        const d = toks[1];
        if (!d || this.labels[d.s] === undefined) err('Go');
        this.pc = this.labels[d.s];
        return { jumped: true };
      }
      case 'If': {
        const cond = this.evalTokens(toks.slice(1));
        this.m.ans = cond;
        const map = this.ifMap[this.pc];
        if (!map) err('Syntax');
        // One frame is pushed on either path so that IfEnd always has exactly
        // its own frame to pop.
        if (cond.re !== 0) {
          this.ifStack.push({ endIdx: map.endIdx, branch: 'then' });
          return null;
        }
        this.ifStack.push({ endIdx: map.endIdx, branch: 'else' });
        this.pc = map.elseIdx >= 0 ? map.elseIdx : map.endIdx;
        return { jumped: true };
      }
      case 'Then':
        return toks.length > 1 ? this.exec({ toks: toks.slice(1), pause: false }) : null;
      case 'Else': {
        const frame = this.ifStack[this.ifStack.length - 1];
        const map = this.ifMap[this.pc];
        // Falling into Else from the true branch means the work is done.
        if (frame && map && frame.branch === 'then' && frame.endIdx === map.endIdx) {
          this.pc = map.endIdx;
          return { jumped: true };
        }
        return toks.length > 1 ? this.exec({ toks: toks.slice(1), pause: false }) : null;
      }
      case 'IfEnd':
        if (this.ifStack.length) this.ifStack.pop();
        return null;
      case 'For': return this.forStart(toks);
      case 'Next': return this.forNext();
      case 'While': {
        const cond = this.evalTokens(toks.slice(1));
        this.m.ans = cond;
        if (cond.re === 0) { this.pc = this.loopMap[this.pc]; return null; }
        this.loops.push({ kind: 'while', start: this.pc, exit: this.loopMap[this.pc] });
        return null;
      }
      case 'WhileEnd': {
        const start = this.loopMap[this.pc];
        while (this.loops.length && this.loops[this.loops.length - 1].start !== start) this.loops.pop();
        if (this.loops.length) this.loops.pop();
        this.pc = start - 1;
        return null;
      }
      case 'Break': {
        const f = this.loops.pop();
        if (!f) err('Syntax');
        this.pc = f.exit;
        return null;
      }
      case 'input': return this.inputPrompt(toks);
      case 'Deg': case 'Rad': case 'Gra':
        this.m.setup.angle = c; return null;
      case 'Fix': case 'Sci': {
        const d = toks[1];
        this.m.setup.disp = c;
        this.m.setup.digits = d ? Number(d.s) : 0;
        if (c === 'Sci' && this.m.setup.digits === 0) this.m.setup.digits = 10;
        return null;
      }
      case 'Norm': {
        const d = toks[1];
        this.m.setup.disp = 'Norm';
        this.m.setup.norm = d && d.s === '2' ? 2 : 1;
        return null;
      }
      case 'FreqOn': this.m.setup.freq = true; return null;
      case 'FreqOff': this.m.setup.freq = false; return null;
      case 'ClrMemory':
        for (const k of Object.keys(this.m.vars)) this.m.vars[k] = 0;
        return null;
      case 'ClrStat': this.m.stat.clear(); return null;
      case 'Dec': this.m.base = 10; return null;
      case 'Hex': this.m.base = 16; return null;
      case 'Bin': this.m.base = 2; return null;
      case 'Oct': this.m.base = 8; return null;
      default: break;
    }

    // assignment:  expr → VAR
    const arrow = toks.findIndex((t) => t.c === 'assign');
    if (arrow >= 0) {
      const target = toks[arrow + 1];
      if (!target || !target.v) err('Syntax');
      const v = this.evalTokens(toks.slice(0, arrow));
      this.m.vars[target.v] = r15(v.re);
      this.last = C(this.m.vars[target.v]);
      this.m.ans = this.last;
      const rest = toks.slice(arrow + 2);
      if (rest.length) return this.exec({ toks: rest, pause: false });
      return null;
    }

    // trailing memory / statistics commands
    const tail = toks[toks.length - 1];
    if (tail && (tail.c === 'M+' || tail.c === 'M-')) {
      const v = this.evalTokens(toks.slice(0, -1));
      const next = this.m.vars.M + (tail.c === 'M+' ? 1 : -1) * v.re;
      if (!Number.isFinite(next) || Math.abs(next) >= 1e100) err('Math');
      this.m.vars.M = r15(next);
      this.last = v;
      return null;
    }
    if (tail && tail.c === 'DT') {
      const saved = this.m.tokens;
      this.m.tokens = toks.slice(0, -1);
      this.m.statEnter();
      this.m.tokens = saved;
      this.m.screen = 'prog';
      return null;
    }

    const value = this.evalTokens(toks);
    this.last = value;
    this.m.ans = value;
    return null;
  }

  inputPrompt(toks) {
    // syntax:  ? → VAR
    const arrow = toks.findIndex((t) => t.c === 'assign');
    const target = arrow >= 0 ? toks[arrow + 1] : null;
    if (!target || !target.v) err('Syntax');
    this.waiting = { kind: 'input', varName: target.v, edit: [] };
    return { wait: true, kind: 'input', varName: target.v, edit: this.waiting.edit };
  }

  forStart(toks) {
    // For expr → VAR To expr [Step expr]
    const arrow = toks.findIndex((t) => t.c === 'assign');
    const toIdx = toks.findIndex((t) => t.c === 'To');
    const stepIdx = toks.findIndex((t) => t.c === 'Step');
    if (arrow < 0 || toIdx < 0) err('Syntax');
    const target = toks[arrow + 1];
    if (!target || !target.v) err('Syntax');
    const from = this.evalTokens(toks.slice(1, arrow)).re;
    const to = this.evalTokens(toks.slice(toIdx + 1, stepIdx > 0 ? stepIdx : undefined)).re;
    const step = stepIdx > 0 ? this.evalTokens(toks.slice(stepIdx + 1)).re : 1;
    if (step === 0) err('Syntax');
    this.m.vars[target.v] = from;
    const exit = this.loopMap[this.pc];
    if ((step > 0 && from > to) || (step < 0 && from < to)) { this.pc = exit; return null; }
    this.loops.push({ kind: 'for', varName: target.v, to, step, body: this.pc, exit });
    return null;
  }

  forNext() {
    const startIdx = this.loopMap[this.pc];
    while (this.loops.length && this.loops[this.loops.length - 1].body !== startIdx) this.loops.pop();
    const f = this.loops[this.loops.length - 1];
    if (!f) err('Syntax');
    const v = this.m.vars[f.varName] + f.step;
    this.m.vars[f.varName] = r15(v);
    if ((f.step > 0 && v <= f.to) || (f.step < 0 && v >= f.to)) {
      this.pc = f.body;
      return null;
    }
    this.loops.pop();
    return null;
  }
}
