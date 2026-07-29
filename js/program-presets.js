// Copyable programs designed around the current HKDSE Mathematics Compulsory
// Part. Together they use the calculator's four areas as one exam toolkit.

export const HKDSE_CORE_MAX = {
  id: 'hkdse-core-max-2026',
  title: 'HKDSE Core MAX',
  eyebrow: 'OFFICIAL-SYLLABUS TOOLKIT · 4 PROGRAMS',
  description: 'High-frequency Core calculations, packed into all four program areas.',
  slots: [
    {
      name: 'Quadratic X-Ray',
      code: 'Δ · VTX · ROOT',
      mode: 'COMP',
      purpose: 'Discriminant, vertex and real roots in one run.',
      inputs: 'A=a · B=b · C=c',
      outputs: 'Δ · h · k · x₁ · x₂',
      note: 'If Δ<0 it stops after the vertex. A repeated root is shown once.',
      source: `?→A
?→B
?→C
B²-4×A×C→D
D◢
-B÷(2×A)→X
X◢
C-B²÷(4×A)→Y
Y◢
D<0⇒Goto 9
(-B+√(D))÷(2×A)→X
X◢
D=0⇒Goto 9
(-B-√(D))÷(2×A)→Y
Y◢
Lbl 9`
    },
    {
      name: 'Sequence Engine',
      code: 'AP · GP · ∞GP',
      mode: 'COMP',
      purpose: 'Terms and sums for arithmetic and geometric sequences.',
      inputs: 'M=1: A=a,B=d,C=n · M=2: A=a,B=r,C=n · M=3: A=a,B=r',
      outputs: 'M=1/2: Tₙ · Sₙ · M=3: S∞',
      note: 'For M=3, use only when |r|<1.',
      source: `?→M
M=1⇒Goto 1
M=2⇒Goto 2
M=3⇒Goto 3
Goto 9
Lbl 1
?→A
?→B
?→C
A+(C-1)×B→X
X◢
C×(2×A+(C-1)×B)÷2→Y
Y◢
Goto 9
Lbl 2
?→A
?→B
?→C
A×B^(C-1)→X
X◢
B=1⇒Goto 4
A×(1-B^(C))÷(1-B)→Y
Y◢
Goto 9
Lbl 4
A×C→Y
Y◢
Goto 9
Lbl 3
?→A
?→B
A÷(1-B)→X
X◢
Lbl 9`
    },
    {
      name: 'Coordinate Lab',
      code: 'LINE · CIRCLE',
      mode: 'COMP',
      purpose: 'Two-point line data or a circle from its general equation.',
      inputs: 'M=1: A=x₁,B=y₁,C=x₂,D=y₂ · M=2: A=D,B=E,C=F',
      outputs: 'M=1: distance · mid-x · mid-y · slope · M=2: h · k · r',
      note: 'M=2 uses x²+y²+Dx+Ey+F=0. A vertical line reports Math ERROR only after its first three answers.',
      source: `?→M
M=1⇒Goto 1
M=2⇒Goto 2
Goto 9
Lbl 1
?→A
?→B
?→C
?→D
√((C-A)²+(D-B)²)→X
X◢
(A+C)÷2→X
X◢
(B+D)÷2→Y
Y◢
(D-B)÷(C-A)→M
M◢
Goto 9
Lbl 2
?→A
?→B
?→C
-A÷2→X
X◢
-B÷2→Y
Y◢
√((A²+B²)÷4-C)→M
M◢
Lbl 9`
    },
    {
      name: 'Trig 360',
      code: 'ALL SOLUTIONS',
      mode: 'COMP',
      purpose: 'All distinct solutions from 0° up to, but not including, 360°.',
      inputs: 'M=1 sin · M=2 cos · M=3 tan · then D after isolating the trig ratio',
      outputs: 'Angles in ascending order',
      note: 'For sin/cos, D must be from −1 to 1. The program switches the calculator to degrees.',
      source: `Deg
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
X=0⇒Goto 9
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
Lbl 9`
    }
  ]
};
