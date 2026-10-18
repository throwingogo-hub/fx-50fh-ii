# S5 CASIO fx-50FH program set

These are the seven programs from the S5 program list, plus complex-number
variant of Programs 2, 5 plus two quadratic-curve solvers. They are available in the web calculator's
**Program Studio → HKDSE Library**. Nothing installs automatically: a single
program always asks for a destination slot, and an occupied slot or a pack
needs a second confirmation before anything is replaced.

Every heading shows the exact Program Studio byte count. The eleven programs total
**1787B**, more than the shared **680-byte** program memory, so install the ones
you need or one of the ready-made packs.

## Install from the in-app Library

1. Open Program Studio and choose **HKDSE Library**.
2. Search by topic or choose a category.
3. Select the destination P1-P4 slot, then press **Install**.
4. If the slot already contains a program, confirm the replacement once more.
5. For a complete setup, choose one of the memory-safe four-slot packs.

Program Studio keeps one-step Undo after a Library, pack or backup install. Use
**Export all** to download a versioned JSON backup before larger changes.

## Install manually

1. Open Program Studio's **Editor** and select P1, P2, P3 or P4.
2. Set **Run mode** to the mode printed beside that program (COMP for six of
   the programs, CMPLX for P8 and REG for P7).
3. Copy the entire matching code block below and paste it into **source**.
4. Wait for **Structure OK**; the slot is saved automatically on this device.

## Run a program

- In Program Studio, select its slot and press **Run on calculator**; or
- On the calculator home screen, press **Prog**, then 1, 2, 3 or 4.

When the display shows A?, B? or another variable prompt, type the requested
value and press **EXE**. Each answer pauses on screen; press **EXE** again for the
next one. The last value appears as the program ends.

For a negative input on the physical calculator use the (-) key. On the web
keypad the ordinary - key works as a negative sign too, both at a program
prompt and on the calculation line.
## P1 — Quadratic: Vertex, Optimum and Roots (61B)

**Use it to** Read the vertex, the optimum value and both real roots of any quadratic in one run.

**Input.** a, b and c of ax² + bx + c = 0, in that order.

**Output.** Vertex x, the optimum value (vertex y), then the two real roots.

### Example

```text
Solve f(x) = x² + 2x − 15 and describe its graph.

TYPE   1  EXE   2  EXE   (-)15  EXE
GET    -1      vertex x-coordinate (h)
       -16     minimum value (k)
       3       first root
       -5      second root

NOTE   The second root appears when the program finishes; press EXE once
       more if the display is still showing the first root. If Math ERROR
       appears at the first root, b² - 4ac < 0 and the roots are not real.
```

### Copy

```text
?→A
?→B
?→C
B²-4AC→D
-B÷(2A)◢
-D÷(4A)◢
(√(D)-B)÷(2A)◢
-B÷A-Ans
```

## P2 — Simultaneous Linear Equations in Two Unknowns (51B)

**Use it to** Solve two linear equations in x and y without rearranging either of them.

**Input.** A, B, C of Ax + By = C, then D, X, Y of Dx + Xy = Y.

**Output.** x, then y.

### Example

```text
Solve  x + y = 1  and  2x - y = 5.

TYPE   1  EXE   1  EXE   1  EXE   2  EXE   (-)1  EXE   5  EXE
GET    2      x
       -1     y

NOTE   The six values are read as A, B, C, D, X, Y. Put the constant of each
       equation on the right-hand side before you start. If the determinant
       XA - BD is zero the lines are parallel or identical, and Math ERROR is shown.
```

### Copy

```text
?→A
?→B
?→C
?→D
?→X
?→Y
(XC-BY)÷(XA-BD)→M◢
C÷B-AM÷B
```

## P3 — Cubic Equations (273B)

**Use it to** Return every real root of a cubic without guessing a factor first.

**Input.** a, b, c and d of ax³ + bx² + cx + d = 0.

**Output.** The distinct real roots, one pause each.

### Example

```text
Factorise x³ + 6x² + 11x + 6 = 0.

TYPE   1  EXE   6  EXE   11  EXE   6  EXE
GET    -1, -2, -3   the three roots

       so  x³ + 6x² + 11x + 6 = (x + 1)(x + 2)(x + 3).

NOTE   Three pauses means three distinct real roots. One pause means one real
       root and a complex conjugate pair, which this program does not print.
       A repeated root is printed once. Example: 2, 7, 5, 1 gives -0.5, -0.382 and -2.62.
```

### Copy

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
cos⁻¹((3×D÷(2×X))×√((-3÷X)))÷3→M
2×√((-X÷3))→A
A×cos(M)-Y◢
A×cos(M - 120)-Y◢
A×cos(M - 240)-Y◢
Lbl 9
```

## P4 — Centre and Radius of a Circle (38B)

**Use it to** Complete the square instantly for x² + y² + Cx + By + A = 0.

**Input.** C, B and A of x² + y² + Cx + By + A = 0.

**Output.** Centre x, centre y, then the radius.

### Example

```text
Find the centre and radius of x² + y² + 4x - 8y + 3 = 0.

TYPE   4  EXE   (-)8  EXE   3  EXE
GET    -2           x-coordinate of the centre
       4            y-coordinate of the centre
       4.123105626  radius = √17

NOTE   The radius appears when the program finishes. Math ERROR at that step
       means x² + y² + Cx + By + A = 0 is not a real circle.
```

### Copy

```text
?→A
?→B
?→C
-A÷2→X◢
-B÷2→Y◢
√(X²+Y²-C)
```

## P5 — Intersection Points of a Straight Line and a Circle (201B)

**Use it to** Substitute the line into the circle and print both intersection points.

**Input.** D, X, Y of the line Dx + Xy = Y, then C, B, A of x² + y² + Cx + By + A = 0.

**Output.** x1, y1, x2, y2.

### Example

```text
Where does x + 7y = 40 meet x² + y² - 2x - 4y - 20 = 0?

TYPE   1  EXE   7  EXE   40  EXE   (-)2  EXE   (-)4  EXE   (-)20  EXE
GET    5, 5      first intersection point
       -2, 6     second intersection point

       A vertical line also works: x = 4 and x² + y² - 6x - 6y + 8 = 0
       (TYPE 1, 0, 4, -6, -6, 8) gives (4, 6) and (4, 0).

NOTE   Input order is the line first, then the circle. A line that misses the
       circle gives Math ERROR because the discriminant is negative.
```

### Copy

```text
?→D
?→X
?→Y
?→C
?→B
?→A
X=0⇒Goto 1
Y²+CDY+AD²→A
-2XY-CDX+BD²→B
D²+X²→M
(-B-√(B²-4AM))÷(2M)→C
(Y-CX)÷D◢
C◢
(-B+√(B²-4AM))÷(2M)→C
(Y-CX)÷D◢
C◢
Goto 2
Lbl 1
Y÷D→X◢
C²-4(X²+BX+A)→M
(-C+√(M))÷2◢
X◢
(-C-√(M))÷2◢
Lbl 2
```

## P6 — Centre, Radius and Equation from Three Given Points (166B)

**Use it to** Build the circle through three points and print its equation in general form.

**Input.** x1, y1, x2, y2, x3, y3.

**Output.** Centre x, centre y, radius, then -2h, -2k and h² + k² - r² for the equation.

### Example

```text
Find the circle through (5, 2), (2, 3) and (6, -5).

TYPE   5  EXE   2  EXE   2  EXE   3  EXE   6  EXE   (-)5  EXE
GET    2, -2        centre (h, k)
       5            radius
       -4, 4, -17   the equation x² + y² - 4x + 4y - 17 = 0

NOTE   Enter the six coordinates in point order. Collinear points give
       Math ERROR because no circle passes through them.
```

### Copy

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
A+C→X
B+M→Y
X◢Y◢
√((X-A)²+(Y-B)²)→M◢
-2X◢-2Y◢
X²+Y²-M²
```

## P7 — Centres of a Triangle (385B)

**Use it to** All four triangle centres from the three vertex coordinates.

**Input.** x1, y1, x2, y2, x3, y3.

**Output.** Centroid, incentre, orthocentre, then circumcentre.

### Example

```text
Take the triangle with vertices O(0, 0), A(24, 0) and B(12, 9).

TYPE   0  EXE   0  EXE   24  EXE   0  EXE   12  EXE   9  EXE
GET    12, 3      centroid G
       12, 4      incentre I
       12, 16     orthocentre H
       12, -3.5   circumcentre O

NOTE   This program runs in REG mode and reads the vertices in input order.
       If Math ERROR appears, enter the origin first, then the other two
       vertices: 0, 0, 6, 0, 0, 6 gives G(2, 2), I(1.757, 1.757), H(0, 0), O(3, 3).
```

### Copy

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

## P8 — Simultaneous Equations (Complex) (51B)

**Use it to** Solve two simultaneous equations whose coefficients, or whose answers, are complex.

**Input.** A, B, C of Ax + By = C then D, X, Y of Dx + Xy = Y; each value may be typed as a+bi.

**Output.** x, then y. A complex answer shows its real part first; SHIFT EXE shows the imaginary part.

### Example

```text
Solve  (1 + i)x + y = 2  and  x − y = i.

TYPE   1+i  EXE   1  EXE   2  EXE   1  EXE   (-)1  EXE   i  EXE
GET    1      x — a real number, so Re⇔Im shows 0
       1      y, real part
       -1     y, imaginary part (press SHIFT EXE)

NOTE   Run the program in CMPLX mode — i is ALPHA ENG. Every coefficient may
       be real or complex, and either answer may be complex. At a paused
       answer, SHIFT EXE turns the display over to the imaginary part.
       A zero determinant XA - BD gives Math ERROR.
```

### Copy

```text
?→A
?→B
?→C
?→D
?→X
?→Y
(XC-BY)÷(XA-BD)→M◢
C÷B-AM÷B
```

## P9 — Intersections of a Line and a Circle (Complex) (201B)

**Use it to** Find where a line meets a circle, even when they do not meet in the real plane — the answers come back as a complex conjugate pair.

**Input.** D, X, Y of the line Dx + Xy = Y, then C, B, A of x² + y² + Cx + By + A = 0.

**Output.** x1, y1, x2, y2. Complex answers show the real part first and the imaginary part after SHIFT EXE.

### Example

```text
Where does x + y = 10 meet x² + y² = 25?

TYPE   1  EXE   1  EXE   10  EXE   0  EXE   0  EXE   (-)25  EXE
GET    5 + 3.535533906i   x1
       5 - 3.535533906i   y1
       5 - 3.535533906i   x2
       5 + 3.535533906i   y2

NOTE   The line misses the circle, so the intersections are a complex
       conjugate pair. Each answer shows its real part first; SHIFT EXE
       shows the imaginary part. A line that does meet the circle prints
       real numbers exactly as the real line-circle program does:
       1, 7, 40, -2, -4, -20 gives (5, 5) and (-2, 6).
```

### Copy

```text
?→D
?→X
?→Y
?→C
?→B
?→A
X=0⇒Goto 1
Y²+CDY+AD²→A
-2XY-CDX+BD²→B
D²+X²→M
(-B-√(B²-4AM))÷(2M)→C
(Y-CX)÷D◢
C◢
(-B+√(B²-4AM))÷(2M)→C
(Y-CX)÷D◢
C◢
Goto 2
Lbl 1
Y÷D→X◢
C²-4(X²+BX+A)→M
(-C+√(M))÷2◢
X◢
(-C-√(M))÷2◢
Lbl 2
```

## P10 — Simultaneous Equations (Quadratic, Complex) (111B)

**Use it to** Solve two simultaneous equations that are quadratic in x — a curve and a line, or two curves — and return complex intersections when they do not meet in the real plane.

**Input.** A, B, C of y = Ax² + Bx + C, then D, X, Y of y = Dx² + Xx + Y. A straight line is the case D = 0.

**Output.** x1, y1, x2, y2; complex answers show the real part first and Re-Im for the imaginary part.

### Example

```text
Where do y = x² + 2x + 3 and y = x meet?

TYPE   1  EXE   2  EXE   3  EXE   0  EXE   1  EXE   0  EXE
GET    -0.5 - 1.658312395i   x1
       -0.5 - 1.658312395i   y1
       -0.5 + 1.658312395i   x2
       -0.5 + 1.658312395i   y2

NOTE   The line misses the parabola, so the intersection points are a complex
       conjugate pair; SHIFT EXE shows each imaginary part. A line that does
       meet the curve gives real answers: y = x² and y = 2x + 3
       (1, 0, 0, 0, 2, 3) gives (-1, 1) and (3, 9).
       Set D = 0 for a straight line. A must differ from D.
```

### Copy

```text
?→A
?→B
?→C
?→D
?→X
?→Y
A-D→D
B-X→X
C-Y→M
(-X-√(X²-4DM))÷(2D)→Y
Y◢
A Y²+B Y+C◢
(-X+√(X²-4DM))÷(2D)→Y
Y◢
A Y²+B Y+C◢
```

## P11 — Intersections of Two Quadratic Curves (Complex) (249B)

**Use it to** Find where two quadratic curves meet — two circles, two ellipses of the same shape, or a circle and a same-shape ellipse — with complex intersection points when they do not meet.

**Before you start** write both equations in the form x² + p·y² + cx + dy + e = 0, i.e. divide each equation by its x² coefficient. Two circles already have p = 1, so nothing needs changing.

**Input.** p, c₁, d₁, e₁ (first curve) then c₂, d₂, e₂ (second curve).

**Output.** x₁, y₁, x₂, y₂; complex answers show the real part first and Re-Im for the imaginary part.

### Example

```text
Two circles that never meet:  x² + y² = 25  and  x² + y² − 20x + 91 = 0.
Normalise both to x² + p y² + c₁x + d₁y + e₁ = 0 (p = 1 for circles).

TYPE   1  EXE   0  EXE   0  EXE   (-)25  EXE   (-)20  EXE   0  EXE   91  EXE
GET    5.8                 x₁
       0 - 2.939387691i   y₁
       5.8                 x₂
       0 + 2.939387691i   y₂

NOTE   The circles are too far apart, so the two intersection points are a
       complex conjugate pair; SHIFT EXE shows each imaginary part.
       Curves that do meet give real answers: x²+y²−4x−6y+9 = 0 with
       x²+y²−10x−6y+25 = 0  (1, -4, -6, 9, -10, -6, 25)  gives (2.667, 1.114)
       and (2.667, 4.886). The two equations must share the same x² and y²
       coefficients — divide both by that x² coefficient first.
```

### Copy

```text
?→A
?→B
?→C
?→D
?→X
?→Y
?→M
B-X→X
C-Y→Y
D-M→M
Y=0⇒Goto 1
-X÷Y→X
-M÷Y→M
A×M²+D+C×M→D
M×2×A×X+C×X+B→B
1+A×X²→Y
B²-4×Y×D→A
(-B-√(A))÷(2×Y)→C◢
X×C+M◢
(-B+√(A))÷(2×Y)→C◢
X×C+M◢
Goto 2
Lbl 1
-M÷X→M
M²+D+B×M→D
M◢
C²-4×A×D→B
(-C-√(B))÷(2×A)◢
M◢
(-C+√(B))÷(2×A)◢
Lbl 2
```

