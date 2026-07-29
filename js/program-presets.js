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
      guide: {
        inputs: [
          'A — coefficient a of x²',
          'B — coefficient b of x',
          'C — constant c'
        ],
        outputs: [
          'Discriminant Δ = b²−4ac',
          'Vertex x-coordinate h',
          'Vertex y-coordinate k',
          'Distinct real roots x₁ and x₂'
        ]
      },
      examples: [{
        title: 'Two real roots',
        question: 'x² − 5x + 6 = 0',
        inputs: [1, -5, 6],
        inputText: 'A=1 · B=−5 · C=6',
        outputs: [1, 2.5, -0.25, 3, 2],
        outputText: 'Δ=1 · h=2.5 · k=−0.25 · roots 3, 2'
      }],
      source: `?→A
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
      guide: {
        inputs: [
          'M=1 AP — A first term, B common difference, C term number n',
          'M=2 finite GP — A first term, B common ratio, C term number n',
          'M=3 infinite GP — A first term, B common ratio; require |B|<1'
        ],
        outputs: [
          'M=1 or 2 — answer 1 is Tₙ; answer 2 is Sₙ',
          'M=3 — the only answer is S∞'
        ]
      },
      examples: [
        {
          title: 'Arithmetic progression',
          question: 'a=2, d=3, n=5',
          inputs: [1, 2, 3, 5],
          inputText: 'M=1 · A=2 · B=3 · C=5',
          outputs: [14, 40],
          outputText: 'T₅=14 · S₅=40'
        },
        {
          title: 'Finite geometric progression',
          question: 'a=3, r=2, n=4',
          inputs: [2, 3, 2, 4],
          inputText: 'M=2 · A=3 · B=2 · C=4',
          outputs: [24, 45],
          outputText: 'T₄=24 · S₄=45'
        },
        {
          title: 'Infinite geometric progression',
          question: 'a=6, r=0.5',
          inputs: [3, 6, .5],
          inputText: 'M=3 · A=6 · B=0.5',
          outputs: [12],
          outputText: 'S∞=12'
        }
      ],
      source: `?→M
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
      guide: {
        inputs: [
          'M=1 two points — A=x₁, B=y₁, C=x₂, D=y₂',
          'M=2 circle x²+y²+Dx+Ey+F=0 — enter coefficient D as A, E as B, F as C'
        ],
        outputs: [
          'M=1 — distance, midpoint x, midpoint y, then slope',
          'M=2 — centre h, centre k, then radius r'
        ]
      },
      examples: [
        {
          title: 'Two points',
          question: '(0,0) and (3,4)',
          inputs: [1, 0, 0, 3, 4],
          inputText: 'M=1 · A=0 · B=0 · C=3 · D=4',
          outputs: [5, 1.5, 2, 4 / 3],
          outputText: 'distance 5 · midpoint (1.5,2) · slope 1.333333333'
        },
        {
          title: 'Circle equation',
          question: 'x²+y²−4x+6y−12=0',
          inputs: [2, -4, 6, -12],
          inputText: 'M=2 · A=−4 · B=6 · C=−12',
          outputs: [2, -3, 5],
          outputText: 'centre (2,−3) · radius 5'
        }
      ],
      source: `?→M
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
Lbl 9`
    },
    {
      name: 'Trig 360',
      code: 'ALL SOLUTIONS',
      mode: 'COMP',
      purpose: 'All distinct solutions for 0° ≤ θ ≤ 360°.',
      inputs: 'M=1 sin · M=2 cos · M=3 tan · then D after isolating the trig ratio',
      outputs: 'Angles in ascending order',
      note: 'For sin/cos, D must be from −1 to 1. The program switches the calculator to degrees.',
      guide: {
        inputs: [
          'M=1 sine · M=2 cosine · M=3 tangent',
          'D — the isolated trig value; e.g. 2sin θ=1 means D=0.5'
        ],
        outputs: [
          'Every distinct angle satisfying 0°≤θ≤360°, in ascending order',
          'Press EXE after each angle until the program returns home'
        ]
      },
      examples: [
        {
          title: 'Sine equation',
          question: '2sin θ=1',
          inputs: [1, .5],
          inputText: 'M=1 · D=0.5',
          outputs: [30, 150],
          outputText: 'θ=30°, 150°'
        },
        {
          title: 'Cosine endpoint',
          question: 'cos θ=1',
          inputs: [2, 1],
          inputText: 'M=2 · D=1',
          outputs: [0, 360],
          outputText: 'θ=0°, 360°'
        },
        {
          title: 'Negative tangent',
          question: 'tan θ=−1',
          inputs: [3, -1],
          inputText: 'M=3 · D=−1',
          outputs: [135, 315],
          outputText: 'θ=135°, 315°'
        }
      ],
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
Lbl 9`
    }
  ]
};
