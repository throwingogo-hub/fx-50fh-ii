// format.js — turns a computed value into the ten mantissa cells and two
// exponent cells of the lower display line, honouring Fix / Sci / Norm1 /
// Norm2, engineering notation, fractions, sexagesimal and base-n.

import { decimalToDms, toFraction } from './expr.js';

const MANT = 10;

function splitSci(x, sig) {
  // returns {m: mantissa string with a leading digit, e: exponent}
  if (x === 0) return { m: '0'.padEnd(sig, '0'), e: 0 };
  let e = Math.floor(Math.log10(Math.abs(x)));
  let m = Math.abs(x) / 10 ** e;
  let s = m.toFixed(Math.max(0, sig - 1));
  if (Number(s) >= 10) { e += 1; m = Math.abs(x) / 10 ** e; s = m.toFixed(Math.max(0, sig - 1)); }
  if (Number(s) < 1 && x !== 0) { e -= 1; m = Math.abs(x) / 10 ** e; s = m.toFixed(Math.max(0, sig - 1)); }
  return { m: s.replace('.', ''), e };
}

function trimZeros(s) {
  if (!s.includes('.')) return s;
  return s.replace(/0+$/, '').replace(/\.$/, '.');
}

function expField(e) {
  const sign = e < 0 ? '-' : '';
  return sign + String(Math.abs(e)).padStart(2, '0');
}

/**
 * @param {number} x
 * @param {object} st  {disp:'Norm'|'Fix'|'Sci', digits, norm:1|2, eng:0}
 * @returns {{main:string, exp:string}}
 */
export function formatReal(x, st) {
  if (!isFinite(x)) return { main: 'Error', exp: '' };
  if (x !== 0 && Math.abs(x) >= 1e100) return { main: 'Error', exp: '' };

  if (st.disp === 'Sci') {
    const sig = st.digits === 0 ? 10 : st.digits;
    const { m, e } = splitSci(x, sig);
    const body = (x < 0 ? '-' : '') + m[0] + (sig > 1 ? '.' + m.slice(1) : '.');
    return { main: body, exp: expField(e) };
  }

  if (st.disp === 'Fix') {
    const n = st.digits;
    const v = Number(x.toFixed(n));
    const intDigits = Math.abs(v) < 1 ? 1 : Math.floor(Math.log10(Math.abs(v))) + 1;
    if (intDigits + n <= MANT) {
      let s = v.toFixed(n);
      if (Object.is(v, -0)) s = (0).toFixed(n);
      return { main: s, exp: '' };
    }
    const { m, e } = splitSci(x, MANT);
    return { main: (x < 0 ? '-' : '') + m[0] + '.' + m.slice(1), exp: expField(e) };
  }

  // Norm1 / Norm2
  const lower = st.norm === 2 ? 1e-9 : 1e-2;
  const ax = Math.abs(x);
  if (x !== 0 && (ax < lower || ax >= 1e10)) {
    const { m, e } = splitSci(x, MANT);
    const body = trimZeros(m[0] + '.' + m.slice(1));
    return { main: (x < 0 ? '-' : '') + body, exp: expField(e) };
  }

  if (x === 0) return { main: '0', exp: '' };
  const intDigits = ax < 1 ? 0 : Math.floor(Math.log10(ax)) + 1;
  const dec = Math.max(0, MANT - Math.max(intDigits, 1));
  let s = x.toFixed(Math.min(dec, 100));
  s = trimZeros(s);
  if (s.endsWith('.')) s = s.slice(0, -1);
  if (s === '-0') s = '0';
  return { main: s, exp: '' };
}

/** Engineering notation at a caller-chosen exponent (always a multiple of 3). */
export function formatEng(x, e) {
  if (x === 0) return { main: '0', exp: '' };
  const m = x / 10 ** e;
  let s = m.toPrecision(MANT);
  if (s.includes('e')) s = Number(s).toFixed(MANT);
  s = trimZeros(s);
  if (s.endsWith('.')) s = s.slice(0, -1);
  return { main: s, exp: expField(e) };
}

/** a⌐b⌐c style fraction display, or null when it does not fit in ten cells. */
export function formatFraction(x, improper) {
  const f = toFraction(x, MANT);
  if (!f) return null;
  const sign = f.sign < 0 ? '-' : '';
  if (improper || f.int === 0) {
    const s = `${sign}${f.n}⌐${f.d}`;
    return s.replace(/⌐/g, '⌐').length <= MANT ? { main: s, exp: '' } : null;
  }
  const s = `${sign}${f.int}⌐${f.num}⌐${f.d}`;
  return s.length <= MANT ? { main: s, exp: '' } : null;
}

/** d°m°s display; the machine shows both separators as the degree tick. */
export function formatDms(x) {
  if (Math.abs(x) >= 1e10) return null;
  const { d, m, s } = decimalToDms(x);
  const sec = Math.abs(s - Math.round(s)) < 1e-6 ? String(Math.round(s))
    : String(Number(s.toFixed(2)));
  const out = `${d}°${m}°${sec}`;
  return out.length <= MANT ? { main: out, exp: '' } : null;
}

export function formatBase(v, base) {
  const digits = '0123456789ABCDEF';
  const bits = { 2: 10, 8: 30, 10: 32, 16: 32 }[base];
  let u = v < 0 ? v + 2 ** bits : v;
  if (base === 10) return { main: String(v), exp: '' };
  if (u === 0) return { main: '0', exp: '' };
  let s = '';
  while (u > 0) { s = digits[u % base] + s; u = Math.floor(u / base); }
  return { main: s, exp: '' };
}

/** Complex results are shown one part at a time; this formats a single part. */
export function formatPart(x, st) {
  return formatReal(x, st);
}
