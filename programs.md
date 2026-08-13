# HKDSE Core programs for fx-50FH II

These 16 programs are optional. They are available in the web calculator's
**Program Studio → HKDSE Library**, but nothing installs automatically. A single
program always asks for a destination slot, and an occupied slot or four-slot
pack requires a second confirmation before anything is replaced.

The complete P1–P4 Core pack uses **478 of 680 bytes**. It focuses on HKDSE
Mathematics Compulsory Part calculations that are slow or error-prone to repeat
by hand. The calculator already has direct `nPr`, `nCr`, SD/REG statistics and
built-in formula functions, so the pack does not duplicate them.

Every heading shows the exact Program Studio byte count. The complete 16-program
library is **2,207B**; seven recommended four-slot packs fit within the authentic
680-byte shared memory. Any deliberately removed diagnostic output or tighter
input restriction is stated in the relevant section below.

## Install from the in-app Library

1. Open [Program Studio](https://throwingogo-hub.github.io/fx-50fh-ii/) and choose **HKDSE Library**.
2. Search by topic or choose a category.
3. Select the destination P1–P4 slot, then press **Install**.
4. If the slot already contains a program, confirm the replacement once more.
5. For a complete setup, choose one of the seven memory-safe four-slot packs.

Program Studio keeps one-step Undo after a Library, pack or backup install. Use
**Export all** to download a versioned JSON backup before larger changes.

## Install manually

1. Open Program Studio's **Editor** and select P1, P2, P3 or P4.
2. Set **Run mode** to the mode printed beside that program (`COMP` for most programs; `REG` for Extra M).
3. Copy the entire matching code block below and paste it into **source**.
4. Wait for **Structure OK**; the slot is saved automatically on this device.

## Run a program

- In Program Studio, select its slot and press **Run on calculator**; or
- On the calculator home screen, press **Prog**, then press `1`, `2`, `3` or `4`.

When the display shows `A?`, `B?`, `M?` or another variable prompt, enter the
requested value and press **EXE**. Each answer pauses on screen; press **EXE**
again to reveal the next answer. The calculator returns home after the last one.

For a negative input on the physical calculator, use the `(-)` key. In Program
Studio source and the examples below, an ordinary minus sign is fine. Some `◢`
pauses are followed immediately by the next statement because an extra line
break would consume another program byte.

## P1 — Quadratic X-Ray (80B)

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
B²-4AC→D
D◢-B÷2÷A◢-D÷4÷A◢D<0⇒Goto 9
(√(D)-B)÷2÷A→C
C◢D=0⇒Goto 9
-B÷A-C◢Lbl 9
```

## P2 — Sequence Engine (110B)

P2 begins with `M?`. This selects the type of sequence.

### Inputs and outputs

| `M` | Calculation | Remaining inputs | Outputs |
|---:|---|---|---|
| `1` | Arithmetic progression | `A` first term, `B` common difference, `C=n` | `Tₙ`, then `Sₙ` |
| `2` | Finite geometric progression | `A` first term, `B` common ratio, `C=n` | `Tₙ`, then `Sₙ` |
| `3` | Infinite geometric progression | `A` first term, `B` common ratio | `S∞` |

Use `M=3` only when `|B| < 1`. For `M=2`, use `B≠1`; a constant GP is
quicker by hand: `Tₙ=A`, `Sₙ=AC`.

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
?→A
?→B
M=3⇒A÷(1-B)→X
M=3⇒Goto 9
?→C
M=1⇒A+(C-1)B→D
M=2⇒AB^(C-1)→D
D◢M=1⇒C(A+D)÷2→X
M=2⇒(A-BD)÷(1-B)→X
Lbl 9
X◢
```

## P3 — Coordinate Lab (104B)

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
?→A
?→B
?→C
M=2⇒Goto 2
?→D
C-A→X
D-B→Y
√(X²+Y²)◢(A+C)÷2◢(B+D)÷2◢Y÷X◢Goto 9
Lbl 2
-A÷2◢-B÷2◢√(A²+B²-4C)÷2◢Lbl 9
```

## P4 — Trig 360 (184B)

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
tan^-1(D)→X
X<0⇒X+180→X
X◢X+180◢X≠0⇒Goto 9
360◢Goto 9
Lbl 1
sin^-1(D)→X
X<0⇒Goto 4
X◢X=90⇒Goto 9
180-X◢X≠0⇒Goto 9
360◢Goto 9
Lbl 4
180-X◢X=-90⇒Goto 9
360+X◢Goto 9
Lbl 2
cos^-1(D)→X
X◢X=180⇒Goto 9
360-X◢Lbl 9
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
| E | line–circle intersections | finds tangent/secant points when `k` appears in equation coefficients |
| F | first sequence sum reaching a target | P2 requires `n` to be known already |
| H | complete cubic equations | finds every distinct real root without needing a known factor |
| I | hypergeometric probability ranges | evaluates exact, at-least and at-most cases in one run |
| J | transformed quadratic roots | forms new equations without first finding the original roots |
| K | tangents from a point to a circle | returns both points of contact and the tangent length |
| L | annuities and reducing-balance loans | handles regular payments, not just one-off compound growth |
| M | four centres of any triangle | returns G, I, H and O from three arbitrary non-collinear vertices |

### Suggested four-slot combinations

| Focus | P1 | P2 | P3 | P4 | Total |
|---|---|---|---|---|---:|
| Original Core pack | Quadratic | Sequences | Coordinate | Trig | 478B |
| Algebra and growth | Quadratic | Extra A | Sequences | Extra C | 352B |
| Coordinate geometry | Coordinate | Extra B | Extra A | Trig | 469B |
| Statistics and algebra | Sequences | Extra D | Extra A | Trig | 419B |
| Advanced Section B / MCQ | Extra E | Extra F | Extra H | Extra J | 639B |
| Paper 1 Section B power pack | Extra I | Extra J | Extra K | Extra L | 424B |
| Centres & algebra | Extra M | Extra A | Quadratic | Extra J | 600B |

## Extra A — Simultaneous 2×2 Solver (52B)

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

1. Solution `x`
2. Solution `y`

If the determinant is `0`, there is no unique solution and the calculator
shows `Math ERROR`.

### Example

For `2x+y=7` and `x−y=2`:

```text
TYPE  A=2, B=1, C=7, D=1, X=-1, Y=2
GET   x=3, y=1
```

### Copy this program

```text
?→A
?→B
?→C
?→D
?→X
?→Y
AX-BD→M
(CX-BY)÷M◢(AY-CD)÷M◢
```

## Extra B — Circle Through Three Points (129B)

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
C-A→C
D-B→D
X-A→X
Y-B→Y
(C(X²+Y²)-X(C²+D²))÷2÷(CY-DX)→M
((C²+D²)Y-(X²+Y²)D)÷2÷(CY-DX)→C
A+C◢B+M◢√(C²+M²)◢
```

## Extra C — Growth and Decay Solver (110B)

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
M=1⇒A(1+B÷100)^(C)→X
M=2⇒log(C÷A)÷log(1+B÷100)→X
M=3⇒100((B÷A)^(1÷C)-1)→X
M=4⇒A÷(1+B÷100)^(C)→X
X◢
```

## Extra D — Combined Population Statistics (73B)

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
(AB+DX)÷(A+D)◢√((A(C²+B²)+D(Y²+X²))÷(A+D)-(Ans)²)◢
```

## Advanced Section B / MCQ library

These four programs target longer Paper 1 Section B calculations and the
non-foundation-style questions found in Paper 2 Section B. They automate the
arithmetic after you have formed the correct equation or model; they do not
replace the working that Paper 1 requires.

All four advanced programs occupy `639B`, leaving `41B` free for editing.

## Extra E — Line–Circle Intersections (211B)

Finds the **numerical intersection point(s)** when `k` appears in a
coefficient of the circle equation or the straight-line equation. Write the
equations as

```text
x² + y² + Ax + By + C = 0
Dx + Xy + Y = 0
```

The program stores the chosen numerical value of `k` in calculator memory `M`.
At every later prompt, enter either a number or an expression containing `M`:

| Coefficient in the question | Enter at that prompt |
|---|---|
| `k` | `M` |
| `2k−3` | `2M−3` |
| ordinary number `5` | `5` |

Therefore the example forms map like this:

```text
x²+y²+kx+y+f=0  →  A=M, B=1, C=f
x+ky+c=0        →  D=1, X=M, Y=c
```

### Inputs

| Prompt | Enter |
|---|---|
| `M?` | the numerical value of `k` |
| `A?`, `B?`, `C?` | circle coefficients; each may contain `M` |
| `D?`, `X?`, `Y?` | line coefficients; each may contain `M` |

The line coefficients `D` and `X` cannot both be zero. Because the fx-50FH II
is not a symbolic CAS, `k` must be assigned a numerical value; the program
cannot print general answers still containing an unresolved `k`.

### Outputs

Each real intersection appears as an `x` value followed by its `y` value. A
tangent produces one pair; a secant produces two pairs. If there is no real
intersection, the calculator shows `Math ERROR`. Vertical lines are supported.

### Examples

For `x²+y²+kx+y−4=0` and `x+ky=0`, take `k=1`:

```text
TYPE  M=1, A=M, B=1, C=-4, D=1, X=M, Y=0
GET   (√2,-√2), (-√2,√2)
```

At the physical `A?` and `X?` prompts, press `ALPHA` then `M+` to enter `M`.
For `k=2`, the same equations use exactly the same coefficient entries; only
the first input changes to `M=2`.

For the vertical line `x=1` with circle `x²+y²+2x+y−4=0`:

```text
TYPE  M=2, A=M, B=1, C=-4, D=1, X=0, Y=-1
GET   (1,(-1+√5)/2), (1,(-1−√5)/2)
```

### Copy this program

```text
?→M
?→A
?→B
?→C
?→D
?→X
?→Y
X=0⇒Goto 1
Y²-BXY+CX²→C
AX²+2DY-BDX→B
X²+D²→A
B²-4AC→M
(√(M)-B)÷(2A)→C
C◢(-DC-Y)÷X◢
-B÷A-C→M
M=C⇒Goto 9
M◢(-Y-DM)÷X◢
Goto 9
Lbl 1
-Y÷D→X
B²-4(X²+AX+C)→M
(√(M)-B)÷2→C
X◢C◢
-B-C→M
M=C⇒Goto 9
X◢M◢
Lbl 9
```

## Extra F — Sequence Target Solver (72B)

Finds the **smallest positive integer `n`** for which a partial sum reaches or
exceeds a target. This is useful when a Section B question asks “after how many
terms/months…” rather than giving `n`.

### Inputs

| Prompt | Enter |
|---|---|
| `M?` | `1` for AP or `2` for GP |
| `A?` | first term |
| `B?` | common difference for AP, or common ratio for GP |
| `C?` | target sum |

### Outputs

1. Smallest qualifying `n`
2. The corresponding sum `Sₙ`, useful for checking the inequality

Use a sequence with increasing positive partial sums and a reachable target.
Otherwise the search can end in `Time ERROR`.

### Examples

For an AP with `a=3`, `d=2`, find the first `Sₙ≥100`:

```text
TYPE  M=1, A=3, B=2, C=100
GET   n=10, S₁₀=120
```

For a GP with `a=2`, `r=1.5`, find the first `Sₙ≥50`:

```text
TYPE  M=2, A=2, B=1.5, C=50
GET   n=7, S₇=64.34375
```

### Copy this program

```text
?→M
?→A
?→B
?→C
0→X
0→Y
A→D
While Y<C
X+1→X
Y+D→Y
M=1⇒D+B→D
M=2⇒DB→D
WhileEnd
X◢Y◢
```

## Extra H — Complete Cubic Solver (273B)

Solves a real cubic directly; unlike the previous Library program, it does not
require you to know one root first. Write the equation as

```text
Ax³ + Bx² + Cx + D = 0
```

### Inputs

| Prompt | Enter |
|---|---|
| `A?` | coefficient of `x³` (must be non-zero) |
| `B?` | coefficient of `x²` |
| `C?` | coefficient of `x` |
| `M?` | constant `D` |

`M` holds the constant because the calculator has no separate memory named `E`.

### Outputs

Every **distinct real root** is shown. The program uses Cardano's formula for
one real root, a separate repeated-root branch when the discriminant is zero,
and the trigonometric form for three real roots. Complex roots are intentionally
not displayed because this is the real-number COMP version from the S5 list.

### Examples

```text
x³+6x²+11x+6=0
TYPE  A=1, B=6, C=11, M=6
GET   -1, -2, -3

2x³+7x²+5x+1=0
TYPE  A=2, B=7, C=5, M=1
GET   approximately -0.381966, -0.5, -2.618034

x³+2x²+2x+1=0
TYPE  A=1, B=2, C=2, M=1
GET   -1
```

### Copy this program

```text
?→A
?→B
?→C
?→M
2×B³÷(27×A³)-B×C÷(3×A²)+M÷A→D
C÷A-B²÷(3×A²)→X
B÷(3×A)→Y
(D÷2)²+(X÷3)³→M
M<0⇒Goto 1
M=0⇒Goto 2
∛((-D÷2+√(M)))+∛((-D÷2-√(M)))-Y◢
Goto 9
Lbl 2
∛((-D÷2))→A
2×A-Y◢
A=0⇒Goto 9
-A-Y◢
Goto 9
Lbl 1
Deg
cos^-1((3×D÷(2×X))×√((-3÷X)))÷3→M
2×√((-X÷3))→A
A×cos(M)-Y◢
A×cos(M - 120)-Y◢
A×cos(M - 240)-Y◢
Lbl 9
```

## Paper 1 Section B power pack

The next four programs are designed as one **424B alternative pack** for the
longer structured questions in Paper 1 Section B. They cover probability,
algebra, coordinate geometry and financial modelling while leaving `256B` free.

The programs supply numerical results and checks. In Paper 1, still write the
formula, substitution and reasoning required by the question; a calculator
answer by itself does not earn the method marks.

## Extra I — Without-Replacement Probability (130B)

Uses the hypergeometric model for a population containing two types of item.
It finds the probability of drawing exactly, at least or at most a specified
number of type-A items when all items are drawn together **without replacement**.

### Inputs

| Prompt | Enter |
|---|---|
| `M?` | `1` for exactly, `2` for at least, or `3` for at most |
| `A?` | number of type-A items in the population |
| `B?` | number of other items in the population |
| `C?` | total number of items drawn |
| `D?` | required number of type-A items |

### Output

The single output is the required probability. For `M=1`, enter a feasible
value of `D`: `max(0,C-B) ≤ D ≤ min(A,C)`. Counts must be non-negative integers.
This version uses the calculator's native `nCr` operation, avoiding the old
factorial expansion and its `69!` limit.

### Examples

A box contains 5 red and 4 black balls, and 2 balls are drawn together:

```text
TYPE  M=1, A=5, B=4, C=2, D=2  → GET P(exactly 2 red)=0.2777777778 = 5/18
TYPE  M=2, A=5, B=4, C=2, D=1  → GET P(at least 1 red)=0.8333333333 = 5/6
TYPE  M=3, A=5, B=4, C=2, D=1  → GET P(at most 1 red)=0.7222222222 = 13/18
```

For written working, show the combination expression. For example, the first
answer is `5C2 / 9C2`; Extra I is the fast arithmetic check and range-summer.

### Copy this program

```text
?→M
?→A
?→B
?→C
?→D
0→X
C-B>0⇒C-B→X
C→Y
A<C⇒A→Y
M=1⇒D→X
M=1⇒D→Y
M=2⇒D>X⇒D→X
M=3⇒D<Y⇒D→Y
0→M
While X≤Y
A nCr X B nCr(C-X)÷(A+B)nCr C M+
X+1→X
WhileEnd
M◢
```

## Extra J — Transformed-Roots Builder (83B)

Start with a quadratic

```text
Ax² + Bx + C = 0
```

whose roots are `α` and `β`. Extra J forms a new **monic** quadratic without
calculating `α` and `β` separately. This avoids rounding errors and is useful
when a Section B question asks for an equation with related roots.

### Mode 1 — roots `Xα+Y` and `Xβ+Y`

Enter `M=1`, followed by the original coefficients `A`, `B`, `C`, then the
multiplier `X` and shift `Y`.

Outputs the coefficients `P`, then `Q`, of

```text
z² + Pz + Q = 0
```

Example: `x²-5x+6=0` has roots `α,β`. Form the equation whose roots are
`2α+1, 2β+1`:

```text
TYPE  M=1, A=1, B=-5, C=6, X=2, Y=1
GET   P=-12, Q=35
WRITE z²-12z+35=0
```

### Mode 2 — roots `α²` and `β²`

Enter `M=2` and the original coefficients `A`, `B`, `C`. The outputs are again
`P`, then `Q`, in `z²+Pz+Q=0`.

```text
TYPE  M=2, A=1, B=-5, C=6
GET   P=-13, Q=36
WRITE z²-13z+36=0
```

### Copy this program

```text
?→M
?→A
?→B
?→C
M=2⇒Goto 2
?→X
?→Y
XB÷A-2Y◢X²C÷A-YAns-Y²◢Goto 9
Lbl 2
C÷A→X
2X-(B÷A)²◢X²◢Lbl 9
```

## Extra K — Tangents from a Point to a Circle (104B)

For a circle with centre `(h,k)`, radius `r`, and a supplied point `(p,q)`,
Extra K finds the tangent length and both points of contact. The supplied point
may be outside or on the circle.

### Inputs

| Prompt | Enter |
|---|---|
| `A?` | centre x-coordinate `h` |
| `B?` | centre y-coordinate `k` |
| `C?` | radius `r` |
| `D?` | external point x-coordinate `p` |
| `X?` | external point y-coordinate `q` |

### Outputs

1. Tangent length
2. First contact point `x₁`, then `y₁`
3. Second contact point `x₂`, then `y₂`

If the supplied point lies on the circle, the tangent length is `0` and that
same contact point appears twice. If it lies inside the circle, the calculator
shows `Math ERROR` because no real tangent exists.

### Example

For the circle `x²+y²=25` and the point `(13,0)`:

```text
TYPE  A=0, B=0, C=5, D=13, X=0
GET   tangent length 12
      contact points (1.923076923,4.615384615)
                     (1.923076923,-4.615384615)
```

Use each contact point with the supplied point to form the two tangent-line
equations. Keep extra calculator digits until the final answer.

### Copy this program

```text
?→A
?→B
?→C
?→D
?→X
D-A→D
X-B→X
D²+X²→M
√((M)-C²)→Y
Y◢C÷M→M
A+M(CD-XY)◢B+M(CX+DY)◢A+M(CD+XY)◢B+M(CX-DY)◢
```

## Extra L — Annuity and Loan Engine (107B)

Uses a constant percentage interest rate per payment period and payments made
at the **end** of each period. Enter the rate per period, not automatically the
annual rate: for a nominal annual rate of 6% compounded monthly, enter `B=0.5`.
The interest rate must be non-zero.

### Inputs and outputs

| `M` | Find | `A?` | `B?` | `C?` | `D?` | Output |
|---:|---|---|---|---|---|---|
| `1` | future savings value | starting balance | rate % per period | number of periods | regular deposit | future value |
| `2` | regular loan payment | original loan | rate % per period | total payments | — | payment |
| `3` | outstanding loan | original loan | rate % per period | payments already made | regular payment | balance |

### Examples

Start with `$1000`, then deposit `$100` at the end of each month for 12 months
at 1% per month:

```text
TYPE  M=1, A=1000, B=1, C=12, D=100
GET   future value 2395.075331
```

Repay a `$100000` loan over 240 monthly payments at 0.5% per month:

```text
TYPE  M=2, A=100000, B=0.5, C=240
GET   monthly payment 716.4310585
```

After 12 payments of that amount:

```text
TYPE  M=3, A=100000, B=0.5, C=12, D=716.4310585
GET   outstanding balance 97330.20118
```

### Copy this program

```text
?→M
?→A
?→B
B÷100→B
?→C
(1+B)^(C)→X
M=2⇒AB÷(1-1÷X)→Y
M=2⇒Goto 9
?→D
M=1⇒AX+D(X-1)÷B→Y
M=3⇒AX-D(X-1)÷B→Y
Lbl 9
Y◢
```

## Extra M — Four Centres of Any Triangle (385B)

Returns all four classical centres for **any non-collinear triangle**, replacing
the old Library program that only accepted one special right-triangle layout.
This is the general version represented in the supplied S5 program list.

Set this program's run mode to `REG`; it uses the calculator's linear-statistics
registers internally to preserve the three coordinate pairs. `ClrStat` runs at
the start, so existing statistics data is cleared.

### Inputs

| Prompt | Enter |
|---|---|
| `A?`, `B?` | first vertex `(x₁,y₁)` |
| `C?`, `D?` | second vertex `(x₂,y₂)` |
| `X?`, `Y?` | third vertex `(x₃,y₃)` |

### Outputs

Eight answers appear as four consecutive coordinate pairs:

| Pair | Centre | Property useful in written working |
|---:|---|---|
| 1 | centroid `G` | intersection of medians; divides each median `2:1` |
| 2 | incentre `I` | equidistant from the three sides |
| 3 | orthocentre `H` | intersection of altitudes |
| 4 | circumcentre `O` | equidistant from the three vertices |

### Examples

For `(0,0)`, `(24,0)` and `(12,9)`:

```text
TYPE  A=0, B=0, C=24, D=0, X=12, Y=9
GET   G=(12,3), I=(12,4), H=(12,16), O=(12,-3.5)
```

For the right triangle `(0,0)`, `(6,0)` and `(0,6)`:

```text
TYPE  A=0, B=0, C=6, D=0, X=0, Y=6
GET   G=(2,2), I=(1.757359313,1.757359313), H=(0,0), O=(3,3)
```

Collinear points do not define these four centres and produce `Math ERROR`. In
Paper 1, still state the relevant geometric property; coordinates alone do not
replace the required reasoning.

### Copy this program

```text
ClrStat
?→A
?→B
A,B DT
?→C
?→D
C,D DT
?→X
?→Y
X,Y DT
Σx÷3◢
Σy÷3◢
√((C-X)²+(D-Y)²)+√((X-A)²+(Y-B)²)+√((A-C)²+(B-D)²)→M
(√((C-X)²+(D-Y)²)×A+√((X-A)²+(Y-B)²)×C+√((A-C)²+(B-D)²)×X)÷M◢
(√((C-X)²+(D-Y)²)×B+√((X-A)²+(Y-B)²)×D+√((A-C)²+(B-D)²)×Y)÷M◢
2×(A×(D-Y)+C×(Y-B)+X×(B-D))→M
Pol(((A²+B²)×(D-Y)+(C²+D²)×(Y-B)+(X²+Y²)×(B-D))÷M,((A²+B²)×(X-C)+(C²+D²)×(A-X)+(X²+Y²)×(C-A))÷M)
Rec(X,Y)
Σx-2X◢
Σy-2Y◢
X◢
Y◢
```

## Syllabus basis

The program choices come from the Education Bureau's
[Explanatory Notes to the Mathematics Curriculum — Compulsory Part](https://www.edb.gov.hk/attachment/en/curriculum-development/kla/ma/curr/EN_CP_e.pdf),
especially quadratics, equations, exponential growth and decay, arithmetic and
geometric sequences, coordinate geometry, circle equations, trigonometric
equations and measures of dispersion.

The [HKEAA Mathematics assessment framework](https://www.hkeaa.edu.hk/DocLibrary/HKDSE/Subject_Information/math/2026hkdse-e-math.pdf)
explains the examination structure and the broader Compulsory Part coverage in
the later sections of the papers.

The probability, roots-of-equations and circle work in this pack was also
checked against the structure of the official
[2023 Paper 1 Level 5 exemplars](https://www.hkeaa.edu.hk/DocLibrary/HKDSE/Subject_Information/math/2023-Sample-MATH-CP-Level5-E-4792.pdf).

The Education Bureau's official materials identify the four triangle centres
as the centroid, circumcentre, incentre and orthocentre, and discuss their
continued use in HKDSE questions in
[School Mathematics Newsletter Issue 28](https://www.edb.gov.hk/attachment/en/curriculum-development/kla/ma/res/smn_28.pdf).
