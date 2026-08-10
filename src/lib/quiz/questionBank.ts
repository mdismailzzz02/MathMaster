import type { Depth, Difficulty, OrderingQuestion, MatchingQuestion } from "./types";
import { mulberry32 } from "./core";

/**
 * We curate non-MCQ questions by keyword. These are returned by a generator function
 * to keep randomizing items based on the seed.
 */

// Helper to shuffle arrays consistently
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getOrderingQuestions(
  subtopic: string,
  depth: Depth,
  seed: number,
  idx: number
): OrderingQuestion[] {
  const rng = mulberry32(seed);
  const diff: Difficulty = depth === "core" ? "easy" : depth === "intermediate" ? "medium" : "hard";

  const pool: Array<Omit<OrderingQuestion, "type" | "id" | "difficulty" | "topic" | "subtopic" | "items">> = [];

  // Keyword matchers for topics
  if (subtopic.includes("linear-equations")) {
    pool.push({
      question: "Order the steps to solve: 3x - 5 = 10",
      correctOrder: [
        "Add 5 to both sides (3x = 15)",
        "Divide both sides by 3 (x = 5)",
        "Check the solution (3(5) - 5 = 10)"
      ],
      explanation: "First isolate the x term by adding 5, then solve for x by dividing by 3."
    });
  } else if (subtopic.includes("derivatives")) {
    pool.push({
      question: "Order the steps to find the derivative of f(x) = x³ using the limit definition.",
      correctOrder: [
        "Set up the limit: lim(h→0) [(x+h)³ - x³] / h",
        "Expand (x+h)³: lim(h→0) [x³ + 3x²h + 3xh² + h³ - x³] / h",
        "Cancel x³ and factor out h: lim(h→0) h[3x² + 3xh + h²] / h",
        "Cancel h and evaluate limit as h→0: 3x²"
      ],
      explanation: "Setting up the difference quotient, expanding, simplifying, and evaluating the limit yields 3x²."
    });
  } else if (subtopic.includes("integrals")) {
    pool.push({
      question: "Order the steps to evaluate ∫ 2x e^(x²) dx using u-substitution.",
      correctOrder: [
        "Let u = x²",
        "Find du = 2x dx",
        "Substitute to get ∫ e^u du",
        "Integrate to get e^u + C",
        "Substitute back x² to get e^(x²) + C"
      ],
      explanation: "U-substitution simplifies the integral by changing variables, integrating, and then changing back."
    });
  } else {
    // Generic fallback for any math topic
    pool.push({
      question: "Order these mathematical operations by precedence (Order of Operations).",
      correctOrder: [
        "Parentheses / Brackets",
        "Exponents / Roots",
        "Multiplication & Division",
        "Addition & Subtraction"
      ],
      explanation: "PEMDAS: Parentheses, Exponents, Multiplication/Division (left to right), Addition/Subtraction (left to right)."
    });
  }

  // Return generated instances
  return pool.map((p, i) => ({
    type: "ordering",
    id: idx + i,
    question: p.question,
    items: shuffle([...p.correctOrder], rng),
    correctOrder: p.correctOrder,
    explanation: p.explanation,
    difficulty: diff,
    topic: "General Math",
    subtopic
  }));
}

export function getMatchingQuestions(
  subtopic: string,
  depth: Depth,
  seed: number,
  idx: number
): MatchingQuestion[] {
  const diff: Difficulty = depth === "core" ? "easy" : depth === "intermediate" ? "medium" : "hard";

  const pool: Array<Omit<MatchingQuestion, "type" | "id" | "difficulty" | "topic" | "subtopic">> = [];

  if (subtopic.includes("geometry") || subtopic.includes("triangles") || subtopic.includes("circles")) {
    pool.push({
      question: "Match the geometric term to its definition.",
      pairs: [
        { left: "Radius", right: "Distance from center to edge" },
        { left: "Diameter", right: "Distance across a circle through center" },
        { left: "Circumference", right: "Distance around a circle" },
        { left: "Hypotenuse", right: "Longest side of a right triangle" }
      ],
      explanation: "Radius is half the diameter. Circumference is the perimeter of a circle."
    });
  } else if (subtopic.includes("calculus") || subtopic.includes("derivatives")) {
    pool.push({
      question: "Match the calculus concept to its geometric meaning.",
      pairs: [
        { left: "Derivative", right: "Slope of the tangent line" },
        { left: "Definite Integral", right: "Area under the curve" },
        { left: "Limit", right: "Value a function approaches" },
        { left: "Second Derivative", right: "Concavity of the curve" }
      ],
      explanation: "Derivatives measure rate of change (slope). Integrals accumulate quantities (area)."
    });
  } else {
    // Generic algebraic
    pool.push({
      question: "Match the algebraic term to its example.",
      pairs: [
        { left: "Variable", right: "x or y" },
        { left: "Coefficient", right: "The 3 in 3x" },
        { left: "Constant", right: "A fixed number like 7" },
        { left: "Expression", right: "2x + 5 (no equals sign)" }
      ],
      explanation: "Variables represent unknowns, coefficients multiply variables, and constants are fixed numbers."
    });
  }

  return pool.map((p, i) => ({
    type: "matching",
    id: idx + i,
    question: p.question,
    pairs: p.pairs,
    explanation: p.explanation,
    difficulty: diff,
    topic: "General Math",
    subtopic
  }));
}
