// formulas.js — the 23 built-in mathematics and physics formulas reached with
// the FMLA key.  Each entry lists the variables in the order the machine
// prompts for them, the symbol shown at the left of the result, and the
// expression string that SHIFT+FMLA (LOOK) scrolls across the upper line.

const G = 9.80665;                 // standard acceleration of gravity
const EPS0 = 8.854187817e-12;      // electric constant
const RGAS = 8.314472;             // molar gas constant

const E = (m) => { const e = new Error(m); e.mathError = true; throw e; };

function normP(x) {
  // Hastings' estimate of the standard normal distribution function.
  if (x < 0) return 1 - normP(-x);
  const p = 0.2316419;
  const b = [0.319381530, -0.356563782, 1.781477937, -1.821255978, 1.330274429];
  const t = 1 / (1 + p * x);
  const z = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  let s = 0, tp = t;
  for (let i = 0; i < 5; i++) { s += b[i] * tp; tp *= t; }
  return 1 - z * s;
}

export const FORMULAS = [
  {
    no: 1, name: 'Quadratic', vars: ['a', 'b', 'c'], result: 'x1',
    look: 'ax²+bx+c=0',
    run: ({ a, b, c }) => {
      if (a === 0) E('a');
      const d = b * b - 4 * a * c;
      if (d < 0) E('d');
      const s = Math.sqrt(d);
      return { x1: (-b + s) / (2 * a), x2: (-b - s) / (2 * a) };
    },
    extra: ['x2']
  },
  {
    no: 2, name: 'CosineTheorem', vars: ['b', 'c', 'θ'], result: 'a',
    look: 'a=√(b²+c²-2bc cosθ)',
    run: ({ b, c, θ }, deg) => {
      if (b <= 0 || c <= 0 || θ <= 0 || θ > 180) E('r');
      const t = deg(θ);
      return { a: Math.sqrt(b * b + c * c - 2 * b * c * Math.cos(t)) };
    }
  },
  {
    no: 3, name: 'HeronFormula', vars: ['a', 'b', 'c'], result: 's',
    look: 'S=√(s(s-a)(s-b)(s-c))',
    run: ({ a, b, c }) => {
      if (a + b <= c || b + c <= a || c + a <= b) E('r');
      const s = (a + b + c) / 2;
      return { s: Math.sqrt(s * (s - a) * (s - b) * (s - c)) };
    }
  },
  {
    no: 4, name: 'Normal P(x)', vars: ['x'], result: 'P',
    look: 'P(x)=∫e^(-t²/2)dt/√(2π)',
    run: ({ x }) => { if (x < 0 || x >= 1e50) E('r'); return { P: normP(x) }; }
  },
  {
    no: 5, name: 'Normal Q(x)', vars: ['x'], result: 'Q',
    look: 'Q(x)=∫0..|x| e^(-t²/2)dt/√(2π)',
    run: ({ x }) => { if (x < 0 || x >= 1e50) E('r'); return { Q: normP(Math.abs(x)) - 0.5 }; }
  },
  {
    no: 6, name: 'Coulomb', vars: ['Q', 'q', 'r'], result: 'F',
    look: 'F=Qq/(4πε0r²)',
    run: ({ Q, q, r }) => { if (r <= 0) E('r'); return { F: Q * q / (4 * Math.PI * EPS0 * r * r) }; }
  },
  {
    no: 7, name: 'Resistance', vars: ['ρ', 'ℓ', 'S'], result: 'R',
    look: 'R=ρℓ/S',
    run: ({ ρ, ℓ, S }) => { if (ρ <= 0 || ℓ <= 0 || S <= 0) E('r'); return { R: ρ * ℓ / S }; }
  },
  {
    no: 8, name: 'MagneticForce', vars: ['I', 'B', 'ℓ', 'θ'], result: 'F',
    look: 'F=IBℓsinθ',
    run: ({ I, B, ℓ, θ }, deg) => {
      if (ℓ <= 0 || Math.abs(θ) > 90) E('r');
      return { F: I * B * ℓ * Math.sin(deg(θ)) };
    }
  },
  {
    no: 9, name: 'RC Circuit', vars: ['V', 'C', 'R', 't'], result: 'v',
    look: 'VR=V·e^(-t/CR)',
    run: ({ V, C, R, t }) => {
      if (C <= 0 || R <= 0 || t <= 0) E('r');
      return { v: V * Math.exp(-t / (C * R)) };
    }
  },
  {
    no: 10, name: 'VoltageGain', vars: ['E', "E'"], result: 'G',
    look: "G=20log10(E'/E)",
    run: (v) => {
      const r = v["E'"] / v.E;
      if (!(r > 0)) E('r');
      return { G: 20 * Math.log10(r) };
    }
  },
  {
    no: 11, name: 'LRC Series', vars: ['R', 'f', 'L', 'C'], result: 'Z',
    look: 'Z=√(R²+(2πfL-1/2πfC)²)',
    run: ({ R, f, L, C }) => {
      if (R <= 0 || f <= 0 || L <= 0 || C <= 0) E('r');
      const w = 2 * Math.PI * f;
      return { Z: Math.sqrt(R * R + (w * L - 1 / (w * C)) ** 2) };
    }
  },
  {
    no: 12, name: 'LRC Parallel', vars: ['R', 'f', 'L', 'C'], result: 'Z',
    look: 'Z=1/√(1/R²+(2πfC-1/2πfL)²)',
    run: ({ R, f, L, C }) => {
      if (R <= 0 || f <= 0 || L <= 0 || C <= 0) E('r');
      const w = 2 * Math.PI * f;
      return { Z: 1 / Math.sqrt(1 / (R * R) + (w * C - 1 / (w * L)) ** 2) };
    }
  },
  {
    no: 13, name: 'Oscillation', vars: ['L', 'C'], result: 'f',
    look: 'f1=1/(2π√(LC))',
    run: ({ L, C }) => {
      if (L <= 0 || C <= 0) E('r');
      return { f: 1 / (2 * Math.PI * Math.sqrt(L * C)) };
    }
  },
  {
    no: 14, name: 'DropDistance', vars: ['v', 't'], result: 's',
    look: 'S=v1t+gt²/2',
    run: ({ v, t }) => { if (t <= 0) E('r'); return { s: v * t + G * t * t / 2 }; }
  },
  {
    no: 15, name: 'Pendulum', vars: ['ℓ'], result: 't',
    look: 'T=2π√(ℓ/g)',
    run: ({ ℓ }) => { if (ℓ <= 0) E('r'); return { t: 2 * Math.PI * Math.sqrt(ℓ / G) }; }
  },
  {
    no: 16, name: 'SpringPend', vars: ['m', 'k'], result: 't',
    look: 'T=2π√(m/k)',
    run: ({ m, k }) => { if (m <= 0 || k <= 0) E('r'); return { t: 2 * Math.PI * Math.sqrt(m / k) }; }
  },
  {
    no: 17, name: 'Doppler', vars: ['f', 'v', 'u', 'v1'], result: 'f',
    look: 'f=f1(v-u)/(v-v1)',
    run: (o) => {
      const { f, v, u } = o, v1 = o.v1;
      if (v === v1 || f <= 0 || (v - u) / (v - v1) <= 0) E('r');
      return { f: f * (v - u) / (v - v1) };
    }
  },
  {
    no: 18, name: 'IdealGas', vars: ['n', 'T', 'V'], result: 'P',
    look: 'P=nRT/V',
    run: ({ n, T, V }) => { if (n <= 0 || T <= 0 || V <= 0) E('r'); return { P: n * RGAS * T / V }; }
  },
  {
    no: 19, name: 'Centrifugal', vars: ['m', 'v', 'r'], result: 'F',
    look: 'F=mv²/r',
    run: ({ m, v, r }) => { if (m <= 0 || v <= 0 || r <= 0) E('r'); return { F: m * v * v / r }; }
  },
  {
    no: 20, name: 'ElasticEnergy', vars: ['K', 'x'], result: 'u',
    look: 'U=Kx²/2',
    run: ({ K, x }) => { if (K <= 0 || x <= 0) E('r'); return { u: K * x * x / 2 }; }
  },
  {
    no: 21, name: 'Bernoulli', vars: ['v', 'z', 'ρ', 'P'], result: 'c',
    look: 'C=v²/2+P/ρ+gz',
    run: ({ v, z, ρ, P }) => {
      if (v <= 0 || z <= 0 || ρ <= 0 || P <= 0) E('r');
      return { c: v * v / 2 + P / ρ + G * z };
    }
  },
  {
    no: 22, name: 'StadiaHeight', vars: ['K', 'C', 'ℓ', 'θ'], result: 'h',
    look: 'h=Kℓsin2θ/2+Csinθ',
    run: ({ K, C, ℓ, θ }, deg) => {
      if (ℓ <= 0 || θ <= 0 || θ >= 90) E('r');
      const t = deg(θ);
      return { h: K * ℓ * Math.sin(2 * t) / 2 + C * Math.sin(t) };
    }
  },
  {
    no: 23, name: 'StadiaDist', vars: ['K', 'C', 'ℓ', 'θ'], result: 's',
    look: 'S=Kℓcos²θ+Ccosθ',
    run: ({ K, C, ℓ, θ }, deg) => {
      if (ℓ <= 0 || θ <= 0 || θ >= 90) E('r');
      const t = deg(θ);
      return { s: K * ℓ * Math.cos(t) ** 2 + C * Math.cos(t) };
    }
  }
];

export function formulaTitle(f) {
  return String(f.no).padStart(2, '0') + ':' + f.name;
}
