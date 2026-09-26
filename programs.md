# HKDSE Core programs for fx-50FH II

These 22 programs are optional. They are available in the web calculator's
**Program Studio → HKDSE Library**, but nothing installs automatically. A single
program always asks for a destination slot, and an occupied slot or four-slot
pack requires a second confirmation before anything is replaced.

The complete P1–P4 Core pack uses **349 of 680 bytes**. It focuses on HKDSE
Mathematics Compulsory Part calculations that are slow or error-prone to repeat
by hand. The calculator already has direct `nPr`, `nCr`, SD/REG statistics and
built-in formula functions, so the pack does not duplicate them.

Every heading shows the exact Program Studio byte count. The complete 22-program
library is **2,007B**; ten recommended four-slot packs fit within the authentic
680-byte shared memory. Any deliberately removed diagnostic output or tighter
input restriction is stated in the relevant section below.

### Compact by design

The original 16 programs were rewritten from **2,207B to 1,500B** (32% smaller)
without losing a feature, which is what makes room for the six new programs and
the extra packs. The main techniques, useful for your own programs too:

- `If … Then …` with the `IfEnd` omitted at the end of a program replaces
  `Goto`/`Lbl` jumps.
- The final answer is left on the display instead of being paused with `◢`.
- `expr→X◢` stores and shows a value in one statement.
- Closing brackets before `→`, `◢` or the end of a line are omitted.
- Better formulas: one general-solution loop for P4, a perpendicular-foot method
  for E, `Pol`/`Rec` to carry two coordinates, and REG statistics as extra memory.

## Install from the in-app Library

1. Open [Program Studio](https://throwingogo-hub.github.io/fx-50fh-ii/) and choose **HKDSE Library**.
2. Search by topic or choose a category.
3. Select the destination P1–P4 slot, then press **Install**.
4. If the slot already contains a program, confirm the replacement once more.
5. For a complete setup, choose one of the ten memory-safe four-slot packs.

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
again to reveal the next answer. The last answer stays on the display when the
program ends.

For a negative input on the physical calculator, use the `(-)` key. In Program
Studio source and the examples below, an ordinary minus sign is fine. Some `◢`
pauses are followed immediately by the next statement because an extra line
break would consume another program byte.

## P1 — Quadratic X-Ray (61B)

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
5. Second real root (left on the display when the program ends)

If `Δ < 0`, P1 stops after the vertex because there are no real roots. If
`Δ = 0`, both roots are equal, so the repeated root appears twice.

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
B²-4AC→D◢-B÷2÷A→X◢-D÷4÷A◢If D≥0
Then X+√(D)÷2÷A◢2X-Ans
```

## P2 — Sequence Engine (85B)

P2 begins with `M?`. This selects the type of sequence.

### Inputs and outputs

| `M` | Calculation | Remaining inputs | Outputs |
|---:|---|---|---|
| `1` | Arithmetic progression | `A` first term, `B` common difference, `C=n` | `Tₙ`, then `Sₙ` |
| `2` | Finite geometric progression | `A` first term, `B` common ratio, `C=n` | `Tₙ`, then `Sₙ` |
| `3` | Infinite geometric progression | `A` first term, `B` common ratio | `0` (the limit of `Tₙ`), then `S∞` |

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
GET   Tₙ→0, S∞=12
```

### Copy into P2

```text
?→M
?→A
?→B
0→D
M<3⇒?→C
M=1⇒A+(C-1)B→D
M=2⇒AB^(C-1→D
D◢C(A+D)÷2→X
M≠1⇒(A-BD)÷(1-B→X
X
```

## P3 — Coordinate Lab (100B)

P3 begins with `M?`. Choose two-point geometry or a circle equation.

### Mode 1 — two points

Enter:

| Prompt | Enter |
|---|---|
| `M?` | `1` |
| `A?`, `B?` | first point `(x₁,y₁)` |
| `C?`, `D?` | second point `(x₂,y₂)` |

Outputs: distance, midpoint x-coordinate, midpoint y-coordinate, slope `m`, then
y-intercept `c`, so the line through the two points is `y = mx + c`. A vertical
line produces `Math ERROR` at the slope, after the first three useful answers
have already appeared.

Example for `(0,0)` and `(3,4)`:

```text
TYPE  M=1, A=0, B=0, C=3, D=4
GET   distance 5, midpoint (1.5,2), slope 1.333333333, intercept 0
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
If M=2
Then -A÷2◢-B÷2◢√(A²+B²-4C)÷2
Else ?→D
C-A→X
D-B→Y
√(X²+Y²)◢(A+C)÷2◢(B+D)÷2◢Y÷X◢B-AAns
```

## P4 — Trig 360 (103B)

P4 finds every distinct solution for `0° ≤ θ ≤ 360°`, in increasing order. It
switches the calculator to degrees automatically. Internally, every case is
rewritten as `sin(θ − c) = sin β` and the general solution
`θ = 180°n + (−1)ⁿβ + c` is scanned for `n = 0…3`, so one short loop replaces
the old separate sine, cosine and tangent branches.

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
sin⁻¹(D(M<3→B
tan⁻¹(D(M=3))-90(M=2→C
-1E-99→X
For 0→A To 3
C+180A+B(-1)^(A→Y
If (Y>X)(Y≤360
Then Y→X◢IfEnd
Next
X
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
| C | growth and decay unknowns | solves for final value, time or rate, and discounts back to a starting value |
| D | combined population statistics | combines summary data without the original observations |
| E | line–circle intersections | finds tangent/secant points when `k` appears in equation coefficients |
| F | first sequence sum reaching a target | P2 requires `n` to be known already |
| H | complete cubic equations | finds every real root without needing a known factor |
| I | hypergeometric probability ranges | evaluates exact, at-least and at-most cases in one run |
| J | transformed quadratic roots | forms new equations without first finding the original roots |
| K | tangents from a point to a circle | returns both points of contact and the tangent length |
| L | annuities and reducing-balance loans | handles regular payments, not just one-off compound growth |
| M | four centres of any triangle | returns G, I, H and O from three arbitrary non-collinear vertices |
| Q–V | six newer programs | listed in **More swap-in programs** below |

### Suggested four-slot combinations

| Focus | P1 | P2 | P3 | P4 | Total |
|---|---|---|---|---|---:|
| Original Core | Quadratic | Sequences | Coordinate | Trig | 349B |
| Algebra & growth | Quadratic | Extra A | Sequences | Extra C | 270B |
| Coordinate geometry | Coordinate | Extra B | Extra E | Extra R | 410B |
| Trigonometry & mensuration | Trig | Extra Q | Extra S | Extra M | 488B |
| Statistics & algebra | Sequences | Extra D | Extra A | Trig | 306B |
| Advanced Section B / MCQ | Extra E | Extra F | Extra H | Extra J | 393B |
| Paper 1 Section B | Extra I | Extra J | Extra K | Extra L | 309B |
| Centres & algebra | Extra M | Extra A | Quadratic | Extra J | 402B |
| M1 probability & statistics | Extra T | Extra V | Extra I | Extra D | 329B |
| M2 vectors & equations | Extra U | Extra H | Extra A | Extra Q | 375B |

## Extra A — Simultaneous 2×2 Solver (51B)

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
(CX-BY)÷M◢(AY-CD)÷M
```

## Extra B — Circle Through Three Points (114B)

Finds the centre and radius of the unique circle through three supplied points.
Unlike P3 mode 2, you do not need to derive the general circle equation first.
The centre is found as the circumcentre `O = (P₁+P₂+P₃−H)/2`, using the short
orthocentre formula, and `Pol`/`Rec` keep both coordinates without extra memory.

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
(CX+DY)÷(CY-DX→M
Pol((C+X-M(Y-D))÷2,(D+Y-M(C-X))÷2→M
Rec(M,Y
A+X◢B+Y◢M
```

## Extra C — Growth and Decay Solver (73B)

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

To find a **starting value**, use `M=1` with the final value at `A?` and a
**negative** number of periods at `C?`; this discounts backwards in time.

### Examples

```text
TYPE  M=1, A=1000, B=5, C=3        → GET 1157.625
TYPE  M=2, A=1000, B=10, C=1210    → GET 2 periods
TYPE  M=3, A=1000, B=1210, C=2     → GET 10%
TYPE  M=1, A=1157.625, B=5, C=-3   → GET start 1000
```

### Copy this program

```text
?→M
?→A
?→B
?→C
1+B÷100→Y
M=1⇒AY^(C→X
M=2⇒log(Y,C÷A→X
M=3⇒100(Cˣ√(B÷A)-1→X
X
```

## Extra D — Combined Population Statistics (67B)

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
A+D→M
(AB+DX)÷M◢√((A(C²+B²)+D(Y²+X²))÷M-Ans²
```

## Advanced Section B / MCQ library

These four programs target longer Paper 1 Section B calculations and the
non-foundation-style questions found in Paper 2 Section B. They automate the
arithmetic after you have formed the correct equation or model; they do not
replace the working that Paper 1 requires.

All four advanced programs occupy `393B`, leaving `287B` free for editing.

## Extra E — Line–Circle Intersections (124B)

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
intersection, the calculator shows `Math ERROR`. Vertical and horizontal lines
need no special case: the program drops a perpendicular from the circle's centre
to the line, then steps the half-chord length along the line in both directions.

### Examples

For `x²+y²+kx+y−4=0` and `x+ky=0`, take `k=1`:

```text
TYPE  M=1, A=M, B=1, C=-4, D=1, X=M, Y=0
GET   (-√2,√2), (√2,-√2)
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
-A÷2→A
-B÷2→B
A²+B²-C→C
D²+X²→M
(AD+BX+Y)÷M→Y
A-YD→A
B-YX→B
√(C÷M-Y²→C
A-CX◢B+CD◢If C
Then A+CX◢B-CD
```

## Extra F — Sequence Target Solver (62B)

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
Otherwise the search can end in `Time ERROR`. The program starts with
`ClrMemory`, which zeroes its counter and running sum in one command.

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
ClrMemory
?→M
?→A
?→B
?→C
While Y<C
X+1→X
Y+A→Y
M=1⇒A+B→A
M=2⇒AB→A
WhileEnd
X◢Y
```

## Extra H — Complete Cubic Solver (134B)

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

Every real root is shown. When the cubic has three real roots, including
repeated ones, the trigonometric form lists all three, so a double root appears
twice and a triple root three times. Otherwise Cardano's formula gives the single
real root. `Pol` turns the depressed cubic into an angle directly, so no extra
branch is needed for the repeated-root case. Complex roots are intentionally not
displayed because this is the real-number COMP version from the S5 list.

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

x³−3x+2=0   (roots 1, 1, −2)
TYPE  A=1, B=0, C=-3, M=2
GET   1, -2, 1
```

### Copy this program

```text
Deg
?→A
?→B
?→C
?→M
B÷3÷A→B
B²-C÷3÷A→X
B³-(BC-M)÷2÷A→D
D²-X³→M
If M≤0
Then Pol(-D,√(-M
For 0→M To 2
2∛(X)cos(Y÷3-120M)-B◢Next
Else √(M→M
∛(M-D)-∛(D+M)-B
```

## Paper 1 Section B power pack

The next four programs are designed as one **309B alternative pack** for the
longer structured questions in Paper 1 Section B. They cover probability,
algebra, coordinate geometry and financial modelling while leaving `371B` free.

The programs supply numerical results and checks. In Paper 1, still write the
formula, substitution and reasoning required by the question; a calculator
answer by itself does not earn the method marks.

## Extra I — Without-Replacement Probability (86B)

Uses the hypergeometric model for a population containing two types of item.
One run gives the probability of drawing **exactly**, **at least** and **at
most** a specified number of type-A items when all items are drawn together
**without replacement**; no mode selection is needed.

### Inputs

| Prompt | Enter |
|---|---|
| `A?` | number of type-A items in the population |
| `B?` | number of other items in the population |
| `C?` | total number of items drawn |
| `D?` | required number of type-A items |

### Outputs

1. `P(X = D)`
2. `P(X ≥ D)`
3. `P(X ≤ D)` (left on the display)

Enter a feasible value of `D`: `max(0,C-B) ≤ D ≤ min(A,C)`. Counts must be
non-negative integers. The program uses the calculator's native `nCr`.

### Examples

A box contains 5 red and 4 black balls, and 2 balls are drawn together:

```text
TYPE  A=5, B=4, C=2, D=2  → GET 0.2777777778, 0.2777777778, 1
TYPE  A=5, B=4, C=2, D=1  → GET 0.5555555556, 0.8333333333, 0.7222222222
```

So `P(exactly 2 red)=5/18`, `P(at least 1 red)=5/6` and `P(at most 1
red)=13/18`. For written working, show the combination expression. For example,
the first answer is `5C2 / 9C2`; Extra I is the fast arithmetic check and
range-summer.

### Copy this program

```text
?→A
?→B
?→C
?→D
(A+B)nCr C→Y
0→M
For (C-B)(C>B→X To D
A nCr X B nCr(C-X)÷Y M+
Next
A nCr D B nCr(C-D)÷Y◢1-M+Ans◢M
```

## Extra J — Transformed-Roots Builder (73B)

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

Enter `M=2` (any value other than `1` also works) and the original coefficients `A`, `B`, `C`. The outputs are again
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
If M=1
Then ?→X
?→Y
XB÷A-2Y◢X²C÷A-YAns-Y²
Else C÷A→X
2X-(B÷A)²◢X²
```

## Extra K — Tangents from a Point to a Circle (97B)

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
√(M-C²→Y◢C÷M→M
A+M(CD-XY)◢B+M(CX+DY)◢A+M(CD+XY)◢B+M(CX-DY
```

## Extra L — Annuity and Loan Engine (53B)

Uses a constant percentage interest rate per payment period and payments made
at the **end** of each period. Enter the rate per period, not automatically the
annual rate: for a nominal annual rate of 6% compounded monthly, enter `B=0.5`.
The interest rate must be non-zero.

One run answers both common questions, so there is no mode prompt:

1. After `A?`, `B?` and `C?`, the program shows the **level payment** that
   repays a loan of `A` in `C` periods.
2. It then asks `D?` for a regular payment and shows the **balance** after
   `C` periods. Enter deposits as positive values and loan repayments as
   **negative** values. Enter `0` at `D?` if you only needed the payment.

### Inputs

| Prompt | Enter |
|---|---|
| `A?` | starting balance or original loan |
| `B?` | interest rate % per period |
| `C?` | number of periods |
| `D?` | regular deposit (+) or repayment (−) |

### Examples

Start with `$1000`, then deposit `$100` at the end of each month for 12 months
at 1% per month:

```text
TYPE  A=1000, B=1, C=12   → GET 88.84878868 (payment, ignore)
TYPE  D=100               → GET future value 2395.075331
```

Repay a `$100000` loan over 240 monthly payments at 0.5% per month:

```text
TYPE  A=100000, B=0.5, C=240  → GET monthly payment 716.4310585
```

Outstanding balance after 12 payments of that amount:

```text
TYPE  A=100000, B=0.5, C=12   → (first answer not needed)
TYPE  D=-716.4310585          → GET outstanding balance 97330.20118
```

### Copy this program

```text
?→A
?→B
?→C
B%→B
(1+B)^(C→X
ABX÷(X-1)◢?→D
AX+D(X-1)÷B
```

## Extra M — Four Centres of Any Triangle (217B)

Returns all four classical centres for **any non-collinear triangle**, replacing
the old Library program that only accepted one special right-triangle layout.
This is the general version represented in the supplied S5 program list.

Set this program's run mode to `REG`. It stores the first vertex as one REG data
point, reads it back as `Σx` and `Σy`, and moves the triangle so that vertex
sits at the origin. That frees memories for short formulas: `H` comes from a
single dot-product ratio and `O = (3G − H)/2`. `ClrStat` runs at the start, so
existing statistics data is cleared.

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
?→X
?→Y
C-A→C
D-B→D
X-A→X
Y-B→Y
Σx+(C+X)÷3◢Σy+(D+Y)÷3◢√(X²+Y²→A
√(C²+D²→B
A+B+√((C-X)²+(D-Y)²→M
Σx+(AC+BX)÷M◢Σy+(AD+BY)÷M◢(CX+DY)÷(CY-DX→M
Σx+M(Y-D◢Σy+M(C-X◢Σx+(C+X-M(Y-D))÷2◢Σy+(D+Y-M(C-X))÷2
```

## More swap-in programs

These six programs were added after the programs above were compacted. They
cover triangle solving, point–line geometry, polygon areas, and the Module 1 and
Module 2 topics that are slowest to do by hand.

| Extra | Adds | Why it is different |
|---|---|---|
| Q | triangle solver (SSS and SAS) | sides, all angles and area in one run |
| R | point and line | perpendicular distance, foot and mirror image together |
| S | polygon area | shoelace area for any number of vertices |
| T | binomial and Poisson | exact and cumulative probabilities without long sums |
| U | 3D vectors | dot, angle, cross product and area for Module 2 |
| V | normal probability | `z` and both tail probabilities without tables |

## Extra Q — Triangle Solver (99B)

Solves a triangle with the cosine rule. Label the sides `a`, `b`, `c` opposite
angles `A`, `B`, `C`. Degree mode is set automatically.

### Inputs

| `M` | Case | `A?` | `B?` | `C?` |
|---:|---|---|---|---|
| `1` | SSS | side `a` | side `b` | side `c` |
| `2` | SAS | side `a` | side `b` | included angle `C` (degrees) |

### Outputs

1. Side `c` (the input again for SSS; the new side for SAS)
2. Angle `A`
3. Angle `B`
4. Angle `C`
5. Area `½ab sin C` (left on the display)

Impossible side lengths produce `Math ERROR`.

### Examples

```text
3-4-5 triangle     TYPE M=1, A=3, B=4, C=5
                   GET  c=5, A=36.86989765°, B=53.13010235°, C=90°, area 6
a=5, b=7, C=60°    TYPE M=2, A=5, B=7, C=60
                   GET  c=6.244997998, A=43.89788625°, B=76.10211375°, C=60°,
                        area 15.15544457
```

### Copy this program

```text
Deg
?→M
?→A
?→B
?→C
M=2⇒√(A²+B²-2ABcos(C→C
C◢cos⁻¹((B²+C²-A²)÷(2BC→X◢cos⁻¹((A²+C²-B²)÷(2AC→Y◢180-X-Y◢ABsin(Ans)÷2
```

## Extra R — Point and Line (72B)

Write the straight line in general form

```text
Ax + By + C = 0
```

and supply a point `(x, y)`. A line `y = mx + c` becomes `A=m`, `B=-1`, `C=c`.

### Inputs

| Prompt | Enter |
|---|---|
| `A?`, `B?`, `C?` | line coefficients |
| `X?`, `Y?` | the point |

### Outputs

1. Perpendicular distance from the point to the line
2. Foot of the perpendicular: `x`, then `y`
3. Reflection of the point in the line: `x`, then `y` (left on the display)

### Example

Point `(0,0)` and line `3x + 4y − 25 = 0`:

```text
TYPE  A=3, B=4, C=-25, X=0, Y=0
GET   distance 5, foot (3,4), image (6,8)
```

### Copy this program

```text
?→A
?→B
?→C
?→X
?→Y
A²+B²→M
(AX+BY+C)÷M→D
Abs(D)√(M)◢X-AD◢Y-BD◢X-2AD◢Y-2BD
```

## Extra S — Polygon Area (69B)

Finds the area of a triangle, quadrilateral or any simple polygon from its
vertex coordinates using the shoelace formula. There is no vertex limit.

### Inputs

1. Enter the first vertex at `A?` and `B?`.
2. Enter each following vertex, in order around the polygon, at `C?` and `D?`.
3. Finish by entering the **first vertex again** at `C?` and `D?`.

Clockwise and anticlockwise orders both work.

### Output

The area (left on the display). `ClrMemory` runs first because the program
accumulates in memory `M`.

### Example

Rectangle `(0,0)`, `(4,0)`, `(4,3)`, `(0,3)`:

```text
TYPE  A=0, B=0, then C,D = 4,0 · 4,3 · 0,3 · 0,0
GET   area 12
```

### Copy this program

```text
ClrMemory
?→A
?→B
A→X
B→Y
Lbl 1
?→C
?→D
XD-YC M+
C→X
D→Y
(X≠A)+(Y≠B)⇒Goto 1
Abs(M)÷2
```

## Extra T — Binomial and Poisson (93B)

For Mathematics Extended Part Module 1. One run gives exact and cumulative
probabilities, so no table look-up or long sum is needed.

### Inputs

| Prompt | Enter |
|---|---|
| `Y?` | `1` for binomial `B(n,p)`, `2` for Poisson `Po(λ)` |
| `A?` | `n` (binomial) or `λ` (Poisson) |
| `B?` | `p` — asked only for the binomial model |
| `C?` | the value `r` |

### Outputs

1. `P(X = r)`
2. `P(X ≥ r)`
3. `P(X ≤ r)` (left on the display)

`ClrMemory` runs first because the program accumulates in memory `M`.

### Examples

```text
B(10, 0.3), r=3   TYPE Y=1, A=10, B=0.3, C=3
                  GET  0.266827932, 0.6172172136, 0.6496107184
Po(2), r=1        TYPE Y=2, A=2, C=1
                  GET  0.2706705665, 0.8646647168, 0.4060058497
```

### Copy this program

```text
ClrMemory
?→Y
?→A
Y=1⇒?→B
?→C
For 0→X To C
Y=1⇒A nCr X B^(X)(1-B)^(A-X→D
Y=2⇒e^(-A)A^(X)÷X!→D
D M+
Next
D◢1-M+D◢M
```

## Extra U — 3D Vector Toolkit (91B)

For Mathematics Extended Part Module 2. Enter two vectors
`u = (A, B, C)` and `v = (D, X, Y)`. Degrees are set automatically.

### Inputs

| Prompt | Enter |
|---|---|
| `A?`, `B?`, `C?` | components of `u` |
| `D?`, `X?`, `Y?` | components of `v` |

### Outputs

1. Dot product `u·v`
2. Angle between `u` and `v` in degrees
3. `|u×v|`, the area of the parallelogram (halve it for a triangle)
4. `u×v`: `i`, `j`, then `k` component (left on the display)

### Example

```text
TYPE  A=1, B=2, C=3, D=4, X=5, Y=6
GET   u·v=32, angle 12.93315449°, |u×v|=7.348469228, u×v=(-3,6,-3)
```

### Copy this program

```text
Deg
?→A
?→B
?→C
?→D
?→X
?→Y
√((A²+B²+C²)(D²+X²+Y²→M
AD+BX+CY◢cos⁻¹(Ans÷M◢Msin(Ans)◢BY-CX◢CD-AY◢AX-BD
```

## Extra V — Normal Probability (83B)

Computes the standard score and the normal-distribution probabilities on either
side of `x`, replacing a table look-up. The program sums the always-positive
series `Φ(z) = ½ + φ(z)(z + z³/3 + z⁵/(3·5) + …)` until the next term is zero,
so it stays accurate far into the tails.

### Inputs

| Prompt | Enter |
|---|---|
| `A?` | mean `μ` |
| `B?` | standard deviation `σ` |
| `C?` | the value `x` |

### Outputs

1. Standard score `z = (x − μ)/σ`
2. `P(X < x)`
3. `P(X > x)` (left on the display)

For `P(a < X < b)`, run it for `b` and for `a`, then subtract the two `P(X < …)`
answers.

### Examples

```text
TYPE  A=0, B=1, C=1.96   → GET z=1.96, 0.9750021049, 0.02499789515
TYPE  A=50, B=10, C=40   → GET z=-1, 0.1586552539, 0.8413447461
```

### Copy this program

```text
?→A
?→B
?→C
(C-A)÷B→X◢X→Y
X→D
1→C
While Y
C+2→C
YX²÷C→Y
D+Y→D
WhileEnd
.5+De^(-X²÷2)÷√(2π◢1-Ans
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
