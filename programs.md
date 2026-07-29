# HKDSE Core programs for fx-50FH II

These programs are optional. They are **not built into the web calculator** and
will never replace your program slots automatically. Copy only the programs you
want into [Program Studio](https://throwingogo-hub.github.io/fx-50fh-ii/).

The complete P1–P4 pack uses **652 of 680 bytes** when pasted into Program
Studio. It focuses on calculations from the HKDSE Mathematics Compulsory Part
that are slow or error-prone to repeat by hand. The calculator already has
direct `nPr`, `nCr`, SD/REG statistics and built-in formula functions, so this
pack does not waste memory duplicating them.

## Install a program

1. Open **Program Studio** below the calculator.
2. Select the destination slot: P1, P2, P3 or P4.
3. Keep **Run mode** set to `COMP`.
4. Copy the entire matching code block below and paste it into **source**.
5. Wait for **Structure OK**. The slot is saved automatically on this device.
6. Repeat only for the other programs you want.

Installing a program manually replaces only the selected slot. Copy any
important existing source somewhere safe first.

## Run a program

- In Program Studio, select its slot and press **Run on calculator**; or
- On the calculator home screen, press **Prog**, then press `1`, `2`, `3` or `4`.

When the display shows `A?`, `B?`, `M?` or another variable prompt, enter the
requested value and press **EXE**. Each answer pauses on screen; press **EXE**
again to reveal the next answer. The calculator returns home after the last one.

For a negative input on the physical calculator, use the `(-)` key. In Program
Studio source and the examples below, an ordinary minus sign is fine.

## P1 — Quadratic X-Ray

Use P1 for a quadratic equation

```text
ax² + bx + c = 0
```

### Inputs

| Prompt | Enter |
|---|---|
| `A?` | coefficient `a` of `x²` |
| `B?` | coefficient `b` of `x` |
| `C?` | constant `c` |

### Outputs

The answers appear in this order:

1. Discriminant `Δ = b² − 4ac`
2. Vertex x-coordinate `h`
3. Vertex y-coordinate `k`
4. First real root
5. Second real root

If `Δ < 0`, P1 stops after the vertex because there are no real roots. If
`Δ = 0`, the repeated root is shown once.

### Example

For `x² − 5x + 6 = 0`:

```text
TYPE  A=1, B=-5, C=6
GET   Δ=1, h=2.5, k=-0.25, roots 3 and 2
```

### Copy into P1

```text
?→A
?→B
?→C
B²-4×A×C→D
D◢
-B÷(2×A)◢
C-B²÷(4×A)◢
D<0⇒Goto 9
(-B+√(D))÷(2×A)◢
D=0⇒Goto 9
(-B-√(D))÷(2×A)◢
Lbl 9
```

## P2 — Sequence Engine

P2 begins with `M?`. This selects the type of sequence.

### Inputs and outputs

| `M` | Calculation | Remaining inputs | Outputs |
|---:|---|---|---|
| `1` | Arithmetic progression | `A` first term, `B` common difference, `C=n` | `Tₙ`, then `Sₙ` |
| `2` | Finite geometric progression | `A` first term, `B` common ratio, `C=n` | `Tₙ`, then `Sₙ` |
| `3` | Infinite geometric progression | `A` first term, `B` common ratio | `S∞` |

Use `M=3` only when `|B| < 1`.

### Examples

Arithmetic progression with `a=2`, `d=3`, `n=5`:

```text
TYPE  M=1, A=2, B=3, C=5
GET   T₅=14, S₅=40
```

Finite geometric progression with `a=3`, `r=2`, `n=4`:

```text
TYPE  M=2, A=3, B=2, C=4
GET   T₄=24, S₄=45
```

Infinite geometric progression with `a=6`, `r=0.5`:

```text
TYPE  M=3, A=6, B=0.5
GET   S∞=12
```

### Copy into P2

```text
?→M
M=1⇒Goto 1
M=2⇒Goto 2
M=3⇒Goto 3
Goto 9
Lbl 1
?→A
?→B
?→C
A+(C-1)×B◢
C×(2×A+(C-1)×B)÷2◢
Goto 9
Lbl 2
?→A
?→B
?→C
A×B^(C-1)◢
B=1⇒Goto 4
A×(1-B^(C))÷(1-B)◢
Goto 9
Lbl 4
A×C◢
Goto 9
Lbl 3
?→A
?→B
A÷(1-B)◢
Lbl 9
```

## P3 — Coordinate Lab

P3 begins with `M?`. Choose two-point geometry or a circle equation.

### Mode 1 — two points

Enter:

| Prompt | Enter |
|---|---|
| `M?` | `1` |
| `A?`, `B?` | first point `(x₁,y₁)` |
| `C?`, `D?` | second point `(x₂,y₂)` |

Outputs: distance, midpoint x-coordinate, midpoint y-coordinate, then slope.
A vertical line produces `Math ERROR` at the slope, after the first three useful
answers have already appeared.

Example for `(0,0)` and `(3,4)`:

```text
TYPE  M=1, A=0, B=0, C=3, D=4
GET   distance 5, midpoint (1.5,2), slope 1.333333333
```

### Mode 2 — circle equation

Write the equation as

```text
x² + y² + Dx + Ey + F = 0
```

Then enter `M=2`, coefficient `D` at `A?`, coefficient `E` at `B?`, and
coefficient `F` at `C?`. The outputs are centre `h`, centre `k`, then radius `r`.

Example for `x² + y² − 4x + 6y − 12 = 0`:

```text
TYPE  M=2, A=-4, B=6, C=-12
GET   centre (2,-3), radius 5
```

### Copy into P3

```text
?→M
M=1⇒Goto 1
M=2⇒Goto 2
Goto 9
Lbl 1
?→A
?→B
?→C
?→D
√((C-A)²+(D-B)²)◢
(A+C)÷2◢
(B+D)÷2◢
(D-B)÷(C-A)◢
Goto 9
Lbl 2
?→A
?→B
?→C
-A÷2◢
-B÷2◢
√((A²+B²)÷4-C)◢
Lbl 9
```

## P4 — Trig 360

P4 finds every distinct solution for `0° ≤ θ ≤ 360°`. It switches the
calculator to degrees automatically.

### Inputs

| Prompt | Enter |
|---|---|
| `M?` | `1` for sine, `2` for cosine, or `3` for tangent |
| `D?` | the isolated trig value |

Isolate the trig function first. For example, `2sin θ = 1` becomes
`sin θ = 0.5`, so enter `D=0.5`. For sine and cosine, `D` must be between
`-1` and `1`.

### Examples

```text
2sin θ=1   → TYPE M=1, D=0.5  → GET 30°, 150°
cos θ=1    → TYPE M=2, D=1    → GET 0°, 360°
tan θ=-1   → TYPE M=3, D=-1   → GET 135°, 315°
```

### Copy into P4

```text
Deg
?→M
?→D
M=1⇒Goto 1
M=2⇒Goto 2
M=3⇒Goto 3
Goto 9
Lbl 1
sin^-1(D)→X
X<0⇒Goto 4
X◢
X=90⇒Goto 9
180-X→Y
Y◢
X≠0⇒Goto 9
360◢
Goto 9
Lbl 4
180-X→Y
Y◢
X=-90⇒Goto 9
360+X→Y
Y◢
Goto 9
Lbl 2
cos^-1(D)→X
X◢
X=180⇒Goto 9
360-X→Y
Y◢
Goto 9
Lbl 3
tan^-1(D)→X
X<0⇒X+180→X
X◢
X+180→Y
Y◢
X≠0⇒Goto 9
360◢
Lbl 9
```

## Extra swap-in library

The calculator has only four physical program slots. The programs below are
**alternatives**, not another pack to install together with P1–P4. Copy an extra
program into whichever slot you choose when a topic is useful, then restore the
old source from this file later.

None duplicates an existing program or a one-button calculator feature:

| Extra | Adds | Why it is different |
|---|---|---|
| A | simultaneous 2×2 equations | the fx-50FH II has no equation-solver mode |
| B | circle through three points | P3 starts from a completed general equation |
| C | growth and decay unknowns | solves for final value, time, rate or starting value |
| D | combined population statistics | combines summary data without the original observations |

### Suggested four-slot combinations

| Focus | P1 | P2 | P3 | P4 | Total |
|---|---|---|---|---|---:|
| Original Core pack | Quadratic | Sequences | Coordinate | Trig | 652B |
| Algebra and growth | Quadratic | Extra A | Sequences | Extra C | 509B |
| Coordinate geometry | Coordinate | Extra B | Extra A | Trig | 647B |
| Statistics and algebra | Sequences | Extra D | Extra A | Trig | 560B |

## Extra A — Simultaneous 2×2 Solver (74B)

Solves two linear equations written as

```text
Ax + By = C
Dx + Xy = Y
```

The letters `X` and `Y` on the second equation are calculator memory names;
they mean the coefficient of `y` and the right-hand side respectively.

### Inputs

| Prompt | Enter |
|---|---|
| `A?`, `B?`, `C?` | the three values in the first equation |
| `D?`, `X?`, `Y?` | the three values in the second equation |

### Outputs

1. Determinant
2. Solution `x`
3. Solution `y`

If the determinant is `0`, there is no unique solution and the program stops
after displaying `0`.

### Example

For `2x+y=7` and `x−y=2`:

```text
TYPE  A=2, B=1, C=7, D=1, X=-1, Y=2
GET   determinant -3, x=3, y=1
```

### Copy this program

```text
?→A
?→B
?→C
?→D
?→X
?→Y
A×X-B×D→M
M◢
M=0⇒Goto 9
(C×X-B×Y)÷M◢
(A×Y-C×D)÷M◢
Lbl 9
```

## Extra B — Circle Through Three Points (199B)

Finds the centre and radius of the unique circle through three supplied points.
Unlike P3 mode 2, you do not need to derive the general circle equation first.

### Inputs

| Prompt | Enter |
|---|---|
| `A?`, `B?` | first point `(x₁,y₁)` |
| `C?`, `D?` | second point `(x₂,y₂)` |
| `X?`, `Y?` | third point `(x₃,y₃)` |

### Outputs

1. Centre x-coordinate `h`
2. Centre y-coordinate `k`
3. Radius `r`

Three collinear points do not define a circle and produce `Math ERROR`.

### Example

For the points `(0,0)`, `(4,0)` and `(0,6)`:

```text
TYPE  A=0, B=0, C=4, D=0, X=0, Y=6
GET   centre (2,3), radius 3.605551275
```

### Copy this program

```text
?→A
?→B
?→C
?→D
?→X
?→Y
((A²+B²)×(D-Y)+(C²+D²)×(Y-B)+(X²+Y²)×(B-D))÷(2×(A×(D-Y)+C×(Y-B)+X×(B-D)))→M
M◢
((A²+B²)×(X-C)+(C²+D²)×(A-X)+(X²+Y²)×(C-A))÷(2×(A×(D-Y)+C×(Y-B)+X×(B-D)))→C
C◢
√((A-M)²+(B-C)²)◢
```

## Extra C — Growth and Decay Solver (157B)

Uses the model

```text
final = start × (1 + rate/100)^periods
```

Enter a negative percentage rate for decay. The program begins with `M?`, which
selects the unknown quantity.

### Inputs and outputs

| `M` | Find | Enter at `A?` | Enter at `B?` | Enter at `C?` | Output |
|---:|---|---|---|---|---|
| `1` | final value | start | rate % | periods | final |
| `2` | number of periods | start | rate % | final | periods |
| `3` | rate | start | final | periods | rate % |
| `4` | starting value | final | rate % | periods | start |

### Examples

```text
TYPE  M=1, A=1000, B=5, C=3     → GET 1157.625
TYPE  M=2, A=1000, B=10, C=1210 → GET 2 periods
TYPE  M=3, A=1000, B=1210, C=2  → GET 10%
TYPE  M=4, A=1210, B=10, C=2    → GET 1000
```

### Copy this program

```text
?→M
?→A
?→B
?→C
M=1⇒Goto 1
M=2⇒Goto 2
M=3⇒Goto 3
M=4⇒Goto 4
Goto 9
Lbl 1
A×(1+B÷100)^(C)◢
Goto 9
Lbl 2
log(C÷A)÷log(1+B÷100)◢
Goto 9
Lbl 3
100×((B÷A)^(1÷C)-1)◢
Goto 9
Lbl 4
A÷(1+B÷100)^(C)◢
Lbl 9
```

## Extra D — Combined Population Statistics (79B)

Combines two groups when a question gives only each group's size, mean and
population standard deviation. This is different from SD mode because the
original observations are not required.

### Inputs

| Prompt | Enter |
|---|---|
| `A?` | first group size `n₁` |
| `B?` | first group mean `μ₁` |
| `C?` | first group population SD `σ₁` |
| `D?` | second group size `n₂` |
| `X?` | second group mean `μ₂` |
| `Y?` | second group population SD `σ₂` |

### Outputs

1. Combined mean
2. Combined population standard deviation

Use population SD `σ`, not sample SD `s`.

### Example

Two groups have `(n, μ, σ)=(2,10,2)` and `(2,14,2)`:

```text
TYPE  A=2, B=10, C=2, D=2, X=14, Y=2
GET   combined mean 12, combined SD 2.828427125
```

### Copy this program

```text
?→A
?→B
?→C
?→D
?→X
?→Y
(A×B+D×X)÷(A+D)→M
M◢
√((A×(C²+B²)+D×(Y²+X²))÷(A+D)-M²)◢
```

## Syllabus basis

The program choices come from the Education Bureau's
[Explanatory Notes to the Mathematics Curriculum — Compulsory Part](https://www.edb.gov.hk/attachment/en/curriculum-development/kla/ma/curr/EN_CP_e.pdf),
especially quadratics, equations, exponential growth and decay, arithmetic and
geometric sequences, coordinate geometry, circle equations, trigonometric
equations and measures of dispersion.
