// Program Studio: persistent editing, a curated HKDSE library and protected
// backup/install workflows over the calculator's authentic Program objects.
// Nothing here is a second interpreter.

import { Program, PROGRAM_MEMORY } from './program.js';
import { bytesOf } from './tokens.js';
import { formatProgramText, parseProgramText } from './program-codec.js';
import { PROGRAMS, PROGRAM_PACKS, PROGRAM_BY_ID } from './program-catalog.generated.js?v=coefficient-k-v1';

const STORAGE_KEY = 'fx50fhii.program-studio.v3';
const LEGACY_STORAGE_KEY = 'fx50fhii.program-studio.v2';
const STORAGE_VERSION = 3;
const BACKUP_FORMAT = 'fx-50fh-ii-program-backup';
const BACKUP_VERSION = 1;
const MODES = new Set(['COMP', 'CMPLX', 'BASE', 'SD', 'REG']);
const SLOT_COUNT = 4;

const COMMANDS = [
  ['Flow', [['If', 'If '], ['Then', 'Then '], ['Else', 'Else '], ['IfEnd', 'IfEnd']]],
  ['Loops', [['For', 'For '], ['To', ' To '], ['Step', ' Step '], ['Next', 'Next'], ['While', 'While '], ['WhileEnd', 'WhileEnd'], ['Break', 'Break']]],
  ['Jump', [['Goto', 'Goto '], ['Lbl', 'Lbl '], ['⇒', '⇒']]],
  ['I/O', [['?', '?'], ['→', '→'], ['◢', '◢'], [':', '\n']]],
  ['Setup', [['Deg', 'Deg'], ['Rad', 'Rad'], ['Gra', 'Gra'], ['Fix', 'Fix '], ['Sci', 'Sci '], ['Norm', 'Norm '], ['ClrMem', 'ClrMemory'], ['ClrStat', 'ClrStat']]],
  ['Math', [['sin(', 'sin('], ['cos(', 'cos('], ['tan(', 'tan('], ['√(', '√('], ['π', 'π'], ['Ans', 'Ans'], ['×', '×'], ['÷', '÷']]]
];

const CATEGORY_ACCENTS = {
  Algebra: '#b24f31', Sequences: '#5f6f9c', Coordinate: '#2f7663',
  Trigonometry: '#9a6830', Finance: '#7d5b86', Statistics: '#467b83',
  Geometry: '#966142', Probability: '#526e3c', Variation: '#7b6041'
};

const clone = value => JSON.parse(JSON.stringify(value));
const clampSlot = value => Math.max(0, Math.min(SLOT_COUNT - 1, Number(value) || 0));
const slotName = slot => `P${slot + 1}`;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const scrollBehavior = () => reducedMotion() ? 'auto' : 'smooth';

export function filterProgramCatalog(query = '', category = 'All') {
  const needle = query.trim().toLocaleLowerCase();
  return PROGRAMS.filter(program => {
    if (category !== 'All' && program.category !== category) return false;
    if (!needle) return true;
    return [program.id, program.title, program.category, program.summary, ...program.topics]
      .join(' ').toLocaleLowerCase().includes(needle);
  });
}

export function packBytes(pack) {
  return pack.programIds.reduce((sum, id) => sum + PROGRAM_BY_ID.get(id).bytes, 0);
}

export function createProgramBackup(drafts, machineSnapshot, exportedAt = new Date().toISOString()) {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt,
    machine: clone(machineSnapshot),
    drafts: clone(drafts)
  };
}

export function parseProgramBackup(value) {
  const backup = typeof value === 'string' ? JSON.parse(value) : value;
  if (!backup || backup.format !== BACKUP_FORMAT || backup.version !== BACKUP_VERSION) {
    throw new Error('This is not an fx-50FH II Program Studio backup.');
  }
  if (!backup.machine || backup.machine.version !== 1 || !Array.isArray(backup.machine.slots) || backup.machine.slots.length !== SLOT_COUNT) {
    throw new Error('The backup has an invalid calculator snapshot.');
  }
  if (!Array.isArray(backup.drafts) || backup.drafts.length !== SLOT_COUNT) {
    throw new Error('The backup must contain exactly four slots.');
  }
  const drafts = backup.drafts.map((draft, index) => {
    if (!draft || !MODES.has(draft.mode) || typeof draft.source !== 'string' || draft.source.length > 20000) {
      throw new Error(`The ${slotName(index)} draft is invalid.`);
    }
    return { mode: draft.mode, source: draft.source };
  });
  return { machine: clone(backup.machine), drafts };
}

export function setupProgramStudio(machine, onMachineChange) {
  const studio = document.getElementById('studio');
  const toggle = document.getElementById('studio-toggle');
  const viewTabs = [...document.querySelectorAll('#studio-view-tabs [role="tab"]')];
  const editorView = document.getElementById('studio-editor-view');
  const libraryView = document.getElementById('program-library-view');
  const slotsEl = document.getElementById('program-slots');
  const slotButtons = [...slotsEl.querySelectorAll('[data-slot]')];
  const editorPanel = document.getElementById('program-editor-panel');
  const source = document.getElementById('program-source');
  const mode = document.getElementById('studio-mode');
  const feedback = document.getElementById('program-feedback');
  const byteText = document.getElementById('program-bytes');
  const byteFill = document.getElementById('byte-fill');
  const saveState = document.getElementById('studio-save-state');
  const editorLabel = studio.querySelector('.editor-label');
  const clearButton = studio.querySelector('[data-studio-action="clear"]');
  const undoButton = document.getElementById('studio-undo');
  const backupFile = document.getElementById('studio-backup-file');
  const importButton = studio.querySelector('[data-studio-action="import-backup"]');
  const palette = document.getElementById('command-palette');
  const librarySearch = document.getElementById('library-search');
  const librarySlot = document.getElementById('library-slot');
  const libraryFilters = document.getElementById('library-filters');
  const libraryStatus = document.getElementById('library-status');
  const libraryCount = document.getElementById('library-result-count');
  const libraryGrid = document.getElementById('program-library-grid');
  const libraryEmpty = document.getElementById('library-empty');
  const packsEl = document.getElementById('program-packs');
  const libraryMemoryLabel = document.getElementById('library-memory-label');
  const libraryMemoryFill = document.getElementById('library-memory-fill');

  let selected = 0;
  let drafts = [null, null, null, null];
  let inputTimer = 0;
  let lastValid = true;
  let clearArmed = false;
  let clearTimer = 0;
  let selectedCategory = 'All';
  let undoState = null;
  let pendingImport = null;
  let confirmationKey = '';
  let confirmationTimer = 0;
  let currentView = 'editor';

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

  function captureState() {
    return { machine: machine.programSnapshot(), drafts: clone(drafts), selected };
  }

  function restoreState(state) {
    if (!state || !machine.restoreProgramSnapshot(state.machine) || !Array.isArray(state.drafts) || state.drafts.length !== SLOT_COUNT) return false;
    drafts = state.drafts.map((draft, index) => draft && MODES.has(draft.mode) && typeof draft.source === 'string'
      ? { mode: draft.mode, source: draft.source }
      : deriveDraft(index));
    selected = clampSlot(state.selected);
    showSlot(selected);
    onMachineChange();
    return true;
  }

  function loadStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      const saved = JSON.parse(raw || 'null');
      if (!saved || ![2, STORAGE_VERSION].includes(saved.version)) return;
      machine.restoreProgramSnapshot(saved.machine);
      selected = clampSlot(saved.selected);
      if (Array.isArray(saved.drafts)) {
        drafts = drafts.map((_, index) => {
          const draft = saved.drafts[index];
          return draft && MODES.has(draft.mode)
            ? { mode: draft.mode, source: String(draft.source || '') }
            : deriveDraft(index);
        });
      }
      const parsedDrafts = drafts.map(draft => draft ? parseProgramText(draft.source, draft.mode) : null);
      const draftBytes = parsedDrafts.reduce((sum, parsed) => sum + (parsed?.bytes || 0), 0);
      if (draftBytes <= PROGRAM_MEMORY) {
        parsedDrafts.forEach((parsed, index) => {
          const existed = Boolean(saved.machine?.slots?.[index]);
          if (parsed && !parsed.errors.length && (drafts[index].source.trim() || existed)) {
            machine.setStudioProgram(index, drafts[index].mode, parsed.tokenIds);
          }
        });
      }
      if (saved.version === STORAGE_VERSION && saved.undoState) undoState = saved.undoState;
    } catch {
      // Corrupt or blocked storage never prevents the calculator from loading.
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: STORAGE_VERSION,
        selected,
        machine: machine.programSnapshot(),
        drafts,
        undoState,
        updatedAt: Date.now()
      }));
      saveState.textContent = 'saved';
    } catch {
      saveState.textContent = 'not saved';
    }
    undoButton.hidden = !undoState;
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
    renderLibraryMemory();
    return { storable, runnable, parsed };
  }

  function renderSlots() {
    slotButtons.forEach((button, index) => {
      const program = programFor(index);
      const draft = drafts[index] || deriveDraft(index);
      const parsed = parseProgramText(draft.source, draft.mode);
      const active = index === selected;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      button.querySelector('span').textContent = draft.source
        ? `${draft.mode} · ${parsed.bytes}B`
        : (program ? `${program.mode} · ${program.bytes}B` : 'empty');
    });
    editorPanel.setAttribute('aria-labelledby', `slot-tab-${selected + 1}`);
    librarySlot.value = String(selected);
  }

  function showSlot(slot) {
    clearArmed = false;
    clearTimeout(clearTimer);
    selected = clampSlot(slot);
    const draft = drafts[selected] || deriveDraft(selected);
    drafts[selected] = draft;
    mode.value = draft.mode;
    source.value = draft.source;
    editorLabel.textContent = `${slotName(selected)} source`;
    clearButton.textContent = `Clear ${slotName(selected)}`;
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

  function setView(view, focusTab = false) {
    currentView = view;
    const library = view === 'library';
    editorView.hidden = library;
    libraryView.hidden = !library;
    viewTabs.forEach((tab, index) => {
      const active = library ? index === 1 : index === 0;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focusTab) tab.focus();
    });
    if (library) renderLibrary();
  }

  function moveTab(buttons, current, key, activate) {
    const index = buttons.indexOf(current);
    if (index < 0) return false;
    let next = index;
    if (key === 'ArrowRight' || key === 'ArrowDown') next = (index + 1) % buttons.length;
    else if (key === 'ArrowLeft' || key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
    else if (key === 'Home') next = 0;
    else if (key === 'End') next = buttons.length - 1;
    else return false;
    activate(next);
    buttons[next].focus();
    return true;
  }

  function renderLibraryMemory() {
    const used = machine.programs.reduce((sum, program) => sum + (program ? program.bytes : 0), 0);
    const ratio = used / PROGRAM_MEMORY;
    libraryMemoryLabel.textContent = `${used} / ${PROGRAM_MEMORY}B used`;
    libraryMemoryFill.style.width = `${Math.min(1, ratio) * 100}%`;
    libraryMemoryFill.classList.toggle('warning', ratio > .82);
  }

  function clearConfirmation() {
    confirmationKey = '';
    clearTimeout(confirmationTimer);
  }

  function requireReplacementConfirmation(key, button, label) {
    if (confirmationKey === key) {
      clearConfirmation();
      return true;
    }
    confirmationKey = key;
    button.classList.add('confirming');
    button.textContent = label;
    libraryStatus.textContent = 'Existing program data will be replaced. Confirm once more.';
    clearTimeout(confirmationTimer);
    confirmationTimer = setTimeout(() => { clearConfirmation(); renderLibrary(); }, 5000);
    return false;
  }

  function rememberUndo() {
    undoState = captureState();
    persist();
  }

  function installProgram(program, slot, button) {
    const occupied = Boolean(drafts[slot]?.source.trim());
    if (occupied && !requireReplacementConfirmation(`program:${program.id}:${slot}`, button, `Replace ${slotName(slot)}?`)) return;
    const parsed = parseProgramText(program.source, program.mode);
    const total = totalBytesWith(slot, parsed.bytes);
    if (parsed.errors.length || total > PROGRAM_MEMORY) {
      libraryStatus.textContent = total > PROGRAM_MEMORY
        ? `This install needs ${total - PROGRAM_MEMORY} more bytes. Clear another slot first.`
        : 'The catalog source did not parse. No slot was changed.';
      return;
    }
    rememberUndo();
    machine.setStudioProgram(slot, program.mode, parsed.tokenIds);
    drafts[slot] = { mode: program.mode, source: program.source };
    selected = slot;
    showSlot(slot);
    persist();
    onMachineChange();
    libraryStatus.textContent = `${program.title} installed in ${slotName(slot)}. Undo is available in Editor.`;
    saveState.textContent = 'installed';
    renderLibrary();
  }

  function installPack(pack, button) {
    const occupied = drafts.some(draft => draft?.source.trim());
    if (occupied && !requireReplacementConfirmation(`pack:${pack.id}`, button, 'Replace all four?')) return;
    const entries = pack.programIds.map(id => {
      const program = PROGRAM_BY_ID.get(id);
      const parsed = parseProgramText(program.source, program.mode);
      return { program, parsed };
    });
    const snapshot = {
      version: 1,
      slots: entries.map(({ program, parsed }) => ({ mode: program.mode, tokens: parsed.tokenIds }))
    };
    rememberUndo();
    if (!machine.restoreProgramSnapshot(snapshot)) {
      undoState = null;
      persist();
      libraryStatus.textContent = 'The pack could not be installed. No slot was changed.';
      return;
    }
    drafts = entries.map(({ program }) => ({ mode: program.mode, source: program.source }));
    selected = 0;
    showSlot(0);
    persist();
    onMachineChange();
    libraryStatus.textContent = `${pack.name} installed across P1–P4. Undo is available in Editor.`;
    saveState.textContent = 'pack installed';
    renderLibrary();
  }

  function renderFilters() {
    const categories = ['All', ...new Set(PROGRAMS.map(program => program.category))];
    libraryFilters.replaceChildren(...categories.map(category => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.category = category;
      button.setAttribute('aria-pressed', String(category === selectedCategory));
      button.textContent = category;
      return button;
    }));
  }

  function renderPacks() {
    packsEl.replaceChildren(...PROGRAM_PACKS.map(pack => {
      const card = document.createElement('article');
      card.className = 'pack-card';
      const total = packBytes(pack);
      const installed = pack.programIds.every((id, slot) => drafts[slot]?.source.trim() === PROGRAM_BY_ID.get(id).source.trim());
      const title = document.createElement('h3');
      title.textContent = pack.name;
      const description = document.createElement('p');
      description.textContent = pack.description;
      const slots = document.createElement('div');
      slots.className = 'pack-slots';
      pack.programIds.forEach((id, slot) => {
        const tag = document.createElement('span');
        tag.textContent = `${slotName(slot)} · ${id}`;
        slots.appendChild(tag);
      });
      const footer = document.createElement('footer');
      const bytes = document.createElement('span');
      bytes.textContent = `${total}B`;
      const install = document.createElement('button');
      install.type = 'button';
      install.dataset.libraryAction = 'install-pack';
      install.dataset.packId = pack.id;
      install.disabled = installed;
      install.textContent = installed ? 'Installed' : 'Load pack';
      footer.append(bytes, install);
      card.append(title, description, slots, footer);
      return card;
    }));
  }

  function renderPrograms() {
    const programs = filterProgramCatalog(librarySearch.value, selectedCategory);
    libraryCount.textContent = `${programs.length} program${programs.length === 1 ? '' : 's'}`;
    libraryEmpty.hidden = programs.length !== 0;
    const slot = clampSlot(librarySlot.value);
    libraryGrid.replaceChildren(...programs.map(program => {
      const card = document.createElement('article');
      card.className = 'program-card';
      card.style.setProperty('--card-accent', CATEGORY_ACCENTS[program.category] || '#2f7663');

      const head = document.createElement('div');
      head.className = 'program-card-head';
      const identity = document.createElement('div');
      const id = document.createElement('span');
      id.className = 'program-id';
      id.textContent = `${program.id} · ${program.category}`;
      const title = document.createElement('h3');
      title.textContent = program.title;
      identity.append(id, title);
      const bytes = document.createElement('span');
      bytes.className = 'program-bytes';
      bytes.textContent = `${program.bytes}B`;
      head.append(identity, bytes);

      const summary = document.createElement('p');
      summary.className = 'program-summary';
      summary.textContent = program.summary;

      const details = document.createElement('details');
      const detailsSummary = document.createElement('summary');
      detailsSummary.textContent = 'Inputs, outputs & example';
      const reveal = document.createElement('div');
      reveal.className = 'program-details-content';
      const revealInner = document.createElement('div');
      const list = document.createElement('dl');
      for (const [term, value] of [['Inputs', program.inputs], ['Outputs', program.outputs], ['Example', program.example]]) {
        const dt = document.createElement('dt');
        dt.textContent = term;
        const dd = document.createElement('dd');
        dd.textContent = value;
        list.append(dt, dd);
      }
      const code = document.createElement('pre');
      code.textContent = program.source;
      revealInner.append(list, code);
      reveal.appendChild(revealInner);
      details.append(detailsSummary, reveal);

      const install = document.createElement('button');
      install.type = 'button';
      install.dataset.libraryAction = 'install-program';
      install.dataset.programId = program.id;
      const installed = drafts[slot]?.source.trim() === program.source.trim();
      const projected = totalBytesWith(slot, program.bytes);
      install.disabled = installed || projected > PROGRAM_MEMORY;
      install.textContent = installed
        ? `Installed in ${slotName(slot)}`
        : projected > PROGRAM_MEMORY
          ? `Needs ${projected - PROGRAM_MEMORY}B free`
          : `Install to ${slotName(slot)} · ${program.bytes}B`;
      card.append(head, summary, details, install);
      return card;
    }));
  }

  function renderLibrary() {
    renderLibraryMemory();
    renderFilters();
    renderPacks();
    renderPrograms();
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

  function exportBackup() {
    const backup = createProgramBackup(drafts, machine.programSnapshot());
    const blob = new Blob([JSON.stringify(backup, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fx-50fh-ii-programs-${backup.exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    saveState.textContent = 'exported';
    feedback.textContent = 'All four slots exported as a versioned backup.';
  }

  function applyImport() {
    if (!pendingImport) { backupFile.click(); return; }
    rememberUndo();
    if (!machine.restoreProgramSnapshot(pendingImport.machine)) {
      undoState = null;
      pendingImport = null;
      importButton.textContent = 'Import backup';
      feedback.textContent = 'Backup rejected: invalid program data or more than 680 bytes.';
      persist();
      return;
    }
    drafts = clone(pendingImport.drafts);
    pendingImport = null;
    importButton.textContent = 'Import backup';
    selected = 0;
    showSlot(0);
    persist();
    onMachineChange();
    feedback.textContent = 'Backup restored across all four slots. Undo is available.';
    saveState.textContent = 'restored';
    renderLibrary();
  }

  loadStorage();
  for (let i = 0; i < drafts.length; i++) if (!drafts[i]) drafts[i] = deriveDraft(i);
  buildPalette();
  showSlot(selected);
  renderLibrary();
  persist();

  toggle.addEventListener('click', async () => {
    const opening = studio.hidden;
    toggle.setAttribute('aria-expanded', String(opening));
    if (opening) {
      studio.classList.remove('studio-leave');
      studio.hidden = false;
      navigator.storage?.persist?.().catch(() => {});
      studio.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
      return;
    }
    if (reducedMotion()) {
      studio.hidden = true;
      return;
    }
    studio.classList.add('studio-leave');
    await new Promise(resolve => {
      const done = () => { studio.removeEventListener('animationend', done); resolve(); };
      studio.addEventListener('animationend', done, { once: true });
      setTimeout(done, 230);
    });
    studio.hidden = true;
    studio.classList.remove('studio-leave');
  });

  document.getElementById('studio-view-tabs').addEventListener('click', event => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) setView(tab.id === 'library-tab' ? 'library' : 'editor');
  });
  document.getElementById('studio-view-tabs').addEventListener('keydown', event => {
    if (moveTab(viewTabs, event.target.closest('[role="tab"]'), event.key, index => setView(index ? 'library' : 'editor'))) event.preventDefault();
  });

  slotsEl.addEventListener('click', event => {
    const button = event.target.closest('[data-slot]');
    if (button) showSlot(Number(button.dataset.slot));
  });
  slotsEl.addEventListener('keydown', event => {
    if (moveTab(slotButtons, event.target.closest('[data-slot]'), event.key, index => showSlot(index))) event.preventDefault();
  });

  source.addEventListener('input', () => {
    saveState.textContent = 'saving';
    drafts[selected] = { mode: mode.value, source: source.value };
    persist(); // raw text is recoverable even before it becomes valid
    clearTimeout(inputTimer);
    inputTimer = setTimeout(() => inspectEditor(true), 120);
  });

  mode.addEventListener('change', () => inspectEditor(true));
  librarySearch.addEventListener('input', renderPrograms);
  librarySlot.addEventListener('change', () => {
    showSlot(Number(librarySlot.value));
    renderPrograms();
  });
  libraryFilters.addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    selectedCategory = button.dataset.category;
    renderFilters();
    renderPrograms();
  });
  libraryView.addEventListener('click', event => {
    const button = event.target.closest('[data-library-action]');
    if (!button) return;
    if (button.dataset.libraryAction === 'install-program') {
      installProgram(PROGRAM_BY_ID.get(button.dataset.programId), clampSlot(librarySlot.value), button);
    } else if (button.dataset.libraryAction === 'install-pack') {
      installPack(PROGRAM_PACKS.find(pack => pack.id === button.dataset.packId), button);
    }
  });

  backupFile.addEventListener('change', async () => {
    const file = backupFile.files?.[0];
    backupFile.value = '';
    if (!file) return;
    try {
      pendingImport = parseProgramBackup(await file.text());
      importButton.textContent = 'Apply backup';
      feedback.textContent = 'Backup checked. Click Apply backup to replace all four slots.';
      saveState.textContent = 'ready to restore';
    } catch (error) {
      pendingImport = null;
      importButton.textContent = 'Import backup';
      feedback.textContent = error.message || 'The backup could not be read.';
      saveState.textContent = 'import rejected';
    }
  });

  studio.addEventListener('click', async event => {
    const action = event.target.closest('[data-studio-action]')?.dataset.studioAction;
    if (!action) return;
    if (action === 'copy') return copyProgram();
    if (action === 'paste') return pasteProgram();
    if (action === 'export-backup') return exportBackup();
    if (action === 'import-backup') return applyImport();
    if (action === 'undo-install') {
      const previous = undoState;
      undoState = null;
      if (restoreState(previous)) {
        feedback.textContent = 'Previous four-slot state restored.';
        saveState.textContent = 'undone';
        renderLibrary();
      }
      persist();
      return;
    }

    const state = inspectEditor(true);
    if (action === 'run' && !state.runnable) return;
    if (action === 'edit-calculator' && !state.storable) return;
    if (action === 'run') {
      machine.prog = null;
      machine.mode = 'COMP';
      machine.error = null;
      machine.runProgram(selected);
      onMachineChange();
      document.getElementById('stage').scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    } else if (action === 'edit-calculator') {
      machine.editProgramSlot(selected);
      onMachineChange();
      document.getElementById('stage').scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    } else if (action === 'clear') {
      if (!clearArmed) {
        clearArmed = true;
        clearButton.textContent = `Confirm clear ${slotName(selected)}`;
        feedback.textContent = 'Click confirm clear once more — this cannot be undone.';
        clearTimer = setTimeout(() => showSlot(selected), 4000);
        return;
      }
      machine.clearStudioProgram(selected);
      drafts[selected] = { mode: 'COMP', source: '' };
      showSlot(selected);
      onMachineChange();
      renderLibrary();
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
      if (currentView === 'library') renderLibrary();
    }
  };
}
