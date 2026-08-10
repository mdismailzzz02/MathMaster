import type { Question, Depth } from "./types";
import { mulberry32, randInt, buildOptions } from "./core";

type GenFn = (seed: number, idx: number) => Question;

// ─── functions ─────────────────────────────────────────
const functions: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const x = randInt(seed, 2, 6);
    const correct = String(x * 2 + 3);
    const wrongs = [String(x + 3), String(x * 3), String(x * 2)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `If \\(f(x) = 2x + 3\\), evaluate \\(f(${x})\\).`, options, correctIndex,
      explanation: `Substitute \\(x = ${x}\\): \\(f(${x}) = 2(${x}) + 3 = ${x * 2} + 3 = ${correct}\\).`,
      difficulty: "easy", topic: "Functions", subtopic: "functions",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const gx = randInt(seed, 3, 7);
    const fgx = gx * 2 + 1;
    const correct = String(fgx);
    const wrongs = [String(gx * 3), String(gx + 2), String(fgx + 1)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `If \\(f(x) = 2x + 1\\) and \\(g(x) = x^2\\), find \\(f(g(${Math.round(Math.sqrt(gx))}))\\).`, options, correctIndex,
      explanation: `\\(g(${Math.round(Math.sqrt(gx))}) = (${Math.round(Math.sqrt(gx))})^2 = ${gx}\\). Then \\(f(${gx}) = 2(${gx}) + 1 = ${correct}\\).`,
      difficulty: "medium", topic: "Functions", subtopic: "functions",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 4);
    const correct = `f^{-1}(x) = \\frac{x - 3}{${a}}`;
    const wrongs = [`f^{-1}(x) = ${a}x - 3`, `f^{-1}(x) = \\frac{x + 3}{${a}}`, `f^{-1}(x) = ${a}x + 3`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the inverse of \\(f(x) = ${a}x + 3\\).`, options, correctIndex,
      explanation: `Set \\(y = ${a}x + 3\\). Swap x and y: \\(x = ${a}y + 3\\). Solve for y: \\(y = \\frac{x - 3}{${a}}\\). So \\(${correct}\\).`,
      difficulty: "hard", topic: "Functions", subtopic: "functions",
    };
  },
};

// ─── domain-range ──────────────────────────────────────
const domainRange: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const root = randInt(seed, 2, 6);
    const correct = `x \\geq ${root}`;
    const wrongs = [`x > ${root}`, `x \\leq ${root}`, "all real numbers"];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `What is the domain of \\(f(x) = \\sqrt{x - ${root}}\\)?`, options, correctIndex,
      explanation: `The expression under the square root must be non-negative: \\(x - ${root} \\geq 0\\), so \\(${correct}\\).`,
      difficulty: "easy", topic: "Domain & Range", subtopic: "domain-range",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 5);
    const correct = `x \\neq ${a}`;
    const wrongs = [`x = ${a}`, `x > ${a}`, "all real numbers"];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `What is the domain of \\(f(x) = \\frac{2}{x - ${a}}\\)?`, options, correctIndex,
      explanation: `The denominator cannot be zero: \\(x - ${a} \\neq 0\\), so \\(${correct}\\).`,
      difficulty: "medium", topic: "Domain & Range", subtopic: "domain-range",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const c = randInt(seed, 1, 4);
    const correct = `y \\geq ${c}`;
    const wrongs = [`y > ${c}`, `y \\leq ${c}`, "all real numbers"];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `What is the range of \\(f(x) = x^2 + ${c}\\)?`, options, correctIndex,
      explanation: `The minimum value of \\(x^2\\) is 0, so the minimum of \\(x^2 + ${c}\\) is \\(${c}\\). Range: \\(${correct}\\).`,
      difficulty: "hard", topic: "Domain & Range", subtopic: "domain-range",
    };
  },
};

// ─── matrices ──────────────────────────────────────────
const matrices: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 5);
    const b = randInt(seed + 1, 1, 4);
    const c = randInt(seed + 2, 1, 4);
    const d = randInt(seed + 3, 2, 5);
    const det = a * d - b * c;
    const correct = String(det);
    const wrongs = [String(a * d), String(a * d + b * c), String(a + d)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the determinant: \\(\\begin{vmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{vmatrix}\\)`, options, correctIndex,
      explanation: `Determinant = \\(ad - bc = ${a} \\times ${d} - ${b} \\times ${c} = ${a * d} - ${b * c} = ${det}\\).`,
      difficulty: "easy", topic: "Matrices", subtopic: "matrices",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 4);
    const b = randInt(seed + 1, 1, 3);
    const c = randInt(seed + 2, 1, 3);
    const d = randInt(seed + 3, 2, 4);
    const e = randInt(seed + 4, 3, 6);
    const f = randInt(seed + 5, 1, 4);
    const r1c1 = a * d + b * f;
    const r1c2 = a * e + b * 2; // second col B is [e, 2]^T
    const r2c1 = c * d + 3 * f;
    const r2c2 = c * e + 3 * 2;
    const correct = `\\begin{pmatrix} ${r1c1} & ${r1c2} \\\\ ${r2c1} & ${r2c2} \\end{pmatrix}`;
    const wrongs = [
      `\\begin{pmatrix} ${a + d} & ${b + e} \\\\ ${c + f} & ${3 + 2} \\end{pmatrix}`,
      `\\begin{pmatrix} ${a * d} & ${b * e} \\\\ ${c * f} & ${6} \\end{pmatrix}`,
      `\\begin{pmatrix} ${r1c1 + 1} & ${r1c2} \\\\ ${r2c1} & ${r2c2 - 1} \\end{pmatrix}`,
    ];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Multiply: \\(\\begin{pmatrix} ${a} & ${b} \\\\ ${c} & 3 \\end{pmatrix} \\begin{pmatrix} ${d} & ${e} \\\\ ${f} & 2 \\end{pmatrix}\\)`, options, correctIndex,
      explanation: `Row 1 × Col 1: \\(${a} \\times ${d} + ${b} \\times ${f} = ${r1c1}\\). Row 1 × Col 2: \\(${a} \\times ${e} + ${b} \\times 2 = ${r1c2}\\). Row 2 × Col 1: \\(${c} \\times ${d} + 3 \\times ${f} = ${r2c1}\\). Row 2 × Col 2: \\(${c} \\times ${e} + 3 \\times 2 = ${r2c2}\\).`,
      difficulty: "medium", topic: "Matrices", subtopic: "matrices",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 4);
    const b = randInt(seed + 1, 1, 3);
    const c = randInt(seed + 2, 1, 3);
    const d = randInt(seed + 3, 2, 4);
    const det = a * d - b * c;
    const correct = `\\frac{1}{${det}} \\begin{pmatrix} ${d} & ${-b} \\\\ ${-c} & ${a} \\end{pmatrix}`;
    const wrongs = [
      `\\begin{pmatrix} ${d} & ${b} \\\\ ${c} & ${a} \\end{pmatrix}`,
      `\\frac{1}{${det}} \\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}`,
      `\\begin{pmatrix} ${a} & ${-b} \\\\ ${-c} & ${d} \\end{pmatrix}`,
    ];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the inverse of \\(\\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}\\) (if it exists).`, options, correctIndex,
      explanation: `For a 2×2 matrix, \\(A^{-1} = \\frac{1}{ad - bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}\\). Here \\(ad - bc = ${det}\\), so \\(${correct}\\).`,
      difficulty: "hard", topic: "Matrices", subtopic: "matrices",
    };
  },
};

// ─── rational-expressions ──────────────────────────────
const rationalExpressions: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 5);
    const x = randInt(seed + 1, 2, 5);
    const correct = String(a * x);
    const wrongs = [String(a), String(x), String(a + x)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Simplify: \\(\\frac{${a * x}x}{x}\\) when \\(x \\neq 0\\).`, options, correctIndex,
      explanation: `Cancel the common factor \\(x\\): \\(\\frac{${a * x}x}{x} = ${a * x}\\).`,
      difficulty: "easy", topic: "Rational Expressions", subtopic: "rational-expressions",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 4);
    const b = randInt(seed + 1, 2, 5);
    const correct = `\\frac{${a}}{${b}}`;
    const wrongs = [`\\frac{${a + b}}{${a * b}}`, `\\frac{${a - 1}}{${b - 1}}`, `\\frac{${b}}{${a}}`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Simplify: \\(\\frac{${a * 2}x}{${b * 2}x}\\) when \\(x \\neq 0\\).`, options, correctIndex,
      explanation: `Cancel the common factor \\(2x\\): \\(\\frac{${a * 2}x}{${b * 2}x} = \\frac{${a}}{${b}}\\).`,
      difficulty: "medium", topic: "Rational Expressions", subtopic: "rational-expressions",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 1, 4);
    const b = randInt(seed + 1, 1, 4);
    const correct = `\\frac{x - ${a}}{x + ${b}}`;
    const wrongs = [`\\frac{x + ${a}}{x - ${b}}`, `\\frac{x^2 - ${a * a}}{x + ${b}}`, `\\frac{x + ${a}}{x + ${b}}`];
    const { options, correctIndex } = buildOptions(correct, rng);
    return {
      id: idx, question: `Simplify: \\(\\frac{x^2 - ${a * a}}{(x + ${a})(x + ${b})}\\) when \\(x \\neq -${a}\\).`, options, correctIndex,
      explanation: `Factor numerator: \\(x^2 - ${a * a} = (x - ${a})(x + ${a})\\). Cancel \\((x + ${a})\\): \\(\\frac{(x - ${a})}{(x + ${b})}\\).`,
      difficulty: "hard", topic: "Rational Expressions", subtopic: "rational-expressions",
    };
  },
};

// ─── exponential-functions ─────────────────────────────
const exponentialFunctions: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const base = randInt(seed, 2, 4);
    const exp = randInt(seed + 1, 1, 4);
    const correct = String(Math.pow(base, exp));
    const wrongs = [String(base * exp), String(Math.pow(base, exp + 1)), String(base + exp)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Evaluate: \\(${base}^${exp}\\)`, options, correctIndex,
      explanation: `\\(${base}^${exp} = ${Array(exp).fill(String(base)).join(" \\times ")} = ${correct}\\).`,
      difficulty: "easy", topic: "Exponential Functions", subtopic: "exponential-functions",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 5);
    const t = randInt(seed + 1, 2, 4);
    const initial = randInt(seed + 2, 100, 500);
    const result = Math.round(initial * Math.pow(2, t));
    const correct = String(result);
    const wrongs = [String(initial * t * 2), String(initial + t * 50), String(Math.round(initial * Math.pow(1.5, t)))];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `A population of ${initial} doubles every hour. What is the population after ${t} hours?`, options, correctIndex,
      explanation: `Formula: \\(P = ${initial} \\times 2^${t} = ${initial} \\times ${Math.pow(2, t)} = ${correct}\\).`,
      difficulty: "medium", topic: "Exponential Functions", subtopic: "exponential-functions",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 5);
    const b = randInt(seed + 1, 2, 4);
    const x = randInt(seed + 2, 1, 3);
    const correct = String(Math.pow(a, b * x));
    const wrongs = [String(Math.pow(a, b + x)), String(Math.pow(a, b) * x), String(a * b * x)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Simplify: \\((${a}^${b})^${x}\\)`, options, correctIndex,
      explanation: `Power of a power: multiply exponents: \\((${a}^{${b}})^{${x}} = ${a}^{${b} \\times ${x}} = ${a}^{${b * x}} = ${correct}\\).`,
      difficulty: "hard", topic: "Exponential Functions", subtopic: "exponential-functions",
    };
  },
};

// ─── logarithms ────────────────────────────────────────
const logarithms: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const base = randInt(seed, 2, 5);
    const exp = randInt(seed + 1, 2, 4);
    const correct = String(exp);
    const wrongs = [String(Math.pow(base, exp)), String(base), String(exp + 1)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Evaluate: \\(\\log_${base}(${Math.pow(base, exp)})\\)`, options, correctIndex,
      explanation: `Since \\(${base}^${exp} = ${Math.pow(base, exp)}\\), we have \\(\\log_${base}(${Math.pow(base, exp)}) = ${exp}\\).`,
      difficulty: "easy", topic: "Logarithms", subtopic: "logarithms",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 4);
    const b = randInt(seed + 1, 2, 4);
    const correct = `\\log(${a}) + \\log(${b})`;
    const wrongs = [`\\log(${a * b})`, `\\log(${a}) \\cdot \\log(${b})`, `\\log(${a + b})`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Expand: \\(\\log(${a * b})\\)`, options, correctIndex,
      explanation: `Product rule: \\(\\log(${a * b}) = \\log(${a}) + \\log(${b})\\). So the answer is \\(${correct}\\).`,
      difficulty: "medium", topic: "Logarithms", subtopic: "logarithms",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const base = randInt(seed, 2, 4);
    const a = randInt(seed + 1, 2, 5);
    const b = randInt(seed + 2, 3, 7);
    const correct = `\\frac{\\log(${b})}{\\log(${a})}`;
    const wrongs = [`\\frac{\\log(${a})}{\\log(${b})}`, `\\log(${b - a})`, `\\log(${b}) - \\log(${a})`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Use the change of base formula: \\(\\log_${a}(${b}) = ?\\).`, options, correctIndex,
      explanation: `Change of base: \\(\\log_${a}(${b}) = \\frac{\\log(${b})}{\\log(${a})}\\).`,
      difficulty: "hard", topic: "Logarithms", subtopic: "logarithms",
    };
  },
};

// ─── sequences ─────────────────────────────────────────
const sequences: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const a1 = randInt(seed, 3, 7);
    const d = randInt(seed + 1, 2, 5);
    const n = randInt(seed + 2, 5, 8);
    const correct = String(a1 + (n - 1) * d);
    const wrongs = [String(a1 + n * d), String(a1 * n), String(a1 + d)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the ${n}th term of the arithmetic sequence: ${a1}, ${a1 + d}, ${a1 + 2 * d}, ${a1 + 3 * d}, …`, options, correctIndex,
      explanation: `Formula: \\(a_n = a_1 + (n-1)d = ${a1} + (${n} - 1) \\times ${d} = ${a1} + ${(n - 1) * d} = ${correct}\\).`,
      difficulty: "easy", topic: "Sequences", subtopic: "sequences",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a1 = randInt(seed, 2, 4);
    const r = randInt(seed + 1, 2, 3);
    const n = randInt(seed + 2, 4, 6);
    const correct = String(a1 * Math.pow(r, n - 1));
    const wrongs = [String(a1 * n * r), String(a1 * Math.pow(r, n)), String(a1 * r)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the ${n}th term of the geometric sequence: ${a1}, ${a1 * r}, ${a1 * r * r}, ${a1 * r * r * r}, …`, options, correctIndex,
      explanation: `Formula: \\(a_n = a_1 \\cdot r^{n-1} = ${a1} \\times ${r}^{${n - 1}} = ${a1} \\times ${Math.pow(r, n - 1)} = ${correct}\\).`,
      difficulty: "medium", topic: "Sequences", subtopic: "sequences",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const a1 = randInt(seed, 1, 5);
    const d = randInt(seed + 1, 1, 4);
    const n = randInt(seed + 2, 5, 10);
    const sum = (n / 2) * (2 * a1 + (n - 1) * d);
    const correct = sum % 1 === 0 ? String(sum) : sum.toFixed(1);
    const wrongs = [String(Math.round(sum + d)), String(a1 * n), String(Math.round(sum / 2))];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the sum of the first ${n} terms: ${a1} + ${a1 + d} + ${a1 + 2 * d} + …`, options, correctIndex,
      explanation: `Sum formula: \\(S_n = \\frac{n}{2}[2a_1 + (n-1)d] = \\frac{${n}}{2}[2 \\times ${a1} + ${n - 1} \\times ${d}] = \\frac{${n}}{2}[${2 * a1 + (n - 1) * d}] = ${correct}\\).`,
      difficulty: "hard", topic: "Sequences", subtopic: "sequences",
    };
  },
};

// ─── conic-sections ────────────────────────────────────
const conicSections: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const h = randInt(seed, -3, 3);
    const k = randInt(seed + 1, -3, 3);
    const correct = `(${h}, ${k})`;
    const wrongs = [`(${-h}, ${-k})`, `(0, 0)`, `(${k}, ${h})`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `What is the center of the circle: \\((x ${h > 0 ? "-" : "+"} ${Math.abs(h)})^2 + (y ${k > 0 ? "-" : "+"} ${Math.abs(k)})^2 = 9\\)?`, options, correctIndex,
      explanation: `Standard form \\((x - h)^2 + (y - k)^2 = r^2\\) has center \\((h, k)\\). Here \\(h = ${h}, k = ${k}\\), so center is \\(${correct}\\).`,
      difficulty: "easy", topic: "Conic Sections", subtopic: "conic-sections",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 5);
    const b = randInt(seed + 1, 2, 4);
    const correct = `\\frac{x^2}{${a * a}} + \\frac{y^2}{${b * b}} = 1`;
    const wrongs = [`\\frac{x^2}{${a}} + \\frac{y^2}{${b}} = 1`, `\\frac{x^2}{${b}} + \\frac{y^2}{${a}} = 1`, `x^2 + y^2 = ${a * b}`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Write the equation of an ellipse centered at the origin with x-radius \\(${a}\\) and y-radius \\(${b}\\).`, options, correctIndex,
      explanation: `Standard form: \\(\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1\\) where a and b are the radii. So \\(${correct}\\).`,
      difficulty: "medium", topic: "Conic Sections", subtopic: "conic-sections",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const p = randInt(seed, 1, 3);
    const correct = `y^2 = ${4 * p}x`;
    const wrongs = [`y = ${4 * p}x^2`, `x^2 = ${4 * p}y`, `y^2 = ${p}x`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the equation of a parabola with vertex at origin, focus at \\((${p}, 0)\\), and opens to the right.`, options, correctIndex,
      explanation: `For a right-opening parabola with vertex at origin: \\(y^2 = 4px\\). With \\(p = ${p}\\): \\(${correct}\\).`,
      difficulty: "hard", topic: "Conic Sections", subtopic: "conic-sections",
    };
  },
};

export const generators: Record<string, Record<Depth, GenFn>> = {
  "functions": functions,
  "domain-range": domainRange,
  "matrices": matrices,
  "rational-expressions": rationalExpressions,
  "exponential-functions": exponentialFunctions,
  "logarithms": logarithms,
  "sequences": sequences,
  "conic-sections": conicSections,
};
