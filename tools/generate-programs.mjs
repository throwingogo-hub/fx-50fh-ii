import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(process.cwd());
const { parseProgramText } = await import(pathToFileURL(resolve(root, 'js/program-codec.js')));
const guidePath = resolve(root, 'programs.md');
const catalogPath = resolve(root, 'programs.catalog.json');
const runtimePath = resolve(root, 'js/program-catalog.generated.js');

const META = {
  P1: { category: 'Algebra', topics: ['quadratic', 'discriminant', 'vertex', 'roots'], summary: 'Diagnose a quadratic in one run: discriminant, vertex and every real root.', inputs: 'Coefficients a, b and c.', outputs: 'Discriminant, vertex coordinates and real roots.' },
  P2: { category: 'Sequences', topics: ['arithmetic sequence', 'geometric sequence', 'series'], summary: 'Calculate terms and sums for arithmetic, finite geometric and infinite geometric sequences.', inputs: 'Sequence type, first term, difference or ratio, and n when required.', outputs: 'The requested term and sum.' },
  P3: { category: 'Coordinate', topics: ['distance', 'midpoint', 'slope', 'circle'], summary: 'Handle two-point coordinate geometry or recover a circle from its general equation.', inputs: 'A mode plus point coordinates or circle coefficients.', outputs: 'Distance, midpoint, slope, or circle centre and radius.' },
  P4: { category: 'Trigonometry', topics: ['trig equation', 'sine', 'cosine', 'tangent'], summary: 'Return every solution from 0° to 360° after a trig equation has been isolated.', inputs: 'Function selector and isolated sine, cosine or tangent value.', outputs: 'All valid angles in the interval.' },
  A: { category: 'Algebra', topics: ['simultaneous equations', 'linear equations'], summary: 'Solve a two-by-two system when the calculator has no equation-solver mode.', inputs: 'The six coefficients from two linear equations.', outputs: 'The unique x and y solution.' },
  B: { category: 'Coordinate', topics: ['circle', 'three points', 'circumcircle'], summary: 'Build the general equation of the circle through three supplied points.', inputs: 'Coordinates of three non-collinear points.', outputs: 'Circle coefficients, centre and radius.' },
  C: { category: 'Finance', topics: ['growth', 'decay', 'exponential', 'compound'], summary: 'Solve for the missing value in exponential growth or decay models.', inputs: 'Mode plus the known starting value, final value, rate and time.', outputs: 'The selected unknown quantity.' },
  D: { category: 'Statistics', topics: ['combined mean', 'standard deviation', 'population'], summary: 'Combine two populations from summary statistics without the original observations.', inputs: 'Both population sizes, means and population standard deviations.', outputs: 'Combined mean and combined population standard deviation.' },
  E: { category: 'Coordinate', topics: ['line circle', 'intersection', 'tangent', 'secant', 'parameter k', 'coefficient containing k', 'vertical line'], summary: 'Find numerical intersections when k appears in a circle or line coefficient.', inputs: 'A numerical k, circle coefficients, and line coefficients; coefficient expressions may use M.', outputs: 'One or two numerical intersection points.' },
  F: { category: 'Sequences', topics: ['sequence target', 'minimum n', 'series'], summary: 'Find the first term count whose arithmetic or geometric sum reaches a target.', inputs: 'Sequence type, sequence values and target sum.', outputs: 'The first qualifying n and its sum.' },
  H: { category: 'Algebra', topics: ['cubic', 'cubic equation', 'cardano', 'three real roots'], summary: 'Solve a cubic directly without requiring a known factor.', inputs: 'All four cubic coefficients.', outputs: 'Every distinct real root.' },
  I: { category: 'Probability', topics: ['hypergeometric', 'without replacement', 'nCr'], summary: 'Evaluate exact, at-least or at-most probabilities without replacement.', inputs: 'Probability mode, population counts, draw count and target count.', outputs: 'The requested hypergeometric probability.' },
  J: { category: 'Algebra', topics: ['transformed roots', 'quadratic', 'vieta'], summary: 'Construct a new quadratic after applying a transformation to the original roots.', inputs: 'Original quadratic coefficients plus transformation mode and constants.', outputs: 'Coefficients of the transformed-root equation.' },
  K: { category: 'Coordinate', topics: ['circle tangent', 'point of contact', 'tangent length'], summary: 'Find both tangent points and the tangent length from an external point to a circle.', inputs: 'Circle data and the external point.', outputs: 'Two contact points and tangent length.' },
  L: { category: 'Finance', topics: ['annuity', 'loan', 'payment', 'compound interest'], summary: 'Calculate savings annuities and reducing-balance loan quantities.', inputs: 'Mode, payment, rate, term and known balance values.', outputs: 'The selected annuity or loan result.' },
  M: { category: 'Geometry', topics: ['centroid', 'circumcentre', 'incentre', 'orthocentre'], summary: 'Return all four triangle centres for any non-collinear triangle.', inputs: 'Coordinates of all three vertices.', outputs: 'Coordinates of G, I, H and O.' }
};

const PACKS = [
  { id: 'core', name: 'Original Core', description: 'The balanced everyday pack.', programIds: ['P1', 'P2', 'P3', 'P4'] },
  { id: 'algebra-growth', name: 'Algebra & growth', description: 'Quadratics, simultaneous equations, sequences and growth.', programIds: ['P1', 'A', 'P2', 'C'] },
  { id: 'coordinate', name: 'Coordinate geometry', description: 'Points, circles, equations and trig.', programIds: ['P3', 'B', 'A', 'P4'] },
  { id: 'statistics-algebra', name: 'Statistics & algebra', description: 'Sequences, combined statistics, systems and trig.', programIds: ['P2', 'D', 'A', 'P4'] },
  { id: 'advanced', name: 'Advanced Section B / MCQ', description: 'Coefficient-k intersections, sequence targets, complete cubics and transformed roots.', programIds: ['E', 'F', 'H', 'J'] },
  { id: 'paper1', name: 'Paper 1 Section B', description: 'Probability, transformed roots, tangents and finance.', programIds: ['I', 'J', 'K', 'L'] },
  { id: 'centres-algebra', name: 'Centres & algebra', description: 'General triangle centres with high-value algebra tools.', programIds: ['M', 'A', 'P1', 'J'] }
];

function getExample(body) {
  const heading = body.search(/^### Examples?\s*$/m);
  if (heading >= 0) {
    const afterHeading = body.slice(heading).replace(/^### Examples?\s*\n/m, '');
    const nextHeading = afterHeading.search(/^### /m);
    const section = nextHeading < 0 ? afterHeading : afterHeading.slice(0, nextHeading);
    const fenced = section.match(/```text\n([\s\S]*?)```/);
    if (fenced) return fenced[1].trim();
    const prose = section.trim().split('\n\n')[0];
    if (prose) return prose;
  }
  const typed = [...body.matchAll(/```text\n([\s\S]*?)```/g)]
    .map(match => match[1].trim())
    .find(text => /^TYPE\s/m.test(text));
  return typed || '';
}

function bootstrap() {
  const guide = readFileSync(guidePath, 'utf8');
  const starts = [...guide.matchAll(/^## (P[1-4]|Extra [A-N]) — (.+?) \((\d+)B\)$/gm)];
  if (starts.length !== 16) throw new Error(`expected 16 curated program sections, found ${starts.length}`);
  const prefix = guide.slice(0, starts[0].index);
  const programs = starts.map((match, index) => {
    const segment = guide.slice(match.index, starts[index + 1]?.index ?? guide.length);
    const headingEnd = segment.indexOf('\n') + 1;
    const rest = segment.slice(headingEnd);
    const copyMatch = [...rest.matchAll(/^### (Copy[^\n]*)\n\n```text\n([\s\S]*?)```/gm)].at(-1);
    if (!copyMatch) throw new Error(`missing final copy block for ${match[1]}`);
    const guideBody = rest.slice(0, copyMatch.index).trim();
    const after = rest.slice(copyMatch.index + copyMatch[0].length);
    const id = match[1].startsWith('Extra ') ? match[1].slice(6) : match[1];
    const source = copyMatch[2].trimEnd();
    const parsed = parseProgramText(source, 'COMP');
    if (parsed.errors.length) throw new Error(`${id} source does not parse`);
    if (parsed.bytes !== Number(match[3])) throw new Error(`${id} byte label mismatch`);
    return {
      id,
      label: match[1],
      title: match[2],
      bytes: parsed.bytes,
      mode: 'COMP',
      ...META[id],
      example: getExample(guideBody),
      source,
      guideBody,
      copyHeading: copyMatch[1],
      after
    };
  });
  writeFileSync(catalogPath, JSON.stringify({ version: 1, prefix, packs: PACKS, programs }, null, 2) + '\n');
}

function loadCatalog() {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  if (catalog.version !== 1 || catalog.programs?.length !== 16) throw new Error('invalid program catalog');
  const ids = new Set();
  for (const program of catalog.programs) {
    if (ids.has(program.id)) throw new Error(`duplicate program id ${program.id}`);
    ids.add(program.id);
    const parsed = parseProgramText(program.source, program.mode);
    if (parsed.errors.length) throw new Error(`${program.id} source does not parse`);
    if (parsed.bytes !== program.bytes) throw new Error(`${program.id} byte count is ${parsed.bytes}, catalog says ${program.bytes}`);
  }
  for (const pack of catalog.packs) {
    if (pack.programIds.length !== 4 || pack.programIds.some(id => !ids.has(id))) throw new Error(`invalid pack ${pack.id}`);
    const total = pack.programIds.reduce((sum, id) => sum + catalog.programs.find(program => program.id === id).bytes, 0);
    if (total > 680) throw new Error(`pack ${pack.id} exceeds program memory`);
  }
  return catalog;
}

function renderGuide(catalog) {
  let guide = catalog.prefix;
  for (const program of catalog.programs) {
    guide += `## ${program.label} — ${program.title} (${program.bytes}B)\n\n`;
    guide += `${program.guideBody.trim()}\n\n`;
    guide += `### ${program.copyHeading}\n\n\`\`\`text\n${program.source.trimEnd()}\n\`\`\``;
    guide += program.after;
  }
  return guide.endsWith('\n') ? guide : guide + '\n';
}

function renderRuntime(catalog) {
  const programs = catalog.programs.map(({ guideBody, copyHeading, after, label, ...program }) => program);
  return `// Generated by tools/generate-programs.mjs from programs.catalog.json.\n// Do not edit this file by hand.\n\nexport const PROGRAMS = Object.freeze(${JSON.stringify(programs, null, 2)});\n\nexport const PROGRAM_PACKS = Object.freeze(${JSON.stringify(catalog.packs, null, 2)});\n\nexport const PROGRAM_BY_ID = new Map(PROGRAMS.map(program => [program.id, program]));\n`;
}

function generate(checkOnly = false) {
  const catalog = loadCatalog();
  const outputs = [[guidePath, renderGuide(catalog)], [runtimePath, renderRuntime(catalog)]];
  if (checkOnly) {
    const stale = outputs.filter(([path, next]) => readFileSync(path, 'utf8') !== next).map(([path]) => path);
    if (stale.length) throw new Error(`generated files are stale: ${stale.join(', ')}`);
    return;
  }
  for (const [path, contents] of outputs) writeFileSync(path, contents);
}

const command = process.argv[2] || 'generate';
if (command === 'bootstrap') bootstrap();
else if (command === 'generate') generate(false);
else if (command === 'check') generate(true);
else throw new Error(`unknown command ${command}`);
