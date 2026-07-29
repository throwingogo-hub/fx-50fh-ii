# fx-50FH II — web

A working recreation of the **CASIO fx-50FH II** in the browser: the programmable
scientific calculator that the HKEAA approves for the HKDSE.

**[Open the calculator →](https://throwingogo-hub.github.io/fx-50fh-ii/)**

It is not a calculator app with a Casio skin. It is the fx-50FH II's own state
machine — its six modes, its two-line display, its 680 bytes of program memory,
its error messages — driven by the same key sequences you would press on the
physical unit. If the user's guide says `SHIFT 7 4 EXE`, that is what you press.

## What works

All six calculation modes, reachable with `MODE`:

| | Mode | |
|---|---|---|
| 1 | **COMP** | general computation |
| 2 | **CMPLX** | complex numbers, `a+bi` and `r∠θ` |
| 3 | **BASE** | base-n in dec / hex / bin / oct |
| 4 | **SD** | single-variable statistics |
| 5 | **REG** | paired-variable statistics, seven regression types |
| 6 | **PRGM** | four program areas sharing 680 bytes |

Everything the keyboard is printed with is implemented:

- **Arithmetic** with Casio's eleven-level priority sequence, implied
  multiplication, and omitted trailing parentheses.
- **Fractions** (`a b/c`, `d/c`) and **sexagesimal** values, each with the
  automatic result formatting the real machine applies, and the `a b/c` / `°′″`
  toggles between decimal and formatted display.
- **Trigonometric, hyperbolic, exponential and logarithmic** functions,
  including two-argument `log(m,n)`, `x√`, `∛`, `x!`, `Abs`, `Ran#`, `nPr`,
  `nCr`, `Rnd(`, `Pol(` and `Rec(` — with `Pol`/`Rec` writing their second
  result into `Y`, as they do on the unit.
- **Percent** in all six of the guide's forms, including `Ans − Ans × 20%`.
- **Display settings** — `Fix`, `Sci`, `Norm1`/`Norm2`, `ENG` and `←ENG`,
  angle unit, fraction format, complex format, statistical frequency.
- **Memory** — `Ans`, independent memory `M`, and variables `A B C D X Y`.
- **40 scientific constants** and **23 built-in formulas**, the formulas
  prompting for each variable in turn and offering `LOOK`.
- **Base-n** with `d` `h` `b` `o` tags, `and`, `or`, `xor`, `xnor`, `Not(`,
  `Neg(`, and the real ten-digit binary and 32-bit decimal ranges.
- **Statistics** — the STAT data editor with back-step viewing and editing,
  frequency on or off, the whole `S-SUM` and `S-VAR` command set, `minX`,
  `maxX`, and estimated values for every regression type.
- **Programs** — `?`, `→`, `:`, `◢`, `Goto`/`Lbl`, `If`/`Then`/`Else`/`IfEnd`,
  `For`/`To`/`Step`/`Next`, `While`/`WhileEnd`, `Break`, the six relational
  operators, the setup commands, `ClrMemory`, `ClrStat`, `M+`, `M−`, `Rnd(`,
  `Dec`/`Hex`/`Bin`/`Oct` and `DT`.
- **Errors** — `Math`, `Syntax`, `Stack`, `Arg`, `Go`, `Nesting`, `Memory` and
  `Data Full`,
  and pressing `◄` or `►` on an error jumps the cursor to the character that
  caused it.

## The display

The two-line LCD is drawn on a canvas rather than set in a web font, because
the fx-50FH II's two lines are not the same kind of display. The upper line is
a 5 × 7 dot matrix of 16 characters; the lower line is a row of ten large
seven-segment cells plus a two-digit exponent field. Both are drawn at the
geometry measured off the physical unit — 37 × 91 px digits on a 48.3 px pitch,
leaning about 3° to the right — so a rendered screen lines up with a photograph
of the real one.

## Running it

There is no build step and there are no dependencies. Serve the folder over
HTTP (ES modules will not load from `file://`):

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Tests

250 checks, including worked examples, operating limits, and exhaustive LCD menu-layout/glyph
coverage derived from the user's guide, driven
through the machine by key sequence rather than by calling the maths directly —
so they exercise input, evaluation and formatting the way a person does.

```bash
node tests/run.js
```

## Keyboard

The physical keyboard is mapped: digits and operators are literal, `Enter` is
`EXE`, `Backspace` is `DEL`, `Escape` is `AC`, arrow keys drive `REPLAY`, and
`Space` and `Tab` latch `SHIFT` and `ALPHA`. Everything else is clickable.

## Provenance and licensing

The calculator's behaviour was reconstructed from CASIO's published user's
guide for this calculator family, and the key layout was measured from
photographs of the unit.

`assets/fx-50fh-ii-generated.png` preserves the supplied AI-generated 881×1785
PNG byte-for-byte. A new light-green-background version was generated from it as
`assets/fx-50fh-ii-generated-green.png`; the active
`assets/fx-50fh-ii-generated-transparent.png` is a hard, border-connected green
cutout. No matting, despill, resampling, or retained-pixel RGB changes are applied
during that cut. The LCD and invisible hit targets are the only browser layers.
Its LCD and all 50 key targets are measured directly in that native coordinate
space. `assets/fx-50fh-ii.png` is the source CASIO product
photograph retained for calibration and identification. CASIO holds the source
photograph's copyright, and *fx-50FH II*, *SUPER-FX PLUS* and *CASIO* are CASIO's trademarks. This project is
unaffiliated with and unendorsed by CASIO Computer Co., Ltd. and by the Hong
Kong Examinations and Assessment Authority.

The code in `js/`, `css/`, `tests/`, `tools/` and `index.html` is MIT licensed — see
[LICENSE](LICENSE).
