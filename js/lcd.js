// lcd.js — draws the two-line LCD onto a canvas that sits exactly over the
// glass in the product photo.  All metrics below were measured off the photo:
// the upper line is a 16-character 5x7 dot matrix with tall, non-square dots,
// the lower line is ten 7-segment cells plus a two-digit exponent field.

import { glyph, SEG } from './font.js';

export const GLASS = { x: 106, y: 257, w: 637, h: 249 };

const M = {
  // indicator strip
  indY: 279, indDot: 3.0, indH: 21,
  // upper dot-matrix line
  // measured off the photograph: cells on a 33.7 px pitch, dots on a 6.05 x 8.9
  // grid, so the dots are noticeably taller than they are wide
  l1X: 156, l1Y: 310.5, l1Cell: 33.7, l1DotW: 6.05, l1DotH: 8.9, l1Cols: 16,
  // lower segment line: 37 x 91 digits on a 48.3 px pitch, as measured
  l2X: 172, l2Y: 387, l2Pitch: 48.3, l2W: 37, l2H: 91, l2Cells: 10,
  labX: 116, labW: 52,
  // exponent field: a fixed "x10" legend with raised small digits above it
  expX: 648, expY: 394, expDot: 4.6, expDigitX: 6,
  expLegendY: 438, expLegendDot: 4.6
};

const ON = '#22282b';
// Unlit segments are not drawn at all. Overlapping hexagons accumulate alpha,
// so even a very low opacity ghost reads as a second row of digits.
const OFF = null;
const BG0 = '#dfeae7';
const BG1 = '#cfdcda';

// Indicator strip, laid out left to right the way Casio prints it.
export const INDICATORS = [
  'S', 'A', 'M', 'STO', 'RCL', 'SD', 'REG', 'FMLA', 'PRG',
  'D', 'R', 'G', 'FIX', 'SCI', 'i', '∠', 'R⇔I', '▮', 'Disp'
];

export class LCD {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.min(3, window.devicePixelRatio || 1);
    this.resize();
  }

  resize() {
    const { canvas } = this;
    canvas.width = Math.round(GLASS.w * this.dpr);
    canvas.height = Math.round(GLASS.h * this.dpr);
  }

  /**
   * @param {object} v
   *   indicators  Set of indicator labels that are lit
   *   line1       string (already windowed to 16 columns)
   *   cursor      column index of the cursor on line 1, or -1
   *   cursorKind  'insert' | 'overwrite' | 'full'
   *   left        small label at the left of line 2 (e.g. "f", "Ans")
   *   line2       up to 10 cells; '.' attaches to the previous cell
   *   exp         exponent string such as "-03", or ''
   *   scrollLeft/scrollRight  show the ◀ / ▶ scroll arrows
   */
  render(v) {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const grad = c.createLinearGradient(0, 0, 0, GLASS.h);
    grad.addColorStop(0, BG0);
    grad.addColorStop(1, BG1);
    c.fillStyle = grad;
    c.fillRect(0, 0, GLASS.w, GLASS.h);

    this.#indicators(v.indicators || new Set());
    this.#line1(v);
    this.#line2(v);
  }

  // ---- indicator strip ----------------------------------------------------
  #indicators(lit) {
    const c = this.ctx;
    let x = 8;
    for (const label of INDICATORS) {
      const w = this.#smallText(x, M.indY - GLASS.y, label, lit.has(label), M.indDot);
      x += w + 7;
    }
  }

  // Unlit indicators are simply absent, the way they are on the real glass.
  #smallText(x, y, text, on, dot) {
    const c = this.ctx;
    const width = text.length * 6 * dot - dot;
    if (!on) return width;
    c.fillStyle = ON;
    let cx = x;
    for (const ch of text) {
      const cols = glyph(ch);
      for (let i = 0; i < 5; i++) {
        for (let r = 0; r < 7; r++) {
          if (cols[i] & (1 << r)) {
            c.fillRect(cx + i * dot, y + r * dot, dot * 0.92, dot * 0.92);
          }
        }
      }
      cx += 5 * dot + dot;
    }
    return cx - x - dot;
  }

  // ---- upper dot-matrix line ---------------------------------------------
  #line1(v) {
    const c = this.ctx;
    const text = (v.line1 || '').padEnd(M.l1Cols, ' ').slice(0, M.l1Cols);
    const y0 = M.l1Y - GLASS.y;
    const x0 = M.l1X - GLASS.x;
    const blink = v.blinkOn !== false;

    for (let col = 0; col < M.l1Cols; col++) {
      const cx = x0 + col * M.l1Cell;
      const isCursor = col === v.cursor;
      const cols = glyph(text[col]);
      const kind = v.cursorKind || 'insert';

      // cursor rendering: a vertical bar sits between cells (insert mode),
      // an underline sits below the cell (overwrite), a full block replaces it.
      if (isCursor && blink && kind === 'full') {
        c.fillStyle = ON;
        c.fillRect(cx, y0, M.l1DotW * 5, M.l1DotH * 7);
        continue;
      }

      c.fillStyle = ON;
      for (let i = 0; i < 5; i++) {
        for (let r = 0; r < 7; r++) {
          if (cols[i] & (1 << r)) {
            c.fillRect(cx + i * M.l1DotW, y0 + r * M.l1DotH,
              M.l1DotW * 0.92, M.l1DotH * 0.9);
          }
        }
      }
      if (isCursor && blink) {
        if (kind === 'overwrite') {
          c.fillRect(cx, y0 + 6 * M.l1DotH, M.l1DotW * 5, M.l1DotH * 0.9);
        } else {
          c.fillRect(cx - 2, y0, 3.2, M.l1DotH * 7);
        }
      }
    }

    // scroll arrows in the margins
    if (v.scrollLeft) this.#smallText(6, y0 + 18, '◀', true, 4);
    if (v.scrollRight) this.#smallText(GLASS.w - 26, y0 + 18, '▶', true, 4);
    if (v.histUp) this.#smallText(GLASS.w - 26, 4, '▲', true, 4);
    if (v.histDown) this.#smallText(GLASS.w - 26, GLASS.h - 24, '▼', true, 4);
  }

  // ---- lower segment line -------------------------------------------------
  #line2(v) {
    const c = this.ctx;
    if (v.left) this.#smallText(M.labX - GLASS.x, M.l2Y - GLASS.y + 12, v.left, true, 4.4);

    // Split the payload into cells; '.' rides along with the cell before it.
    const raw = v.line2 || '';
    const cells = [];
    for (const ch of raw) {
      if ((ch === '.' || ch === ',') && cells.length) cells[cells.length - 1].dp = true;
      else cells.push({ ch, dp: false });
    }
    const start = Math.max(0, M.l2Cells - cells.length);
    const y = M.l2Y - GLASS.y;

    for (let i = 0; i < cells.length && start + i < M.l2Cells; i++) {
      const x = (M.l2X - GLASS.x) + (start + i) * M.l2Pitch;
      this.#cell(x, y, M.l2W, M.l2H, cells[i]);
    }

    // The exponent is not a bare number. The glass carries a fixed "x10"
    // legend low on the right, with the exponent's own digits set small and
    // raised above it, so a result reads as 1.672621777 x10^-27.
    if (v.exp) {
      const e = v.exp;
      const ex = M.expX - GLASS.x;
      this.#smallText(ex, M.expLegendY - GLASS.y, '×10', true, M.expLegendDot);
      let dx = ex + M.expDigitX;
      for (const ch of e) {
        dx += this.#smallText(dx, M.expY - GLASS.y, ch, true, M.expDot) + M.expDot;
      }
    }
  }

  // One large character cell: seven hexagonal segments, plus the hand-drawn
  // glyphs that are not segment shapes (fraction bar, degree tick, i, ∠).
  #cell(x, y, w, h, cell) {
    const c = this.ctx;
    const ch = cell.ch;
    const t = h * 0.105;              // stroke thickness
    const g = t * 0.16;               // gap between neighbouring segments
    const slant = h * 0.05;           // the digits lean slightly to the right

    // shear so the top of the cell sits slightly right of the bottom
    const P = (px, py) => [x + px + (1 - py / h) * slant, y + py];
    const poly = (pts) => {
      c.beginPath();
      pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      c.closePath();
      c.fill();
    };
    const horiz = (yc) => poly([
      P(t / 2 + g, yc - t / 2), P(w - t / 2 - g, yc - t / 2), P(w - g, yc),
      P(w - t / 2 - g, yc + t / 2), P(t / 2 + g, yc + t / 2), P(g, yc)
    ]);
    const vert = (xc, y0, y1) => poly([
      P(xc - t / 2, y0 + t / 2 + g), P(xc, y0 + g), P(xc + t / 2, y0 + t / 2 + g),
      P(xc + t / 2, y1 - t / 2 - g), P(xc, y1 - g), P(xc - t / 2, y1 - t / 2 - g)
    ]);

    if (ch === '⌐') { this.#fracBar(x, y, w, h); return; }
    if (ch === '°') { this.#degree(x, y, w, h); return; }
    if (ch === 'i') { this.#imag(x, y, w, h); return; }
    if (ch === '∠') { this.#angle(x, y, w, h); return; }

    const mask = SEG[ch] !== undefined ? SEG[ch] : (ch === ' ' ? 0 : SEG['-']);
    c.fillStyle = ON;
    const on = (bit) => (mask & (1 << bit)) !== 0;

    if (on(0)) horiz(t / 2);                 // a
    if (on(1)) vert(w - t / 2, 0, h / 2);    // b
    if (on(2)) vert(w - t / 2, h / 2, h);    // c
    if (on(3)) horiz(h - t / 2);             // d
    if (on(4)) vert(t / 2, h / 2, h);        // e
    if (on(5)) vert(t / 2, 0, h / 2);        // f
    if (on(6)) horiz(h / 2);                 // g

    if (cell.dp) {
      c.fillStyle = ON;
      const r = w * 0.1;
      c.beginPath();
      c.arc(x + w + r * 1.6, y + h - r, r, 0, Math.PI * 2);
      c.fill();
    }
  }

  #fracBar(x, y, w, h) {
    const c = this.ctx;
    c.fillStyle = ON;
    const t = h * 0.1;
    c.fillRect(x + w * 0.15, y + h * 0.16, w * 0.7, t);
    c.fillRect(x + w * 0.15, y + h * 0.16, t * 0.9, h * 0.52);
  }

  #degree(x, y, w, h) {
    const c = this.ctx;
    c.fillStyle = ON;
    c.lineWidth = h * 0.075;
    c.strokeStyle = ON;
    c.beginPath();
    c.arc(x + w * 0.45, y + h * 0.2, w * 0.22, 0, Math.PI * 2);
    c.stroke();
  }

  #imag(x, y, w, h) {
    const c = this.ctx;
    c.fillStyle = ON;
    const t = w * 0.2;
    c.fillRect(x + w * 0.4, y + h * 0.34, t, h * 0.62);
    c.fillRect(x + w * 0.4, y + h * 0.14, t, t * 0.9);
  }

  #angle(x, y, w, h) {
    const c = this.ctx;
    c.strokeStyle = ON;
    c.lineWidth = h * 0.08;
    c.beginPath();
    c.moveTo(x + w * 0.9, y + h * 0.2);
    c.lineTo(x + w * 0.1, y + h * 0.92);
    c.lineTo(x + w * 0.92, y + h * 0.92);
    c.stroke();
  }
}
