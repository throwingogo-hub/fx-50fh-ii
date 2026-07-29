// Program Studio: a friendly, persistent editor over the calculator's four
// authentic Program objects. Nothing here is a second interpreter.

import { Program, PROGRAM_MEMORY } from './program.js';
import { bytesOf } from './tokens.js';
import { formatProgramText, parseProgramText } from './program-codec.js';

const STORAGE_KEY = 'fx50fhii.program-studio.v2';
const MODES = new Set(['COMP', 'CMPLX', 'BASE', 'SD', 'REG']);

const COMMANDS = [
  ['Flow', [['If', 'If '], ['Then', 'Then '], ['Else', 'Else '], ['IfEnd', 'IfEnd']]],
  ['Loops', [['For', 'For '], ['To', ' To '], ['Step', ' Step '], ['Next', 'Next'], ['While', 'While '], ['WhileEnd', 'WhileEnd'], ['Break', 'Break']]],
  ['Jump', [['Goto', 'Goto '], ['Lbl', 'Lbl '], ['⇒', '⇒']]],
  ['I/O', [['?', '?'], ['→', '→'], ['◢', '◢'], [':', '\n']]],
  ['Setup', [['Deg', 'Deg'], ['Rad', 'Rad'], ['Gra', 'Gra'], ['Fix', 'Fix '], ['Sci', 'Sci '], ['Norm', 'Norm '], ['ClrMem', 'ClrMemory'], ['ClrStat', 'ClrStat']]],
  ['Math', [['sin(', 'sin('], ['cos(', 'cos('], ['tan(', 'tan('], ['√(', '√('], ['π', 'π'], ['Ans', 'Ans'], ['×', '×'], ['÷', '÷']]]
];

export function setupProgramStudio(machine, onMachineChange) {
  const studio = document.getElementById('studio');
  const toggle = document.getElementById('studio-toggle');
  const slotsEl = document.getElementById('program-slots');
  const slotButtons = [...slotsEl.querySelectorAll('[data-slot]')];
  const source = document.getElementById('program-source');
  const mode = document.getElementById('studio-mode');
  const feedback = document.getElementById('program-feedback');
  const byteText = document.getElementById('program-bytes');
  const byteFill = document.getElementById('byte-fill');
  const saveState = document.getElementById('studio-save-state');
  const editorLabel = studio.querySelector('.editor-label');
  const clearButton = studio.querySelector('[data-studio-action="clear"]');
  const palette = document.getElementById('command-palette');

  let selected = 0;
  let drafts = [null, null, null, null];
  let inputTimer = 0;
  let lastValid = true;
  let clearArmed = false;
  let clearTimer = 0;

  function programFor(slot) { return machine.programs[slot]; }

  function deriveDraft(slot) {
    const program = programFor(slot);
    const activeTokens = machine.prog?.stage === 'edit' && machine.prog.slot === slot
      ? machine.prog.tokens
      : null;
    return {
      mode: program?.mode || 'COMP',
      source: activeTokens
        ? formatProgramText(activeTokens)
        : (program ? formatProgramText(program.tokens) : '')
    };
  }

  function loadStorage() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || saved.version !== 2) return;
      machine.restoreProgramSnapshot(saved.machine);
      selected = Math.max(0, Math.min(3, Number(saved.selected) || 0));
      if (Array.isArray(saved.drafts)) {
        drafts = drafts.map((_, index) => {
          const draft = saved.drafts[index];
          return draft && MODES.has(draft.mode)
            ? { mode: draft.mode, source: String(draft.source || '') }
            : deriveDraft(index);
        });
      }
      const parsedDrafts = drafts.map((draft) => draft
        ? parseProgramText(draft.source, draft.mode)
        : null);
      const draftBytes = parsedDrafts.reduce((sum, parsed) => sum + (parsed?.bytes || 0), 0);
      if (draftBytes <= PROGRAM_MEMORY) {
        parsedDrafts.forEach((parsed, index) => {
          const existed = Boolean(saved.machine?.slots?.[index]);
          if (parsed && !parsed.errors.length && (drafts[index].source.trim() || existed)) {
            machine.setStudioProgram(index, drafts[index].mode, parsed.tokenIds);
          }
        });
      }
    } catch {
      // Corrupt or blocked storage never prevents the calculator from loading.
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 2,
        selected,
        machine: machine.programSnapshot(),
        drafts,
        updatedAt: Date.now()
      }));
      saveState.textContent = 'saved';
    } catch {
      saveState.textContent = 'not saved';
    }
  }

  function totalBytesWith(slot, slotBytes) {
    return machine.programs.reduce((sum, program, index) =>
      sum + (index === slot ? slotBytes : (program ? bytesOf(program.tokens) : 0)), 0);
  }

  function inspectEditor(commit = false) {
    const parsed = parseProgramText(source.value, mode.value);
    const total = totalBytesWith(selected, parsed.bytes);
    let message = '';
    let storable = true;
    let runnable = true;

    if (parsed.errors.length) {
      const first = parsed.errors[0];
      message = `Unknown “${first.character}” at character ${first.index + 1}.`;
      storable = false;
      runnable = false;
    } else if (total > PROGRAM_MEMORY) {
      message = `${total - PROGRAM_MEMORY} bytes over shared memory.`;
      storable = false;
      runnable = false;
    } else {
      try {
        new Program(mode.value, parsed.tokens).start(machine);
        message = parsed.tokens.length
          ? `Structure OK · ${parsed.tokens.length} token${parsed.tokens.length === 1 ? '' : 's'}`
          : 'Empty program — ready.';
      } catch (error) {
        message = `Draft saved · ${error.message || 'program structure is incomplete.'}`;
        runnable = false;
      }
    }

    source.classList.toggle('invalid', !runnable);
    feedback.classList.toggle('error', !runnable);
    feedback.textContent = message;
    byteText.textContent = `${total} / ${PROGRAM_MEMORY} bytes`;
    const ratio = Math.min(1, total / PROGRAM_MEMORY);
    byteFill.style.width = `${ratio * 100}%`;
    byteFill.classList.toggle('warning', ratio > .82);
    lastValid = storable;

    drafts[selected] = { mode: mode.value, source: source.value };
    if (commit && storable) {
      machine.setStudioProgram(selected, mode.value, parsed.tokenIds);
      onMachineChange();
    }
    persist();
    renderSlots();
    return { storable, runnable, parsed };
  }

  function renderSlots() {
    slotButtons.forEach((button, index) => {
      const program = programFor(index);
      const draft = drafts[index] || deriveDraft(index);
      const parsed = parseProgramText(draft.source, draft.mode);
      button.setAttribute('aria-selected', String(index === selected));
      button.querySelector('span').textContent = draft.source
        ? `${draft.mode} · ${parsed.bytes}B`
        : (program ? `${program.mode} · ${program.bytes}B` : 'empty');
    });
  }

  function showSlot(slot) {
    clearArmed = false;
    clearTimeout(clearTimer);
    selected = slot;
    const draft = drafts[slot] || deriveDraft(slot);
    drafts[slot] = draft;
    mode.value = draft.mode;
    source.value = draft.source;
    editorLabel.textContent = `P${slot + 1} source`;
    clearButton.textContent = `Clear P${slot + 1}`;
    inspectEditor(false);
    renderSlots();
  }

  function insertAtCursor(text) {
    source.setRangeText(text, source.selectionStart, source.selectionEnd, 'end');
    source.focus();
    source.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function buildPalette() {
    for (const [name, commands] of COMMANDS) {
      const group = document.createElement('div');
      group.className = 'command-group';
      const label = document.createElement('span');
      label.textContent = name;
      const buttons = document.createElement('div');
      buttons.className = 'command-buttons';
      for (const [caption, value] of commands) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = caption;
        button.addEventListener('click', () => insertAtCursor(value));
        buttons.appendChild(button);
      }
      group.append(label, buttons);
      palette.appendChild(group);
    }
  }

  async function copyProgram() {
    try {
      await navigator.clipboard.writeText(source.value);
      saveState.textContent = 'copied';
    } catch {
      source.select();
      document.execCommand('copy');
      saveState.textContent = 'copied';
    }
  }

  async function pasteProgram() {
    try {
      const text = await navigator.clipboard.readText();
      source.setRangeText(text, source.selectionStart, source.selectionEnd, 'end');
      source.dispatchEvent(new Event('input', { bubbles: true }));
      source.focus();
    } catch {
      source.focus();
      feedback.textContent = 'Clipboard access was blocked — press ⌘V or Ctrl+V here.';
    }
  }

  loadStorage();
  for (let i = 0; i < drafts.length; i++) if (!drafts[i]) drafts[i] = deriveDraft(i);
  buildPalette();
  showSlot(selected);

  toggle.addEventListener('click', () => {
    const opening = studio.hidden;
    studio.hidden = !opening;
    toggle.setAttribute('aria-expanded', String(opening));
    if (opening) {
      navigator.storage?.persist?.().catch(() => {});
      studio.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  slotsEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-slot]');
    if (button) showSlot(Number(button.dataset.slot));
  });

  source.addEventListener('input', () => {
    saveState.textContent = 'saving';
    drafts[selected] = { mode: mode.value, source: source.value };
    persist(); // raw text is recoverable even before it becomes valid
    clearTimeout(inputTimer);
    inputTimer = setTimeout(() => inspectEditor(true), 120);
  });

  mode.addEventListener('change', () => inspectEditor(true));

  studio.addEventListener('click', async (event) => {
    const action = event.target.closest('[data-studio-action]')?.dataset.studioAction;
    if (!action) return;
    if (action === 'copy') return copyProgram();
    if (action === 'paste') return pasteProgram();

    const state = inspectEditor(true);
    if (action === 'run' && !state.runnable) return;
    if (action === 'edit-calculator' && !state.storable) return;
    if (action === 'run') {
      machine.prog = null;
      machine.mode = 'COMP';
      machine.error = null;
      machine.runProgram(selected);
      onMachineChange();
      document.getElementById('stage').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (action === 'edit-calculator') {
      machine.editProgramSlot(selected);
      onMachineChange();
      document.getElementById('stage').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (action === 'clear') {
      if (!clearArmed) {
        clearArmed = true;
        clearButton.textContent = `Confirm clear P${selected + 1}`;
        feedback.textContent = 'Click confirm clear once more — this cannot be undone.';
        clearTimer = setTimeout(() => showSlot(selected), 4000);
        return;
      }
      machine.clearStudioProgram(selected);
      drafts[selected] = { mode: 'COMP', source: '' };
      showSlot(selected);
      onMachineChange();
    }
  });

  window.addEventListener('pagehide', persist);

  return {
    persist,
    syncFromMachine() {
      if (document.activeElement === source && !lastValid) { persist(); return; }
      for (let i = 0; i < drafts.length; i++) drafts[i] = deriveDraft(i);
      showSlot(selected);
      persist();
    }
  };
}
