// stats.js — SD (single variable) and REG (paired variable) calculations.
//
// Samples are stored untransformed.  The regression type decides how x and y
// are mapped before the sums are taken, which is why switching type inside REG
// mode re-derives everything from the same data instead of losing it.

export const REG_TYPES = ['Lin', 'Log', 'Exp', 'Pwr', 'Inv', 'Quad', 'AB-Exp'];

const MathErr = () => { const e = new Error('Math ERROR'); e.mathError = true; throw e; };

function mapX(type, x) {
  if (type === 'Log' || type === 'Pwr') { if (x <= 0) MathErr(); return Math.log(x); }
  if (type === 'Inv') { if (x === 0) MathErr(); return 1 / x; }
  return x;
}
function mapY(type, y) {
  if (type === 'Exp' || type === 'Pwr' || type === 'AB-Exp') {
    if (y <= 0) MathErr();
    return Math.log(y);
  }
  return y;
}

export class StatStore {
  constructor() { this.clear(); }

  clear() { this.data = []; this.type = 'Lin'; }

  get n() { return this.data.reduce((s, d) => s + d.f, 0); }
  get count() { return this.data.length; }

  add(x, y = 0, f = 1) {
    if (f <= 0 || !Number.isInteger(f)) MathErr();
    this.data.push({ x, y, f });
  }
  removeAt(i) { this.data.splice(i, 1); }

  /**
   * Accumulate sample data.
   *
   * S-SUM, S-VAR and MINMAX always operate on the values the user entered.
   * Non-linear regression coefficients, however, are calculated from the
   * guide's linearised coordinates (ln x, ln y or 1/x). Keep those two views
   * explicit so selecting a regression type never changes the sample stats.
   */
  sums(paired, transformed = false) {
    const t = this.type;
    const s = {
      n: 0, x: 0, x2: 0, y: 0, y2: 0, xy: 0, x3: 0, x4: 0, x2y: 0,
      minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity
    };
    for (const d of this.data) {
      const x = paired && transformed ? mapX(t, d.x) : d.x;
      const y = paired ? (transformed ? mapY(t, d.y) : d.y) : 0;
      const f = d.f;
      s.n += f;
      s.x += f * x; s.x2 += f * x * x; s.x3 += f * x ** 3; s.x4 += f * x ** 4;
      s.y += f * y; s.y2 += f * y * y; s.xy += f * x * y; s.x2y += f * x * x * y;
      s.minX = Math.min(s.minX, x); s.maxX = Math.max(s.maxX, x);
      s.minY = Math.min(s.minY, y); s.maxY = Math.max(s.maxY, y);
    }
    return s;
  }

  value(name, paired) {
    const s = this.sums(paired);
    if (s.n === 0 && !['n', 'Sx', 'Sx2', 'Sy', 'Sy2', 'Sxy', 'Sx3', 'Sx4', 'Sx2y'].includes(name)) {
      MathErr();
    }
    const varX = s.x2 / s.n - (s.x / s.n) ** 2;
    const varY = s.y2 / s.n - (s.y / s.n) ** 2;

    switch (name) {
      case 'n': return s.n;
      case 'Sx': return s.x;
      case 'Sx2': return s.x2;
      case 'Sy': return s.y;
      case 'Sy2': return s.y2;
      case 'Sxy': return s.xy;
      case 'Sx3': return s.x3;
      case 'Sx4': return s.x4;
      case 'Sx2y': return s.x2y;
      case 'xbar': return s.x / s.n;
      case 'ybar': return s.y / s.n;
      case 'xsn': return Math.sqrt(Math.max(0, varX));
      case 'ysn': return Math.sqrt(Math.max(0, varY));
      case 'xsn1': {
        if (s.n < 2) MathErr();
        return Math.sqrt(Math.max(0, (s.x2 - s.x * s.x / s.n) / (s.n - 1)));
      }
      case 'ysn1': {
        if (s.n < 2) MathErr();
        return Math.sqrt(Math.max(0, (s.y2 - s.y * s.y / s.n) / (s.n - 1)));
      }
      case 'minX': return s.minX;
      case 'maxX': return s.maxX;
      case 'minY': return s.minY;
      case 'maxY': return s.maxY;
      default: return this.coef(name, this.sums(true, true));
    }
  }

  coef(name, s) {
    const t = this.type;
    if (t === 'Quad') {
      const Sxx = s.x2 - s.x * s.x / s.n;
      const Sxy = s.xy - s.x * s.y / s.n;
      const Sxx2 = s.x3 - s.x * s.x2 / s.n;
      const Sx2x2 = s.x4 - s.x2 * s.x2 / s.n;
      const Sx2y = s.x2y - s.x2 * s.y / s.n;
      const den = Sxx * Sx2x2 - Sxx2 * Sxx2;
      if (den === 0) MathErr();
      const b = (Sxy * Sx2x2 - Sx2y * Sxx2) / den;
      const c = (Sx2y * Sxx - Sxy * Sxx2) / den;
      const a = s.y / s.n - b * (s.x / s.n) - c * (s.x2 / s.n);
      if (name === 'a') return a;
      if (name === 'b') return b;
      if (name === 'c') return c;
      MathErr();
    }
    const den = s.n * s.x2 - s.x * s.x;
    if (den === 0) MathErr();
    const b = (s.n * s.xy - s.x * s.y) / den;
    const a = (s.y - b * s.x) / s.n;
    const r = (s.n * s.xy - s.x * s.y) /
      Math.sqrt(den * (s.n * s.y2 - s.y * s.y));
    if (name === 'r') return r;
    if (name === 'a') return t === 'Exp' || t === 'Pwr' || t === 'AB-Exp' ? Math.exp(a) : a;
    if (name === 'b') return t === 'AB-Exp' ? Math.exp(b) : b;
    if (name === 'c') MathErr();
    MathErr();
    return 0;
  }

  /** Estimated values: 'x', 'y', 'x1', 'x2'. */
  estimate(kind, v) {
    const t = this.type;
    const s = this.sums(true, true);
    if (t === 'Quad') {
      const a = this.coef('a', s), b = this.coef('b', s), c = this.coef('c', s);
      if (kind === 'y') return a + b * v + c * v * v;
      const disc = b * b - 4 * c * (a - v);
      if (disc < 0 || c === 0) MathErr();
      const rt = Math.sqrt(disc);
      return kind === 'x1' ? (-b + rt) / (2 * c) : (-b - rt) / (2 * c);
    }
    const a = this.coef('a', s), b = this.coef('b', s);
    if (kind === 'y') {
      switch (t) {
        case 'Lin': return a + b * v;
        case 'Log': { if (v <= 0) MathErr(); return a + b * Math.log(v); }
        case 'Exp': return a * Math.exp(b * v);
        case 'AB-Exp': return a * Math.pow(b, v);
        case 'Pwr': { if (v < 0) MathErr(); return a * Math.pow(v, b); }
        case 'Inv': { if (v === 0) MathErr(); return a + b / v; }
      }
    }
    if (kind === 'x') {
      switch (t) {
        case 'Lin': { if (b === 0) MathErr(); return (v - a) / b; }
        case 'Log': { if (b === 0) MathErr(); return Math.exp((v - a) / b); }
        case 'Exp': { if (v <= 0 || a <= 0 || b === 0) MathErr(); return (Math.log(v) - Math.log(a)) / b; }
        case 'AB-Exp': {
          if (v <= 0 || a <= 0 || b <= 0) MathErr();
          return (Math.log(v) - Math.log(a)) / Math.log(b);
        }
        case 'Pwr': { if (v <= 0 || a <= 0 || b === 0) MathErr(); return Math.exp((Math.log(v) - Math.log(a)) / b); }
        case 'Inv': { if (v === a) MathErr(); return b / (v - a); }
      }
    }
    MathErr();
    return 0;
  }
}
