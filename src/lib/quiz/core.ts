import type { Question, Depth, Difficulty, QuizQuestion, MCQQuestion } from "./types";
import { generators as algebra1 } from "./algebra1";
import { generators as geometry } from "./geometry";
import { generators as algebra2 } from "./algebra2";
import { generators as calculus } from "./calculus";
import { getOrderingQuestions, getMatchingQuestions } from "./questionBank";

// ─── Seeded PRNG (mulberry32) ──────────────────────────
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Seeded helpers ────────────────────────────────────
export function randInt(seed: number, min: number, max: number): number {
  const rng = mulberry32(seed);
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function randInts(seed: number, count: number, min: number, max: number, unique = true): number[] {
  const rng = mulberry32(seed);
  const result: number[] = [];
  const seen = new Set<number>();
  let attempts = 0;
  while (result.length < count && attempts < 1000) {
    const v = Math.floor(rng() * (max - min + 1)) + min;
    if (!unique || !seen.has(v)) {
      result.push(v);
      if (unique) seen.add(v);
    }
    attempts++;
  }
  return result;
}

export function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Option builder ────────────────────────────────────
export function buildOptions(
  correct: string,
  distractors: string[],
  rng: () => number
): { options: string[]; correctIndex: number } {
  const all = shuffleArray([correct, ...distractors], rng);
  return { options: all, correctIndex: all.indexOf(correct) };
}

// ─── Generator registry ────────────────────────────────
export interface SubtopicMeta {
  slug: string;
  name: string;
  depth: Depth;
  topicSlug: string;
  topicName: string;
  topicColor: string;
}

const ALL_GENERATORS: Record<string, Record<Depth, (seed: number, idx: number) => Question>> = {
  ...algebra1,
  ...geometry,
  ...algebra2,
  ...calculus,
};

const SUBTOPIC_META: SubtopicMeta[] = [
  // Algebra 1
  { slug: "linear-equations", name: "Linear Equations", depth: "core", topicSlug: "algebra-1", topicName: "Algebra 1", topicColor: "#4A7CF7" },
  { slug: "slope-intercept", name: "Slope-Intercept Form", depth: "core", topicSlug: "algebra-1", topicName: "Algebra 1", topicColor: "#4A7CF7" },
  { slug: "inequalities", name: "Inequalities", depth: "core", topicSlug: "algebra-1", topicName: "Algebra 1", topicColor: "#4A7CF7" },
  { slug: "systems-of-equations", name: "Systems of Equations", depth: "intermediate", topicSlug: "algebra-1", topicName: "Algebra 1", topicColor: "#4A7CF7" },
  { slug: "exponents", name: "Exponents", depth: "intermediate", topicSlug: "algebra-1", topicName: "Algebra 1", topicColor: "#4A7CF7" },
  { slug: "polynomials", name: "Polynomials", depth: "advanced", topicSlug: "algebra-1", topicName: "Algebra 1", topicColor: "#4A7CF7" },
  { slug: "factoring", name: "Factoring", depth: "advanced", topicSlug: "algebra-1", topicName: "Algebra 1", topicColor: "#4A7CF7" },
  { slug: "quadratic-equations", name: "Quadratic Equations", depth: "advanced", topicSlug: "algebra-1", topicName: "Algebra 1", topicColor: "#4A7CF7" },
  // Geometry
  { slug: "points-lines-planes", name: "Points, Lines & Planes", depth: "core", topicSlug: "geometry", topicName: "Geometry", topicColor: "#22C55E" },
  { slug: "angles", name: "Angles", depth: "core", topicSlug: "geometry", topicName: "Geometry", topicColor: "#22C55E" },
  { slug: "triangles", name: "Triangles", depth: "core", topicSlug: "geometry", topicName: "Geometry", topicColor: "#22C55E" },
  { slug: "circles", name: "Circles", depth: "intermediate", topicSlug: "geometry", topicName: "Geometry", topicColor: "#22C55E" },
  { slug: "polygons", name: "Polygons", depth: "intermediate", topicSlug: "geometry", topicName: "Geometry", topicColor: "#22C55E" },
  { slug: "transformations", name: "Transformations", depth: "advanced", topicSlug: "geometry", topicName: "Geometry", topicColor: "#22C55E" },
  { slug: "coordinate-geometry", name: "Coordinate Geometry", depth: "advanced", topicSlug: "geometry", topicName: "Geometry", topicColor: "#22C55E" },
  { slug: "trigonometry-basics", name: "Trigonometry Basics", depth: "advanced", topicSlug: "geometry", topicName: "Geometry", topicColor: "#22C55E" },
  // Algebra 2
  { slug: "functions", name: "Functions", depth: "core", topicSlug: "algebra-2", topicName: "Algebra 2", topicColor: "#A855F7" },
  { slug: "domain-range", name: "Domain & Range", depth: "core", topicSlug: "algebra-2", topicName: "Algebra 2", topicColor: "#A855F7" },
  { slug: "matrices", name: "Matrices", depth: "intermediate", topicSlug: "algebra-2", topicName: "Algebra 2", topicColor: "#A855F7" },
  { slug: "rational-expressions", name: "Rational Expressions", depth: "intermediate", topicSlug: "algebra-2", topicName: "Algebra 2", topicColor: "#A855F7" },
  { slug: "exponential-functions", name: "Exponential Functions", depth: "intermediate", topicSlug: "algebra-2", topicName: "Algebra 2", topicColor: "#A855F7" },
  { slug: "logarithms", name: "Logarithms", depth: "advanced", topicSlug: "algebra-2", topicName: "Algebra 2", topicColor: "#A855F7" },
  { slug: "sequences", name: "Sequences", depth: "advanced", topicSlug: "algebra-2", topicName: "Algebra 2", topicColor: "#A855F7" },
  { slug: "conic-sections", name: "Conic Sections", depth: "advanced", topicSlug: "algebra-2", topicName: "Algebra 2", topicColor: "#A855F7" },
  // Calculus
  { slug: "limits", name: "Limits", depth: "core", topicSlug: "calculus", topicName: "Calculus", topicColor: "#F59E0B" },
  { slug: "derivatives", name: "Derivatives", depth: "core", topicSlug: "calculus", topicName: "Calculus", topicColor: "#F59E0B" },
  { slug: "derivative-rules", name: "Derivative Rules", depth: "core", topicSlug: "calculus", topicName: "Calculus", topicColor: "#F59E0B" },
  { slug: "applications-of-derivatives", name: "Applications of Derivatives", depth: "intermediate", topicSlug: "calculus", topicName: "Calculus", topicColor: "#F59E0B" },
  { slug: "integrals", name: "Integrals", depth: "intermediate", topicSlug: "calculus", topicName: "Calculus", topicColor: "#F59E0B" },
  { slug: "fundamental-theorem", name: "Fundamental Theorem", depth: "advanced", topicSlug: "calculus", topicName: "Calculus", topicColor: "#F59E0B" },
  { slug: "u-substitution", name: "U-Substitution", depth: "advanced", topicSlug: "calculus", topicName: "Calculus", topicColor: "#F59E0B" },
];

export function getAllSubtopicMeta(): SubtopicMeta[] {
  return SUBTOPIC_META;
}

export function generateQuestions(
  subtopicSlug: string,
  depth: Depth,
  count: number,
  seed: number
): QuizQuestion[] {
  const gen = ALL_GENERATORS[subtopicSlug]?.[depth];
  
  const allQuestions: QuizQuestion[] = [];
  
  if (gen) {
    for (let i = 0; i < count; i++) {
      const q = gen(seed + i * 137, i);
      allQuestions.push({ ...q, type: "mcq", subtopic: subtopicSlug } as MCQQuestion);
    }
  } else {
    // Generic fallback for custom topics
    for (let i = 0; i < count; i++) {
      allQuestions.push({
        type: "mcq",
        id: i + 1,
        subtopic: subtopicSlug,
        question: `Solve this problem related to **${subtopicSlug.replace(/-/g, ' ')}**.`,
        options: ["Correct Answer", "Incorrect A", "Incorrect B", "Incorrect C"],
        correctIndex: 0,
        explanation: "This is a placeholder question for a custom AI-generated topic.",
        difficulty: depth === "core" ? "easy" : depth === "intermediate" ? "medium" : "hard",
        topic: "Custom Topic"
      });
    }
  }

    // Inject ordering/matching based on seed
    // (We replace up to 2 MCQs with a matching and ordering question if count >= 3)
    if (count >= 3) {
      // Add 1 matching
      const matchingSet = getMatchingQuestions(subtopicSlug, depth, seed, 900);
      if (matchingSet.length > 0) {
        const insertIdx = Math.floor(mulberry32(seed + 1)() * count);
        allQuestions[insertIdx] = matchingSet[0];
      }

      // Add 1 ordering
      const orderingSet = getOrderingQuestions(subtopicSlug, depth, seed, 800);
      if (orderingSet.length > 0) {
        let insertIdx2 = Math.floor(mulberry32(seed + 2)() * count);
        while (allQuestions[insertIdx2].type !== "mcq") {
          insertIdx2 = (insertIdx2 + 1) % count;
        }
        allQuestions[insertIdx2] = orderingSet[0];
      }
    }

  // Reassign sequential IDs
  return allQuestions.map((q, i) => ({ ...q, id: i + 1 }));
}

// ─── Topic→subtopic mapping for mastery tests ──────────
