export type Depth = "core" | "intermediate" | "advanced";
export type Difficulty = "easy" | "medium" | "hard";

// ── Legacy interface (kept for generator files in algebra1.ts etc.) ─────────
export interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: Difficulty;
  topic: string;
  subtopic: string;
}

// ── Typed question variants ──────────────────────────────────────────────────
export interface MCQQuestion extends Question {
  type: "mcq";
}

export interface OrderingQuestion {
  type: "ordering";
  id: number;
  question: string;
  items: string[];          // Already shuffled
  correctOrder: string[];  // The right sequence
  explanation: string;
  difficulty: Difficulty;
  topic: string;
  subtopic: string;
}

export interface MatchingQuestion {
  type: "matching";
  id: number;
  question: string;
  pairs: Array<{ left: string; right: string }>; // Correct pairs (right shown shuffled)
  explanation: string;
  difficulty: Difficulty;
  topic: string;
  subtopic: string;
}

export type QuizQuestion = MCQQuestion | OrderingQuestion | MatchingQuestion;

// ── Answer record ────────────────────────────────────────────────────────────
export interface AnswerRecord {
  questionId: number;
  selectedIndex: number | null;   // MCQ: which option was clicked
  orderedItems?: string[];        // Ordering: user's final arrangement
  matchedPairs?: Array<{ left: string; right: string }>; // Matching: user's pairs
  correct: boolean;
}

// ── Quiz result ──────────────────────────────────────────────────────────────
export interface QuizResult {
  questions: QuizQuestion[];
  answers: AnswerRecord[];
  score: number;
  total: number;
  passed: boolean;
  passPercentage: number;
  seed: number;
  durationSeconds: number;
  subtopicId: string;
  depth: Depth;
}

export type QuizPhase =
  | "loading"
  | "quiz"
  | "results"
  | "submitting"
  | "coach"
  | "error";
