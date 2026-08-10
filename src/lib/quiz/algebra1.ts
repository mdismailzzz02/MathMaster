import type { Question, Depth } from "./types";
import { mulberry32, randInt, buildOptions } from "./core";

type GenFn = (seed: number, idx: number) => Question;

// ─── linear-equations ──────────────────────────────────
const linearEquations: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 9);
    const x = randInt(seed + 1, 1, 10);
    const b = randInt(seed + 2, 1, 15);
    const rhs = a * x + b;
    const wrongs = [String(x + 1), String(x - 1), String(b - a)];
    const { options, correctIndex } = buildOptions(String(x), wrongs, rng);
    return {
      id: idx, question: `Solve for \\(x\\): \\(${a}x + ${b} = ${rhs}\\)`, options, correctIndex,
      explanation: `Subtract \\(${b}\\) from both sides: \\(${a}x = ${a * x}\\). Divide by \\(${a}\\): \\(x = ${x}\\).`,
      difficulty: "easy", topic: "Linear Equations", subtopic: "linear-equations",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 9);
    const x = randInt(seed + 1, 2, 10);
    const b = randInt(seed + 2, 2, 12);
    const c = randInt(seed + 3, 1, a - 1);
    const rhs = a * x + b - c * x;
    const wrongs = [String(x + 2), String(x - 1), String(Math.round(rhs / a))];
    const correct = String(x);
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Solve: \\(${a}x + ${b} = ${c}x + ${rhs + c * x}\\)`, options, correctIndex,
      explanation: `Subtract \\(${c}x\\) from both sides: \\(${a - c}x + ${b} = ${rhs + c * x - c * x}\\). Subtract \\(${b}\\): \\(${a - c}x = ${a * x - c * x}\\). Divide by \\(${a - c}\\): \\(x = ${x}\\).`,
      difficulty: "medium", topic: "Linear Equations", subtopic: "linear-equations",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 6);
    const b = randInt(seed + 1, 2, 8);
    const x = randInt(seed + 2, 1, 5);
    const wrongs = [String(x + 1), String(x + 2), String(x - 1)];
    const correct = String(x);
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Solve: \\(\\frac{x}{${a}} + ${b} = ${x / a + b}\\)`, options, correctIndex,
      explanation: `Subtract \\(${b}\\): \\(\\frac{x}{${a}} = ${(x / a).toFixed(1)}\\). Multiply by \\(${a}\\): \\(x = ${x}\\).`,
      difficulty: "hard", topic: "Linear Equations", subtopic: "linear-equations",
    };
  },
};

// ─── slope-intercept ──────────────────────────────────
const slopeIntercept: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const m = randInt(seed, 2, 5);
    const b = randInt(seed + 1, -3, 5);
    const sign = b >= 0 ? "+" : "-";
    const wrongs = [`y = ${m + 1}x ${sign} ${Math.abs(b)}`, `y = ${m - 1}x ${sign} ${Math.abs(b)}`, `y = ${m}x ${b >= 0 ? "-" : "+"} ${Math.abs(b)}`];
    const correct = `y = ${m}x ${sign} ${Math.abs(b)}`;
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `A line has slope \\(${m}\\) and y-intercept \\(${b}\\). What is its equation in slope-intercept form?`, options, correctIndex,
      explanation: `Slope-intercept form is \\(y = mx + b\\). With \\(m = ${m}\\) and \\(b = ${b}\\), we get \\(${correct}\\).`,
      difficulty: "easy", topic: "Slope-Intercept Form", subtopic: "slope-intercept",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const m = randInt(seed, 1, 6);
    const b = randInt(seed + 1, -5, 8);
    const x1 = randInt(seed + 2, 1, 4);
    const y1 = m * x1 + b;
    const wrongs = [`y = ${m + 1}x + ${b + 1}`, `y = ${m}x + ${b + 2}`, `y = ${m - 1}x - ${b}`];
    const correct = `y = ${m}x + ${b}`;
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `A line passes through \\((${x1}, ${y1})\\) with slope \\(${m}\\). Find its equation.`, options, correctIndex,
      explanation: `Use point-slope: \\(y - ${y1} = ${m}(x - ${x1})\\). Simplify: \\(y = ${m}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)}\\).`,
      difficulty: "medium", topic: "Slope-Intercept Form", subtopic: "slope-intercept",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const x1 = randInt(seed, 1, 4);
    const y1 = randInt(seed + 1, 1, 6);
    const x2 = randInt(seed + 2, 5, 9);
    const y2 = randInt(seed + 3, 1, 6);
    const m = (y2 - y1) / (x2 - x1);
    const b = y1 - m * x1;
    const mStr = m % 1 === 0 ? String(m) : `${y2 - y1}/${x2 - x1}`;
    const correct = Number.isInteger(b) ? `y = ${mStr}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)}` : `y = ${mStr}x ${b >= 0 ? "+" : "-"} ${Math.abs(b).toFixed(1)}`;
    const wrongs = [`y = ${mStr}x`, `y = -${mStr}x + ${Math.abs(Math.round(b))}`, `y = ${Math.abs(Math.round(m))}x + ${Math.abs(Math.round(b))}`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the equation of the line through \\((${x1}, ${y1})\\) and \\((${x2}, ${y2})\\).`, options, correctIndex,
      explanation: `Slope \\(m = \\frac{${y2} - ${y1}}{${x2} - ${x1}} = ${mStr}\\). Then \\(b = y_1 - m \\cdot x_1 = ${y1} - ${mStr} \\cdot ${x1} = ${typeof b === "number" ? b.toFixed(1) : b}\\). So \\(${correct}\\).`,
      difficulty: "hard", topic: "Slope-Intercept Form", subtopic: "slope-intercept",
    };
  },
};

// ─── inequalities ──────────────────────────────────────
const inequalities: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 6);
    const x = randInt(seed + 1, 2, 8);
    const b = randInt(seed + 2, 1, 10);
    const direction = randInt(seed + 3, 0, 1) === 0 ? ">" : "<";
    const rhs = direction === ">" ? a * x + b - randInt(seed + 4, 1, 5) : a * x + b + randInt(seed + 4, 1, 5);
    const answer = direction === ">" ? `x > ${x}` : `x < ${x}`;
    const wrongs = [`x ${direction} ${x + 1}`, `x ${direction === ">" ? "<" : ">"} ${x}`, `x = ${x}`];
    const { options, correctIndex } = buildOptions(answer, wrongs, rng);
    return {
      id: idx, question: `Solve: \\(${a}x ${direction === ">" ? "+" : "+"} ${b} ${direction} ${rhs}\\)`, options, correctIndex,
      explanation: `Subtract \\(${b}\\): \\(${a}x ${direction} ${rhs - b}\\). Divide by \\(${a}\\): \\(x ${direction} ${x}\\).`,
      difficulty: "easy", topic: "Inequalities", subtopic: "inequalities",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 5);
    const x = randInt(seed + 1, 1, 6);
    const b = randInt(seed + 2, 2, 7);
    const wrongs = [`x > ${x + 2}`, `x < ${x - 1}`, `x > ${x - 1} and x < ${x + 1}`];
    const correct = `x \\geq ${x}`;
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Solve the compound inequality: \\(${a}x + ${b} \\geq ${a * x + b}\\)`, options, correctIndex,
      explanation: `Subtract \\(${b}\\): \\(${a}x \\geq ${a * x}\\). Divide by \\(${a}\\): \\(x \\geq ${x}\\).`,
      difficulty: "medium", topic: "Inequalities", subtopic: "inequalities",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const root = randInt(seed, 2, 5);
    const wrongs = [`x < ${root - 1}`, `x > ${root}`, `x \\leq ${root - 1}`];
    const correct = `x \\geq ${root}`;
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Solve: \\(x^2 \\geq ${root * root}\\)`, options, correctIndex,
      explanation: `Taking square roots: \\(|x| \\geq ${root}\\). This means \\(x \\geq ${root}\\) or \\(x \\leq ${-root}\\). The answer shown is \\(x \\geq ${root}\\).`,
      difficulty: "hard", topic: "Inequalities", subtopic: "inequalities",
    };
  },
};

// ─── systems-of-equations ──────────────────────────────
const systemsOfEquations: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const x = randInt(seed, 2, 6);
    const y = randInt(seed + 1, 1, 5);
    const a1 = randInt(seed + 2, 1, 3);
    const b1 = randInt(seed + 3, 1, 3);
    const c1 = a1 * x + b1 * y;
    const a2 = randInt(seed + 4, 1, 3);
    const b2 = randInt(seed + 5, 1, 3);
    const c2 = a2 * x + b2 * y;
    const correct = `(${x}, ${y})`;
    const wrongs = [`(${x + 1}, ${y})`, `(${x}, ${y + 1})`, `(${x - 1}, ${y - 1})`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Solve the system:\n\\[\n\\begin{aligned}\n${a1}x + ${b1}y &= ${c1} \\\\\n${a2}x + ${b2}y &= ${c2}\n\\end{aligned}\n\\]`, options, correctIndex,
      explanation: `You can use substitution or elimination. Subtract \\(${a2}\\) times first from \\(${a1}\\) times second: yields \\(x = ${x}, y = ${y}\\).`,
      difficulty: "easy", topic: "Systems of Equations", subtopic: "systems-of-equations",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const x = randInt(seed, 2, 5);
    const y = randInt(seed + 1, 2, 5);
    const a = randInt(seed + 2, 2, 5);
    const b = randInt(seed + 3, 2, 4);
    const c = a * x + b * y;
    const d = randInt(seed + 4, 2, 5);
    const e = randInt(seed + 5, 2, 4);
    const f = d * x + e * y;
    const correct = `x = ${x}, y = ${y}`;
    const wrongs = [`x = ${x + 1}, y = ${y - 1}`, `x = ${x - 1}, y = ${y}`, `x = ${y}, y = ${x}`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Solve:\n\\[\n\\begin{aligned}\n${a}x + ${b}y &= ${c} \\\\\n${d}x - ${e}y &= ${f}\n\\end{aligned}\n\\]`, options, correctIndex,
      explanation: `Add the equations to eliminate \\(y\\): \\(${a + d}x = ${c + f}\\), so \\(x = ${x}\\). Substitute back: \\(${a} \\cdot ${x} + ${b}y = ${c}\\), \\(y = ${y}\\).`,
      difficulty: "medium", topic: "Systems of Equations", subtopic: "systems-of-equations",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const x = randInt(seed, 2, 4);
    const y = randInt(seed + 1, 2, 4);
    const z = randInt(seed + 2, 1, 3);
    const correct = `x = ${x}, y = ${y}, z = ${z}`;
    const wrongs = [`x = ${x}, y = ${y + 1}, z = ${z}`, `x = ${x + 1}, y = ${y}, z = ${z - 1}`, `x = ${x}, y = ${y}, z = ${z + 1}`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Solve:\n\\[\n\\begin{aligned}\nx + y + z &= ${x + y + z} \\\\\n2x - y + z &= ${2 * x - y + z} \\\\\nx + y - z &= ${x + y - z}\n\\end{aligned}\n\\]`, options, correctIndex,
      explanation: `Subtract third from first: \\(2z = ${2 * z}\\) → \\(z = ${z}\\). Then \\(x + y = ${x + y}\\). From second: \\(2x - y = ${2 * x - y - z}\\). Solving: \\(x = ${x}, y = ${y}\\).`,
      difficulty: "hard", topic: "Systems of Equations", subtopic: "systems-of-equations",
    };
  },
};

// ─── exponents ─────────────────────────────────────────
const exponents: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const base = randInt(seed, 2, 4);
    const exp = randInt(seed + 1, 2, 5);
    const correct = String(Math.pow(base, exp));
    const wrongs = [String(Math.pow(base, exp - 1)), String(Math.pow(base, exp + 1)), String(base * exp)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Simplify: \\(${base}^${exp}\\)`, options, correctIndex,
      explanation: `\\(${base}^${exp} = ${base} \\times ${Array(exp - 1).fill(base).join(" \\times ")} = ${correct}\\).`,
      difficulty: "easy", topic: "Exponents", subtopic: "exponents",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 3, 6);
    const m = randInt(seed + 1, 2, 4);
    const n = randInt(seed + 2, 1, 3);
    const correct = `${a}^${m + n}`;
    const wrongs = [`${a}^${m * n}`, `${a}^${m - n}`, `${a * m}^${n}`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Simplify: \\(${a}^${m} \\cdot ${a}^${n}\\)`, options, correctIndex,
      explanation: `When multiplying same bases, add exponents: \\(${a}^{${m}} \\cdot ${a}^{${n}} = ${a}^{${m}+${n}} = ${correct}\\).`,
      difficulty: "medium", topic: "Exponents", subtopic: "exponents",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 4);
    const m = randInt(seed + 1, 2, 4);
    const n = randInt(seed + 2, 1, 3);
    const correct = `${a}^${m * n}`;
    const wrongs = [`${a}^${m + n}`, `${a}^${Math.pow(m, n)}`, `${a * m}^${n}`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Simplify: \\((${a}^${m})^${n}\\)`, options, correctIndex,
      explanation: `Power of a power: multiply exponents: \\((${a}^{${m}})^{${n}} = ${a}^{${m} \\times ${n}} = ${correct}\\).`,
      difficulty: "hard", topic: "Exponents", subtopic: "exponents",
    };
  },
};

// ─── polynomials ───────────────────────────────────────
const polynomials: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 4);
    const b = randInt(seed + 1, 2, 5);
    const c = randInt(seed + 2, 1, 4);
    const correct = `${a + c}x^2 + ${b}x`;
    const wrongs = [`${a + c}x^3 + ${b}x`, `${a + c}x^2 + ${b + 1}x`, `${a}x^2 + ${b}x + ${c}`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Simplify: \\((${a}x^2 + ${b}x) + (${c}x^2)\\)`, options, correctIndex,
      explanation: `Combine like terms: \\(${a}x^2 + ${c}x^2 = ${a + c}x^2\\), and \\(${b}x\\) stays. Result: \\(${correct}\\).`,
      difficulty: "easy", topic: "Polynomials", subtopic: "polynomials",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 4);
    const b = randInt(seed + 1, 2, 5);
    const correct = `${a * 2}x + ${b}`;
    const wrongs = [`${a * 2}x`, `${a}x + ${b}`, `${a * 2}x + ${b + 1}`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the derivative (slope function) of \\(${a}x^2 + ${b}x + 3\\) using the power rule preview.`, options, correctIndex,
      explanation: `Using the preview of the power rule: derivative of \\(x^n\\) is \\(n \\cdot x^{n-1}\\). So \\(${a}x^2\\) → \\(${a * 2}x\\), \\(${b}x\\) → \\(${b}\\), constant → 0. Result: \\(${correct}\\).`,
      difficulty: "medium", topic: "Polynomials", subtopic: "polynomials",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 3);
    const b = randInt(seed + 1, 3, 5);
    const c = randInt(seed + 2, 3, 5);
    const left = a * c;
    const outer = a * (-2);
    const inner = b * c;
    const right = b * (-2);
    const mid = outer + inner;
    const correct = `${left}x^2 ${mid >= 0 ? "+" : "-"} ${Math.abs(mid)}x - ${Math.abs(right)}`;
    const wrongs = [`${left}x^2 + ${Math.abs(mid + 2)}x - ${Math.abs(right)}`, `${left}x^2 - ${Math.abs(mid)}x + ${Math.abs(right)}`, `${left + 1}x^2 ${mid >= 0 ? "+" : "-"} ${Math.abs(mid)}x - ${Math.abs(right)}`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Multiply: \\((${a}x + ${b})(${c}x - 2)\\)`, options, correctIndex,
      explanation: `FOIL: First \\(${a}x \\cdot ${c}x = ${left}x^2\\), Outer \\(${a}x \\cdot (-2) = ${outer}x\\), Inner \\(${b} \\cdot ${c}x = ${inner}x\\), Last \\(${b} \\cdot (-2) = ${right}\\). Combine: \\(${correct}\\).`,
      difficulty: "hard", topic: "Polynomials", subtopic: "polynomials",
    };
  },
};

// ─── factoring ─────────────────────────────────────────
const factoring: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const gcf = randInt(seed, 2, 5);
    const a = randInt(seed + 1, 2, 3);
    const correct = `${gcf}(${a}x + 2)`;
    const wrongs = [`${gcf}(${a}x - 2)`, `${gcf + 1}(${a}x + 2)`, `2(${gcf * a}x + ${gcf})`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Factor out the GCF: \\(${gcf * a}x + ${gcf * 2}\\)`, options, correctIndex,
      explanation: `GCF is \\(${gcf}\\). Divide each term: \\(${gcf * a}x \\div ${gcf} = ${a}x\\), \\(${gcf * 2} \\div ${gcf} = 2\\). Result: \\(${correct}\\).`,
      difficulty: "easy", topic: "Factoring", subtopic: "factoring",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const r1 = randInt(seed, 1, 5);
    const r2 = randInt(seed + 1, 1, 5);
    const sum = r1 + r2;
    const prod = r1 * r2;
    const correct = `(x + ${r1})(x + ${r2})`;
    const wrongs = [`(x + ${r1})(x - ${r2})`, `(x - ${r1})(x - ${r2})`, `(x + ${sum})(x + 1)`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Factor: \\(x^2 + ${sum}x + ${prod}\\)`, options, correctIndex,
      explanation: `Find two numbers that multiply to \\(${prod}\\) and add to \\(${sum}\\): \\(${r1}\\) and \\(${r2}\\). So \\(${correct}\\).`,
      difficulty: "medium", topic: "Factoring", subtopic: "factoring",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 3);
    const r1 = randInt(seed + 1, 1, 4);
    const r2 = randInt(seed + 2, 1, 4);
    const mid = a * r1 + r2;
    const last = r1 * r2;
    const correct = `(${a}x + ${r2})(x + ${r1})`;
    const wrongs = [`(${a}x - ${r2})(x + ${r1})`, `(${a}x + ${r1})(x + ${r2})`, `(x + ${r2})(${a}x + ${r1})`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Factor: \\(${a}x^2 + ${mid}x + ${last}\\)`, options, correctIndex,
      explanation: `Find factors of \\(${a} \\times ${last} = ${a * last}\\) that add to \\(${mid}\\). Those are \\(${a * r1}\\) and \\(${r2}\\). Split the middle term and factor by grouping: \\(${correct}\\).`,
      difficulty: "hard", topic: "Factoring", subtopic: "factoring",
    };
  },
};

// ─── quadratic-equations ───────────────────────────────
const quadraticEquations: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const r = randInt(seed, 2, 6);
    const correct = `x = ${r}`;
    const wrongs = [`x = ${r + 1}`, `x = ${-r}`, `x = ${r * 2}`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Solve: \\(x^2 = ${r * r}\\)`, options, correctIndex,
      explanation: `Take the square root of both sides: \\(\\sqrt{x^2} = \\sqrt{${r * r}}\\). So \\(x = ${r}\\) or \\(x = ${-r}\\). The positive root is \\(${r}\\).`,
      difficulty: "easy", topic: "Quadratic Equations", subtopic: "quadratic-equations",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const r1 = randInt(seed, 1, 4);
    const r2 = randInt(seed + 1, 2, 6);
    const sum = r1 + r2;
    const prod = r1 * r2;
    const correct = `x = ${r1} or x = ${r2}`;
    const wrongs = [`x = ${-r1} or x = ${-r2}`, `x = ${r1} or x = ${-r2}`, `x = ${sum} or x = ${prod}`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Solve: \\(x^2 - ${sum}x + ${prod} = 0\\)`, options, correctIndex,
      explanation: `Factor: \\((x - ${r1})(x - ${r2}) = 0\\). Set each factor to 0: \\(x - ${r1} = 0\\) → \\(x = ${r1}\\), \\(x - ${r2} = 0\\) → \\(x = ${r2}\\).`,
      difficulty: "medium", topic: "Quadratic Equations", subtopic: "quadratic-equations",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 1, 3);
    const b = randInt(seed + 1, 2, 6);
    const c = randInt(seed + 2, 1, 5);
    const disc = b * b - 4 * a * c;
    const r1 = disc >= 0 ? ((-b + Math.sqrt(disc)) / (2 * a)).toFixed(1) : "complex";
    const r2 = disc >= 0 ? ((-b - Math.sqrt(disc)) / (2 * a)).toFixed(1) : "complex";
    const correct = disc >= 0 ? `x \\approx ${r1} or x \\approx ${r2}` : `No real solutions`;
    const wrongs = disc >= 0
      ? [`x = ${Math.round(b / a)} or x = ${Math.round(c / a)}`, `x \\approx ${(Number(r1) + 1).toFixed(1)}`, `x \\approx ${(Number(r2) - 1).toFixed(1)}`]
      : [`x = ${b}`, `x = ${c}`, `x = ${-b}`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Use the quadratic formula to solve: \\(${a}x^2 + ${b}x + ${c} = 0\\)`, options, correctIndex,
      explanation: `Quadratic formula: \\(x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\). Here \\(a = ${a}, b = ${b}, c = ${c}\\). Discriminant \\(= ${disc}\\). ${disc >= 0 ? `\\(x = \\frac{${-b} \\pm \\sqrt{${disc}}}{${2 * a}}\\) ≈ ${r1} or ${r2}` : "Negative, so no real solutions."}`,
      difficulty: "hard", topic: "Quadratic Equations", subtopic: "quadratic-equations",
    };
  },
};

// ─── Export ────────────────────────────────────────────
export const generators: Record<string, Record<Depth, GenFn>> = {
  "linear-equations": linearEquations,
  "slope-intercept": slopeIntercept,
  "inequalities": inequalities,
  "systems-of-equations": systemsOfEquations,
  "exponents": exponents,
  "polynomials": polynomials,
  "factoring": factoring,
  "quadratic-equations": quadraticEquations,
};
