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
| E | line–circle intersections | finds tangent/secant points, not just circle properties |
| F | first sequence sum reaching a target | P2 requires `n` to be known already |
| G | bearings and 3D displacement | handles quadrant corrections and spatial components |
| H | cubic synthetic division | reduces a cubic from one known root and finds the others |
| I | hypergeometric probability ranges | evaluates exact, at-least and at-most cases in one run |
| J | transformed quadratic roots | forms new equations without first finding the original roots |
| K | tangents from a point to a circle | returns both points of contact and the tangent length |
| L | annuities and reducing-balance loans | handles regular payments, not just one-off compound growth |
| M | four centres of a triangle | finds centroid, circumcentre, orthocentre or incentre from three points |
| N | direct and inverse variation | finds the constant and predicts either `x` or `y` for power models |

### Suggested four-slot combinations

| Focus | P1 | P2 | P3 | P4 | Total |
|---|---|---|---|---|---:|
| Original Core pack | Quadratic | Sequences | Coordinate | Trig | 652B |
| Algebra and growth | Quadratic | Extra A | Sequences | Extra C | 509B |
| Coordinate geometry | Coordinate | Extra B | Extra A | Trig | 647B |
| Statistics and algebra | Sequences | Extra D | Extra A | Trig | 560B |
| Advanced Section B / MCQ | Extra E | Extra F | Extra G | Extra H | 680B |
| Paper 1 Section B power pack | Extra I | Extra J | Extra K | Extra L | 668B |
| Centres and variation | Extra M | Extra N | Quadratic | Extra D | 660B |

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

## Advanced Section B / MCQ library

These four programs target longer Paper 1 Section B calculations and the
non-foundation-style questions found in Paper 2 Section B. They automate the
arithmetic after you have formed the correct equation or model; they do not
replace the working that Paper 1 requires.

All four advanced programs occupy exactly `680B`, so install them only as a
complete alternative to the earlier packs. There is no spare byte for editing.

## Extra E — Line–Circle Intersections (169B)

Finds the intersection points of a circle and a non-vertical straight line.
Write the two equations as

```text
x² + y² + Ax + By + C = 0
y = Xx + Y
```

Here `X` is the line's slope and `Y` is its y-intercept.

### Inputs

| Prompt | Enter |
|---|---|
| `A?`, `B?`, `C?` | coefficients of the circle equation |
| `X?` | slope of the line |
| `Y?` | y-intercept of the line |

### Outputs

1. Intersection discriminant
2. First point `x₁`, then `y₁`
3. Second point `x₂`, then `y₂`

If the discriminant is negative, there is no intersection. If it is zero, the
line is tangent and only one point is shown. A vertical line `x=k` must first be
handled algebraically because it cannot be written as `y=Xx+Y`.

### Examples

For `x²+y²−4x−2y−4=0` and `y=1`:

```text
TYPE  A=-4, B=-2, C=-4, X=0, Y=1
GET   discriminant 36, points (5,1) and (-1,1)
```

For the same circle and tangent `y=4`:

```text
TYPE  A=-4, B=-2, C=-4, X=0, Y=4
GET   discriminant 0, tangent point (2,4)
```

### Copy this program

```text
?→A
?→B
?→C
?→X
?→Y
(2×X×Y+A+B×X)²-4×(1+X²)×(Y²+B×Y+C)→M
M◢
M<0⇒Goto 9
(-(2×X×Y+A+B×X)+√(M))÷(2×(1+X²))→C
C◢
X×C+Y◢
M=0⇒Goto 9
(-(2×X×Y+A+B×X)-√(M))÷(2×(1+X²))→C
C◢
X×C+Y◢
Lbl 9
```

## Extra F — Sequence Target Solver (202B)

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
1→X
M=1⇒Goto 1
M=2⇒Goto 2
Goto 9
Lbl 1
While X×(2×A+(X-1)×B)÷2<C
X+1→X
WhileEnd
X◢
X×(2×A+(X-1)×B)÷2◢
Goto 9
Lbl 2
B=1⇒Goto 3
While A×(1-B^(X))÷(1-B)<C
X+1→X
WhileEnd
X◢
A×(1-B^(X))÷(1-B)◢
Goto 9
Lbl 3
While A×X<C
X+1→X
WhileEnd
X◢
A×X◢
Lbl 9
```

## Extra G — Bearings and 3D Displacement (184B)

Puts two common geometry calculations behind one selector and switches to
degrees automatically.

### Mode 1 — plan distance and bearing

At `M?`, enter `1`. Then enter east/west displacement at `A?` and north/south
displacement at `B?`:

- east and north are positive;
- west and south are negative.

Outputs: plan distance, then the three-figure bearing measured clockwise from
north. The displacement must not be `(0,0)`.

Example: travel `3` units east and `4` units north.

```text
TYPE  M=1, A=3, B=4
GET   distance 5, bearing 36.86989765°
```

### Mode 2 — 3D segment

At `M?`, enter `2`. Enter two perpendicular horizontal components at `A?` and
`B?`, then the vertical component at `C?`.

Outputs: horizontal projection, spatial length, then the acute angle of
elevation/depression to the horizontal. The horizontal projection must be
non-zero.

```text
TYPE  M=2, A=3, B=4, C=12
GET   horizontal 5, spatial length 13, angle 67.38013505°
```

### Copy this program

```text
Deg
?→M
M=1⇒Goto 1
M=2⇒Goto 2
Goto 9
Lbl 1
?→A
?→B
√(A²+B²)◢
B=0⇒Goto 3
tan^-1(A÷B)→X
B<0⇒X+180→X
X<0⇒X+360→X
X◢
Goto 9
Lbl 3
A>0⇒Goto 4
270◢
Goto 9
Lbl 4
90◢
Goto 9
Lbl 2
?→A
?→B
?→C
√(A²+B²)→X
X◢
√(X²+C²)◢
tan^-1(Abs(C)÷X)◢
Lbl 9
```

## Extra H — Cubic Synthetic Division (125B)

Reduces a cubic polynomial when one root is already known, checks the remainder,
then solves the remaining quadratic factor.

Write the polynomial as

```text
Ax³ + Bx² + Cx + D
```

### Inputs

| Prompt | Enter |
|---|---|
| `A?`, `B?`, `C?`, `D?` | cubic coefficients, including any zero coefficient |
| `X?` | known root |

### Outputs

1. New `B` and new `C`, giving quotient `Ax²+Bx+C`
2. Remainder
3. If the remainder is zero: discriminant of the quotient
4. Remaining distinct real roots

A non-zero remainder means the supplied `X` is not a root. A negative
discriminant means the quadratic factor has no additional real roots.

### Example

For `x³−6x²+11x−6` with known root `1`:

```text
TYPE  A=1, B=-6, C=11, D=-6, X=1
GET   quotient x²−5x+6, remainder 0, discriminant 1, roots 3 and 2
```

The three adjacent `◢` commands below still pause separately; keeping them on
one source line saves the final three bytes needed for the 680B advanced pack.

### Copy this program

```text
?→A
?→B
?→C
?→D
?→X
B+A×X→B
C+B×X→C
D+C×X→D
B◢C◢D◢D≠0⇒Goto 9
B²-4×A×C→M
M◢
M<0⇒Goto 9
(-B+√(M))÷(2×A)◢
M=0⇒Goto 9
(-B-√(M))÷(2×A)◢
Lbl 9
```

## Paper 1 Section B power pack

The next four programs are designed as one **668B alternative pack** for the
longer structured questions in Paper 1 Section B. They cover probability,
algebra, coordinate geometry and financial modelling while leaving `12B` free.

The programs supply numerical results and checks. In Paper 1, still write the
formula, substitution and reasoning required by the question; a calculator
answer by itself does not earn the method marks.

## Extra I — Without-Replacement Probability (208B)

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
value of `D`: `max(0,C-B) ≤ D ≤ min(A,C)`. Counts must be non-negative integers,
and this compact program is intended for the small populations used in DSE
questions; factorials above `69!` exceed the calculator's numerical range.

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
M=1⇒Goto 1
M=2⇒Goto 2
M=3⇒Goto 3
Goto 9
Lbl 1
D→X
D→Y
Goto 4
Lbl 2
D>X⇒D→X
Goto 4
Lbl 3
D<Y⇒D→Y
Lbl 4
0→M
While X≤Y
(M)+A!×B!×C!×(A+B-C)!÷(X!×(A-X)!×(C-X)!×(B-C+X)!×(A+B)!)→M
X+1→X
WhileEnd
M◢
Lbl 9
```

## Extra J — Transformed-Roots Builder (111B)

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
M=1⇒Goto 1
M=2⇒Goto 2
Goto 9
Lbl 1
?→X
?→Y
X×B÷A-2×Y◢
X²×C÷A-X×Y×B÷A+Y²◢
Goto 9
Lbl 2
2×C÷A-(B÷A)²◢
(C÷A)²◢
Lbl 9
```

## Extra K — Tangents from a Point to a Circle (176B)

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
point is shown once. If it lies inside the circle, the program ends without an
output because no real tangent exists.

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
(M)-C²→Y
Y<0⇒Goto 9
√(Y)◢
Y=0⇒Goto 8
A+(C²×D-C×X×√(Y))÷M◢
B+(C²×X+C×D×√(Y))÷M◢
A+(C²×D+C×X×√(Y))÷M◢
B+(C²×X-C×D×√(Y))÷M◢
Goto 9
Lbl 8
A+D◢
B+X◢
Lbl 9
```

## Extra L — Annuity and Loan Engine (173B)

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
M=1⇒Goto 1
M=2⇒Goto 2
M=3⇒Goto 3
Goto 9
Lbl 1
?→C
?→D
A×(1+B)^(C)+D×((1+B)^(C)-1)÷B◢
Goto 9
Lbl 2
?→C
A×B÷(1-(1+B)^(-C))◢
Goto 9
Lbl 3
?→C
?→D
A×(1+B)^(C)-D×((1+B)^(C)-1)÷B◢
Lbl 9
```

## Extra M — Four Centres of a Triangle (384B)

Finds the coordinates of the centroid, circumcentre, orthocentre or incentre of
a triangle from its three vertices. This is a swap-in program occupying one
slot; run it again with another mode if a question needs more than one centre.

### Inputs

| Prompt | Enter |
|---|---|
| `M?` | `1` centroid, `2` circumcentre, `3` orthocentre, or `4` incentre |
| `A?`, `B?` | first vertex `P(A,B)` |
| `C?`, `D?` | second vertex `Q(C,D)` |
| `X?`, `Y?` | third vertex `R(X,Y)` |

### Outputs

The centre's x-coordinate appears first, followed by its y-coordinate. The
three vertices must form a non-degenerate triangle. Enter the vertices in any
order; the answer is unchanged.

| `M` | Centre | Property useful in written working |
|---:|---|---|
| `1` | centroid `G` | intersection of medians; divides each median `2:1` |
| `2` | circumcentre `O` | equidistant from all three vertices |
| `3` | orthocentre `H` | intersection of altitudes |
| `4` | incentre `I` | equidistant from all three sides |

### Example

For the right-angled triangle with vertices `(0,0)`, `(6,0)` and `(0,8)`:

```text
TYPE  M=1, A=0, B=0, C=6, D=0, X=0, Y=8  → GET G=(2,2.666666667)
TYPE  M=2, A=0, B=0, C=6, D=0, X=0, Y=8  → GET O=(3,4)
TYPE  M=3, A=0, B=0, C=6, D=0, X=0, Y=8  → GET H=(0,0)
TYPE  M=4, A=0, B=0, C=6, D=0, X=0, Y=8  → GET I=(2,2)
```

In Paper 1, use the relevant defining property above to justify the centre;
the coordinates alone are normally only the calculation part of the answer.

### Copy this program

```text
?→M
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
M=1⇒Goto 1
M=2⇒Goto 2
M=3⇒Goto 3
M=4⇒Goto 4
Goto 9
Lbl 1
A+(C+X)÷3◢
B+(D+Y)÷3◢
Goto 9
Lbl 2
2×(C×Y-D×X)→M
A+((C²+D²)×Y-(X²+Y²)×D)÷M◢
B+(C×(X²+Y²)-X×(C²+D²))÷M◢
Goto 9
Lbl 3
2×(C×Y-D×X)→M
A+C+X-2×((C²+D²)×Y-(X²+Y²)×D)÷M◢
B+D+Y-2×(C×(X²+Y²)-X×(C²+D²))÷M◢
Goto 9
Lbl 4
√((C-X)²+(D-Y)²)+√(X²+Y²)+√(C²+D²)→M
A+(√(X²+Y²)×C+√(C²+D²)×X)÷M◢
B+(√(X²+Y²)×D+√(C²+D²)×Y)÷M◢
Lbl 9
```

## Extra N — Direct and Inverse Variation (96B)

Handles the power models

```text
direct:   y = kx^n
inverse:  y = k/x^n
```

It first finds and displays the constant `k`, then predicts either a new `y`
or the corresponding positive `x`. Use a positive power `n` at `D?`.

### Inputs and outputs

| `M` | Model and unknown | `A?` | `B?` | `C?` | `D?` | Outputs |
|---:|---|---|---|---|---|---|
| `1` | direct; find new `y` | known `x` | known `y` | new `x` | power `n` | `k`, new `y` |
| `2` | inverse; find new `y` | known `x` | known `y` | new `x` | power `n` | `k`, new `y` |
| `3` | direct; find new `x` | known `x` | known `y` | target `y` | power `n` | `k`, new `x` |
| `4` | inverse; find new `x` | known `x` | known `y` | target `y` | power `n` | `k`, new `x` |

### Examples

If `y` varies directly as `x³` and `y=16` when `x=2`, find `y` when `x=3`:

```text
TYPE  M=1, A=2, B=16, C=3, D=3
GET   k=2, y=54
```

If `y` varies inversely as `x²` and `y=12` when `x=2`:

```text
TYPE  M=2, A=2, B=12, C=3, D=2  → GET k=48, y=5.333333333
TYPE  M=4, A=2, B=12, C=3, D=2  → GET k=48, x=4 when target y=3
```

Use non-zero values wherever the model divides by `x`, `y` or `k`. Modes 3
and 4 return the principal positive solution expected in ordinary DSE variation
questions.

### Copy this program

```text
?→M
?→A
?→B
?→C
?→D
D→Y
M=2⇒-D→Y
M=4⇒-D→Y
B÷A^(Y)→X
X◢
M<3⇒Goto 1
(C÷X)^(1÷Y)◢
Goto 9
Lbl 1
X×C^(Y)◢
Lbl 9
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
