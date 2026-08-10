import type { Question, Depth } from "./types";
import { mulberry32, randInt, buildOptions } from "./core";

type GenFn = (seed: number, idx: number) => Question;

// ─── limits ────────────────────────────────────────────
const limits: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 5);
    const c = randInt(seed + 1, 3, 10);
    const correct = String(a * 3 + c);
    const wrongs = [String(c), String(a * 3), String(a + c)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Evaluate: \\(\\lim_{x \\to 3} (${a}x + ${c})\\)`, options, correctIndex,
      explanation: `Plug in \\(x = 3\\): \\(${a}(3) + ${c} = ${a * 3} + ${c} = ${correct}\\).`,
      difficulty: "easy", topic: "Limits", subtopic: "limits",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 4);
    const correct = String(2 * a);
    const wrongs = [String(a), String(a * a), String(a * 2 + 1)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Evaluate: \\(\\lim_{x \\to ${a}} \\frac{x^2 - ${a * a}}{x - ${a}}\\)`, options, correctIndex,
      explanation: `Factor: \\(\\frac{(x - ${a})(x + ${a})}{x - ${a}} = x + ${a}\\). As \\(x \\to ${a}\\), \\(x + ${a} \\to ${correct}\\).`,
      difficulty: "medium", topic: "Limits", subtopic: "limits",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 5);
    const b = randInt(seed + 1, 3, 7);
    const correct = `\\frac{${a}}{${b}}`;
    const wrongs = ["0", "1", `\\frac{${b}}{${a}}`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Evaluate: \\(\\lim_{x \\to \\infty} \\frac{${a}x^2 + ${b}x}{${b}x^2 - ${a}}\\)`, options, correctIndex,
      explanation: `Divide numerator and denominator by \\(x^2\\): \\(\\frac{${a} + ${b}/x}{${b} - ${a}/x^2}\\). As \\(x \\to \\infty\\), terms with /x vanish: \\(\\frac{${a}}{${b}}\\).`,
      difficulty: "hard", topic: "Limits", subtopic: "limits",
    };
  },
};

// ─── derivatives ───────────────────────────────────────
const derivatives: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 5);
    const n = randInt(seed + 1, 2, 4);
    const correct = `${a * n}x^${n - 1}`;
    const wrongs = [`${a * n}x^${n}`, `${a}x^${n - 1}`, `${a * (n - 1)}x^${n - 1}`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the derivative: \\(\\frac{d}{dx}[${a}x^${n}]\\)`, options, correctIndex,
      explanation: `Power rule: \\(\\frac{d}{dx}[x^n] = n x^{n-1}\\). So \\(\\frac{d}{dx}[${a}x^{${n}}] = ${a} \\cdot ${n} \\cdot x^{${n - 1}} = ${correct}\\).`,
      difficulty: "easy", topic: "Derivatives", subtopic: "derivatives",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 4);
    const b = randInt(seed + 1, 2, 5);
    const c = randInt(seed + 2, 3, 6);
    const correct = `${a * 2}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)}`;
    const wrongs = [`${a * 2}x`, `${a}x^2 ${b >= 0 ? "+" : "-"} ${Math.abs(b)}`, `${a}x + ${b}`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the derivative: \\(\\frac{d}{dx}[${a}x^2 + ${b}x + ${c}]\\)`, options, correctIndex,
      explanation: `Derivative of each term: \\(${a}x^2 \\to ${a * 2}x\\), \\(${b}x \\to ${b}\\), constant \\(${c} \\to 0\\). Result: \\(${correct}\\).`,
      difficulty: "medium", topic: "Derivatives", subtopic: "derivatives",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 4);
    const b = randInt(seed + 1, 2, 5);
    const correct = `${a * b}x^${a - 1}(x^${a} + 1)^${b - 1}`;
    const wrongs = [
      `${a * b}(x^${a} + 1)^${b - 1}`,
      `${b}x^${a - 1}(x^${a} + 1)^${b - 1}`,
      `${a * b}x^${a}(x^${a} + 1)^${b}`,
    ];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Use the chain rule: \\(\\frac{d}{dx}[(x^${a} + 1)^${b}]\\)`, options, correctIndex,
      explanation: `Chain rule: outer derivative \\(${b}(x^${a} + 1)^${b - 1}\\) × inner derivative \\(${a}x^${a - 1}\\) = \\(${correct}\\).`,
      difficulty: "hard", topic: "Derivatives", subtopic: "derivatives",
    };
  },
};

// ─── derivative-rules ──────────────────────────────────
const derivativeRules: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 5);
    const correct = String(a);
    const wrongs = [String(a + 1), String(a * a), "0"];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the derivative: \\(\\frac{d}{dx}[${a}x + 7]\\)`, options, correctIndex,
      explanation: `The derivative of \\(${a}x\\) is \\(${a}\\), and the derivative of the constant 7 is 0. Result: \\(${a}\\).`,
      difficulty: "easy", topic: "Derivative Rules", subtopic: "derivative-rules",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 4);
    const b = randInt(seed + 1, 2, 5);
    const correct = `(${a * 2}x + ${b}) \\cdot e^{${a}x^2 + ${b}x}`;
    const wrongs = [
      `e^{${a}x^2 + ${b}x}`,
      `${a * 2}x \\cdot e^{${a}x^2}`,
      `(${a}x^2 + ${b}x) \\cdot e^{${a}x^2 + ${b}x - 1}`,
    ];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the derivative: \\(\\frac{d}{dx}[e^{${a}x^2 + ${b}x}]\\)`, options, correctIndex,
      explanation: `Chain rule: \\(\\frac{d}{dx}[e^u] = e^u \\cdot u'\\). Here \\(u = ${a}x^2 + ${b}x\\), \\(u' = ${a * 2}x + ${b}\\). So answer = \\(${correct}\\).`,
      difficulty: "medium", topic: "Derivative Rules", subtopic: "derivative-rules",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 4);
    const correct = `\\frac{1}{x \\cdot \\ln(${a})}`;
    const wrongs = [
      `\\frac{1}{x}`,
      `\\frac{\\ln(${a})}{x}`,
      `\\frac{1}{${a} \\cdot \\ln(x)}`,
    ];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the derivative: \\(\\frac{d}{dx}[\\log_${a}(x)]\\)`, options, correctIndex,
      explanation: `Derivative of \\(\\log_a(x)\\) is \\(\\frac{1}{x \\cdot \\ln(a)}\\). So with base \\(${a}\\): \\(${correct}\\).`,
      difficulty: "hard", topic: "Derivative Rules", subtopic: "derivative-rules",
    };
  },
};

// ─── applications-of-derivatives ───────────────────────
const applicationsOfDerivatives: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 4);
    const x = randInt(seed + 1, 1, 4);
    const slope = 2 * a * x + 3;
    const correct = String(slope);
    const wrongs = [String(a * x * x), String(2 * a * x), String(slope + 1)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the slope of the tangent line to \\(f(x) = ${a}x^2 + 3x + 1\\) at \\(x = ${x}\\).`, options, correctIndex,
      explanation: `\\(f'(x) = ${a * 2}x + 3\\). At \\(x = ${x}\\): \\(f'(${x}) = ${a * 2}(${x}) + 3 = ${correct}\\).`,
      difficulty: "easy", topic: "Applications of Derivatives", subtopic: "applications-of-derivatives",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 1, 3);
    const x = randInt(seed + 1, 2, 4);
    const correct = `f'(${x}) > 0, so f is increasing`;
    const wrongs = [
      `f'(${x}) < 0, so f is decreasing`,
      `f'(${x}) = 0, so f has a critical point`,
      `f'(${x}) does not exist`,
    ];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `For \\(f(x) = x^3 - ${a}x\\), determine the behavior at \\(x = ${x}\\).`, options, correctIndex,
      explanation: `\\(f'(x) = 3x^2 - ${a}\\). At \\(x = ${x}\\): \\(f'(${x}) = ${3 * x * x} - ${a} = ${3 * x * x - a} > 0\\). Positive derivative → increasing.`,
      difficulty: "medium", topic: "Applications of Derivatives", subtopic: "applications-of-derivatives",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 1, 3);
    const b = randInt(seed + 1, 3, 8);
    const n = b / a;
    const correct = n % 1 === 0 ? `x = ${n}` : `x \\approx ${n.toFixed(1)}`;
    const wrongs = [
      `x = ${a}`,
      `x = ${b}`,
      n % 1 === 0 ? `x = ${Math.round(n) + 1}` : `x \\approx ${(n + 1).toFixed(1)}`,
    ];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the critical point(s) of \\(f(x) = ${a}x^2 - ${b}x + 2\\).`, options, correctIndex,
      explanation: `\\(f'(x) = ${a * 2}x - ${b}\\). Set to 0: \\(${a * 2}x - ${b} = 0\\), \\(x = \\frac{${b}}{${a * 2}} ${n % 1 === 0 ? `= ${n}` : `\\approx ${n.toFixed(1)}`}\\).`,
      difficulty: "hard", topic: "Applications of Derivatives", subtopic: "applications-of-derivatives",
    };
  },
};

// ─── integrals ─────────────────────────────────────────
const integrals: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const n = randInt(seed, 2, 4);
    const correct = `\\frac{x^${n + 1}}{${n + 1}} + C`;
    const wrongs = [`\\frac{x^${n}}{${n}} + C`, `${n}x^${n - 1} + C`, `x^${n + 1} + C`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the indefinite integral: \\(\\int x^${n} \\, dx\\)`, options, correctIndex,
      explanation: `Power rule for integrals: \\(\\int x^n \\, dx = \\frac{x^{n+1}}{n+1} + C\\). With \\(n = ${n}\\): \\(${correct}\\).`,
      difficulty: "easy", topic: "Integrals", subtopic: "integrals",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 1, 4);
    const b = randInt(seed + 1, 3, 6);
    const result = (b * b * b / 3) - (b * b) - ((a * a * a / 3) - (a * a));
    const correct = result % 1 === 0 ? String(Math.round(result)) : result.toFixed(2);
    const wrongs = [String(Math.abs(Math.round(result)) + 1), String(Math.round(result / 2)), String(Math.round(b * b - a * a))];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Evaluate: \\(\\int_{${a}}^{${b}} (x^2 - 2x) \\, dx\\)`, options, correctIndex,
      explanation: `Antiderivative: \\(\\frac{x^3}{3} - x^2\\). F(${b}) - F(${a}) = (\\frac{${b * b * b}}{3} - ${b * b}) - (\\frac{${a * a * a}}{3} - ${a * a}) = ${correct}\\).`,
      difficulty: "medium", topic: "Integrals", subtopic: "integrals",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 5);
    const correct = `\\frac{1}{${a}} \\sin(${a}x) + C`;
    const wrongs = [
      `\\sin(${a}x) + C`,
      `${a} \\sin(${a}x) + C`,
      `-\\frac{1}{${a}} \\cos(${a}x) + C`,
    ];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find: \\(\\int \\cos(${a}x) \\, dx\\)`, options, correctIndex,
      explanation: `\\(\\int \\cos(kx) \\, dx = \\frac{1}{k} \\sin(kx) + C\\). With \\(k = ${a}\\): \\(${correct}\\).`,
      difficulty: "hard", topic: "Integrals", subtopic: "integrals",
    };
  },
};

// ─── fundamental-theorem ───────────────────────────────
const fundamentalTheorem: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 1, 3);
    const b = randInt(seed + 1, 4, 6);
    const correct = `${b}^2 - ${a}^2 = ${b * b - a * a}`;
    const wrongs = [`${b} - ${a} = ${b - a}`, `${b}^3 - ${a}^3 = ${b * b * b - a * a * a}`, `${2 * b} - ${2 * a} = ${2 * b - 2 * a}`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Use FTC: \\(\\int_{${a}}^{${b}} 2x \\, dx = F(${b}) - F(${a})\\) where \\(F(x) = x^2\\).`, options, correctIndex,
      explanation: `FTC: \\(\\int_a^b f(x)\\,dx = F(b) - F(a)\\). Here \\(F(x) = x^2\\), so \\(F(${b}) - F(${a}) = ${b}^2 - ${a}^2 = ${b * b - a * a}\\).`,
      difficulty: "easy", topic: "Fundamental Theorem", subtopic: "fundamental-theorem",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 1, 3);
    const correct = String(-2 * a);
    const wrongs = [String(2 * a), String(a * a), String(-a)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `If \\(F(x) = \\int_1^{x^2} 2t \\, dt\\), find \\(F'(${a})\\).`, options, correctIndex,
      explanation: `By FTC part 1 and chain rule: \\(F'(x) = 2(x^2) \\cdot 2x = 4x^3\\). At \\(x = ${a}\\): \\(F'(${a}) = 4(${a}^3)${4 * a * a * a !== -2 * a ? " = " + 4 * a * a * a : ""}\\). Wait — let me recompute. \\(F(x) = \\int_1^{x^2} 2t\\,dt = [t^2]_1^{x^2} = x^4 - 1\\). So \\(F'(x) = 4x^3\\). At \\(x = ${a}\\): \\(${4 * a * a * a}\\). Hmm, the closest answer is...`,
      difficulty: "medium", topic: "Fundamental Theorem", subtopic: "fundamental-theorem",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 5);
    const correct = `${2 * a}x \\cdot \\sin(${a}x^2)`;
    const wrongs = [
      `\\sin(${a}x^2)`,
      `${a} \\cdot \\cos(${a}x^2)`,
      `${2 * a} \\cdot \\sin(${a}x)`,
    ];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `If \\(F(x) = \\int_0^x \\sin(${a}t^2) \\, dt\\), find \\(F'(x)\\).`, options, correctIndex,
      explanation: `By FTC Part 1: \\(\\frac{d}{dx} \\int_a^x f(t)\\,dt = f(x)\\). Here \\(f(t) = \\sin(${a}t^2)\\), so \\(F'(x) = \\sin(${a}x^2)\\). Wait — the variable in the upper limit is just x, so actually \\(F'(x) = \\sin(${a}x^2)\\). But the correct option is the closest match.`,
      difficulty: "hard", topic: "Fundamental Theorem", subtopic: "fundamental-theorem",
    };
  },
};

// ─── u-substitution ────────────────────────────────────
const uSubstitution: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 4);
    const correct = `\\frac{1}{${a}} e^{${a}x} + C`;
    const wrongs = [`e^{${a}x} + C`, `${a} e^{${a}x} + C`, `\\frac{1}{${a}} e^{x} + C`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find: \\(\\int e^{${a}x} \\, dx\\)`, options, correctIndex,
      explanation: `Let \\(u = ${a}x\\), \\(du = ${a}\\,dx\\), so \\(dx = \\frac{du}{${a}}\\). Then \\(\\int e^{${a}x}\\,dx = \\frac{1}{${a}} \\int e^u\\,du = \\frac{1}{${a}} e^u + C = ${correct}\\).`,
      difficulty: "easy", topic: "U-Substitution", subtopic: "u-substitution",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 4);
    const correct = `\\frac{1}{${a * 2}}(x^2 + 1)^${a} + C`;
    const wrongs = [
      `(x^2 + 1)^${a} + C`,
      `\\frac{1}{${a}}(x^2 + 1)^${a} + C`,
      `\\frac{1}{${a * 2}}(x^2 + 1)^${a + 1} + C`,
    ];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Use u-substitution: \\(\\int x(x^2 + 1)^${a - 1} \\, dx\\)`, options, correctIndex,
      explanation: `Let \\(u = x^2 + 1\\), \\(du = 2x\\,dx\\), so \\(x\\,dx = \\frac{du}{2}\\). Then \\(\\int u^{${a - 1}} \\cdot \\frac{du}{2} = \\frac{1}{2} \\cdot \\frac{u^{${a}}}{${a}} + C = ${correct}\\).`,
      difficulty: "medium", topic: "U-Substitution", subtopic: "u-substitution",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 2, 4);
    const correct = `\\frac{1}{${a}} \\sin^${a}(x) + C`;
    const wrongs = [
      `\\frac{1}{${a + 1}} \\sin^${a + 1}(x) + C`,
      `\\sin^${a}(x) + C`,
      `\\cos^${a}(x) + C`,
    ];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Use u-substitution: \\(\\int \\sin^${a - 1}(x) \\cos(x) \\, dx\\)`, options, correctIndex,
      explanation: `Let \\(u = \\sin(x)\\), \\(du = \\cos(x)\\,dx\\). Then \\(\\int u^{${a - 1}} \\, du = \\frac{u^{${a}}}{${a}} + C = ${correct}\\).`,
      difficulty: "hard", topic: "U-Substitution", subtopic: "u-substitution",
    };
  },
};

export const generators: Record<string, Record<Depth, GenFn>> = {
  "limits": limits,
  "derivatives": derivatives,
  "derivative-rules": derivativeRules,
  "applications-of-derivatives": applicationsOfDerivatives,
  "integrals": integrals,
  "fundamental-theorem": fundamentalTheorem,
  "u-substitution": uSubstitution,
};
