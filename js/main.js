// main.js — wires the machine to the reconstructed shell: one transparent
// hotspot per real key, a canvas laid exactly over the glass, and the physical
// keyboard mapped onto the same key ids.

import { KEYS, SHELL_W, SHELL_H, PC_KEYS } from './keymap.js';
import { LCD, GLASS } from './lcd.js';
import { Machine } from './machine.js';
import { setupProgramStudio } from './studio.js?v=core-guide-20260729';

const shell = document.getElementById('shell');
const canvas = document.getElementById('lcd');
const accessibleDisplay = document.getElementById('lcd-accessible');
const machine = new Machine();
const lcd = new LCD(canvas);

const pct = (v, total) => (v / total) * 100 + '%';

// ---- glass -----------------------------------------------------------------
Object.assign(canvas.style, {
  left: pct(GLASS.x, SHELL_W), top: pct(GLASS.y, SHELL_H),
  width: pct(GLASS.w, SHELL_W), height: pct(GLASS.h, SHELL_H)
});

// ---- hotspots --------------------------------------------------------------
const buttons = new Map();
for (const k of KEYS) {
  const b = document.createElement('button');
  b.className = 'key' + (k.pad ? ' pad' : '') + (k.orange ? ' orange' : '');
  b.type = 'button';
  b.dataset.id = k.id;
  const functions = [
    k.shift && `SHIFT: ${k.shift}`,
    k.alpha && `ALPHA: ${k.alpha}`,
    k.basen && `BASE: ${k.basen}`,
    k.cmplx && `CMPLX: ${k.cmplx}`,
    k.stat && `statistics: ${k.stat}`,
    k.statShift && `statistics SHIFT: ${k.statShift}`,
    k.hex && `hexadecimal digit ${k.hex}`
  ].filter(Boolean);
  const keyLabel = `${k.base} key${functions.length ? `. ${functions.join('. ')}` : ''}`;
  b.setAttribute('aria-label', keyLabel);
  b.title = keyLabel;
  Object.assign(b.style, {
    left: pct(k.x, SHELL_W), top: pct(k.y, SHELL_H),
    width: pct(k.w, SHELL_W), height: pct(k.h, SHELL_H)
  });
  shell.appendChild(b);
  buttons.set(k.id, b);
}

let blink = true;
let dirty = true;

const studioController = setupProgramStudio(machine, () => {
  blink = true;
  lastBlink = performance.now();
  dirty = true;
});

function tap(id) {
  const b = buttons.get(id);
  if (b) {
    b.classList.add('down');
    setTimeout(() => b.classList.remove('down'), 90);
  }
  machine.press(id);
  studioController.syncFromMachine();
  blink = true;
  lastBlink = performance.now();
  dirty = true;
}

// Pointer down gives the key its tactile feel. The click listener is the
// fallback that makes the keys reachable by Tab and Enter, and by anything
// that synthesises a click without a pointer event; it stands down whenever a
// pointer gesture has just handled the same press.
let lastPointer = 0;

shell.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('.key');
  if (!b) return;
  e.preventDefault();
  lastPointer = performance.now();
  tap(b.dataset.id);
});

shell.addEventListener('click', (e) => {
  const b = e.target.closest('.key');
  if (!b || performance.now() - lastPointer < 700) return;
  tap(b.dataset.id);
});

// ---- physical keyboard ------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.target.closest('textarea, input, select, [contenteditable="true"]')) return;
  if (e.metaKey || e.ctrlKey) return;
  let m = PC_KEYS[e.key];
  if (m === undefined && e.key.length === 1) m = PC_KEYS[e.key.toLowerCase()];
  if (m === undefined) return;
  e.preventDefault();
  if (m.startsWith('!')) { tap('SHIFT'); tap(m.slice(1)); }
  else tap(m);
});

// ---- render loop ------------------------------------------------------------
let lastBlink = performance.now();
let lastAnnouncement = '';

function describeView(v) {
  const parts = [];
  const indicators = [...(v.indicators || [])];
  if (indicators.length) parts.push(`Indicators: ${indicators.join(', ')}`);
  if (v.line1 && v.line1.trim()) parts.push(`Upper display: ${v.line1.trim()}`);
  const lower = [v.left, v.line2].filter(Boolean).join(' ');
  if (lower) parts.push(`Lower display: ${lower}${v.exp ? ` times ten to ${v.exp}` : ''}`);
  return parts.join('. ') || 'Display blank';
}

function frame(now) {
  if (now - lastBlink > 480) { blink = !blink; lastBlink = now; dirty = true; }
  if (dirty) {
    const v = machine.view();
    v.blinkOn = blink;
    lcd.render(v);
    const announcement = describeView(v);
    if (announcement !== lastAnnouncement) {
      accessibleDisplay.textContent = announcement;
      lastAnnouncement = announcement;
    }
    document.body.classList.toggle('shifted', machine.shift);
    document.body.classList.toggle('alphaed', machine.alpha);
    dirty = false;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---- help panel -------------------------------------------------------------
const help = document.getElementById('help');
const helpToggle = document.getElementById('help-toggle');
helpToggle.addEventListener('click', () => {
  help.hidden = !help.hidden;
  helpToggle.setAttribute('aria-expanded', String(!help.hidden));
});

window.fx = machine;   // handy for poking at state from the console
