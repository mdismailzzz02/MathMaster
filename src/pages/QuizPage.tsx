import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { explainMistakes, generateQuizQuestions } from "../lib/groq";
import { generateQuestions } from "../lib/quiz/core";
import type {
  QuizPhase,
  QuizResult,
  QuizQuestion,
  AnswerRecord,
  Depth,
  MCQQuestion,
  OrderingQuestion,
  MatchingQuestion,
} from "../lib/quiz/types";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Clock,
  Lightbulb,
  Loader2,
  MessageCircle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Trophy,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { OrderingUI } from "../components/OrderingUI";
import { MatchingUI } from "../components/MatchingUI";
import MathText from "../components/MathText";

// ─── Constants ───────────────────────────────────────────
const TRANSITION = { duration: 0.25, ease: "easeOut" as const };
const QUIZ_COUNT = 10;

export default function QuizPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { topic: topicParam, subtopic: subtopicParam } = useParams<{ topic: string; subtopic: string }>();
  const [searchParams] = useSearchParams();

  // Pull config from URL — topic/subtopic from route params, rest from query string
  const topicSlug    = topicParam    ?? "";
  const subtopicSlug = subtopicParam ?? "";
  const difficulty   = (searchParams.get("difficulty") ?? "core") as Depth;
  const count        = Math.min(parseInt(searchParams.get("count") ?? String(QUIZ_COUNT)) || QUIZ_COUNT, 20);
  const passPercentage = Math.min(parseInt(searchParams.get("pass") ?? "80") || 80, 100);
  const [defaultSeed] = useState(() => Date.now());
  const seed         = parseInt(searchParams.get("seed") || "") || defaultSeed;

  // State
  const [phase, setPhase] = useState<QuizPhase>("loading");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [currentAnswerData, setCurrentAnswerData] = useState<any>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [coachMessage, setCoachMessage] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [subtopicName, setSubtopicName] = useState("");

  // Timer ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [topicName, setTopicName] = useState("");

  // Slug → human name helper
  const slugToName = (slug: string) =>
    slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  // ─── Generate questions (static first, Groq fallback) ───
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setPhase("loading");

      // Derive human-readable names from slugs for Groq fallback
      const subtopicHumanName = subtopicName || slugToName(subtopicSlug);
      const topicHumanName = topicName || slugToName(topicSlug);

      // 1. Try static question bank first
      let qs: QuizQuestion[] = [];
      try {
        qs = generateQuestions(subtopicSlug, difficulty, count, seed);
      } catch { /* ignore, fall through to Groq */ }

      // 2. Groq fallback when no static questions exist
      if (qs.length === 0) {
        try {
          const groqQs = await generateQuizQuestions({
            subtopicName: subtopicHumanName,
            topicName: topicHumanName,
            depth: difficulty,
            count,
          });
          qs = groqQs.map((q, i) => ({
            type: "mcq" as const,
            id: i + 1,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            difficulty: difficulty === "core" ? "easy" : difficulty === "intermediate" ? "medium" : "hard",
            topic: topicHumanName,
            subtopic: subtopicSlug,
          } as MCQQuestion));
        } catch {
          if (!cancelled) setPhase("error");
          return;
        }
      }

      if (cancelled) return;
      if (qs.length === 0) { setPhase("error"); return; }

      setQuestions(qs);
      setAnswers(qs.map((_, i) => ({
        questionId: i + 1,
        selectedIndex: null,
        correct: false,
      })));
      setCurrentIdx(0);
      setCurrentAnswerData(null);
      setShowExplanation(false);
      setCoachMessage(null);
      setSubmitError(null);
      setElapsed(0);
      setStartTime(Date.now());
      setEndTime(0);
      setPhase("quiz");
    };
    run();
    return () => { cancelled = true; };
  }, [subtopicSlug, difficulty, count, seed]);

  // Timer
  useEffect(() => {
    if (phase !== "quiz") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // ─── Fetch subtopic name ────────────────────────────
  useEffect(() => {
    if (!subtopicSlug) return;
    // Use slug-to-name as immediate fallback, then update from DB if found
    setSubtopicName(slugToName(subtopicSlug));
    supabase
      .from("subtopics")
      .select("name")
      .eq("slug", subtopicSlug)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setSubtopicName(data.name);
      });
  }, [subtopicSlug]);

  // ─── Helpers ──────────────────────────────────────────
  const currentQuestion = questions[currentIdx] ?? null;
  const isLastQuestion = currentIdx === questions.length - 1;
  const progressPct = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

  const result: QuizResult | null = useMemo(() => {
    if (phase !== "results" && phase !== "submitting" && phase !== "coach") return null;
    const correct = answers.filter((a) => a.correct).length;
    return {
      questions,
      answers,
      score: correct,
      total: questions.length,
      passed: (correct / questions.length) * 100 >= passPercentage,
      passPercentage,
      seed,
      durationSeconds: endTime > startTime ? Math.round((endTime - startTime) / 1000) : elapsed,
      subtopicId: subtopicSlug,
      depth: difficulty,
    };
  }, [phase, answers, questions, passPercentage, seed, endTime, startTime, elapsed, subtopicSlug, difficulty]);

  const canLevelUp = difficulty !== "advanced";
  const canLevelDown = difficulty !== "core";
  const nextDepth: Depth = difficulty === "core" ? "intermediate" : "advanced";
  const prevDepth: Depth = difficulty === "advanced" ? "intermediate" : "core";

  // ─── Actions ──────────────────────────────────────────
  const submitAnswer = (data: any, correct: boolean) => {
    if (currentAnswerData !== null) return;
    setCurrentAnswerData(data);
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIdx] = {
        ...next[currentIdx],
        selectedIndex: typeof data === "number" ? data : null,
        orderedItems: Array.isArray(data) ? data : undefined,
        matchedPairs: data && typeof data === "object" && !Array.isArray(data)
          ? Object.entries(data).map(([left, right]) => ({ left, right: right as string }))
          : undefined,
        correct,
      };
      return next;
    });
    setShowExplanation(true);
  };

  const selectAnswerMCQ = (optionIdx: number) => {
    if (currentQuestion?.type !== "mcq") return;
    const correct = optionIdx === (currentQuestion as MCQQuestion).correctIndex;
    submitAnswer(optionIdx, correct);
  };

  const selectAnswerOrdering = (order: string[]) => {
    if (currentQuestion?.type !== "ordering") return;
    const q = currentQuestion as OrderingQuestion;
    const correct = JSON.stringify(order) === JSON.stringify(q.correctOrder);
    submitAnswer(order, correct);
  };

  const selectAnswerMatching = (matches: Record<string, string>) => {
    if (currentQuestion?.type !== "matching") return;
    const q = currentQuestion as MatchingQuestion;
    const isCorrect = q.pairs.every((p) => matches[p.left] === p.right);
    submitAnswer(matches, isCorrect);
  };

  const goNext = () => {
    if (isLastQuestion) {
      finishQuiz();
    } else {
      setCurrentIdx((i) => i + 1);
      setCurrentAnswerData(null);
      setShowExplanation(false);
      setCoachMessage(null);
    }
  };

  const finishQuiz = () => {
    const et = Date.now();
    setEndTime(et);
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("submitting");
  };

  // ─── Submit to DB ─────────────────────────────────────
  useEffect(() => {
    if (phase !== "submitting" || !user || !result) return;
    (async () => {
      const { error } = await supabase.from("quiz_attempts").insert({
        user_id: user.id,
        subtopic_slug: subtopicSlug,
        difficulty,
        score: result.score,
        total: result.total,
        passed: result.passed,
        pass_percentage: passPercentage,
        seed,
        duration_seconds: result.durationSeconds,
        answers_json: result.answers,
      });
      if (error) {
        setSubmitError("We couldn't save your quiz. Your results are still shown below.");
      }
      // Dispatch streak update
      window.dispatchEvent(new CustomEvent("mathmaster:streaks-updated"));
      setPhase("coach");
    })();
  }, [phase, user, result, subtopicSlug, difficulty, passPercentage, seed]);

  // ─── AI Coach ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== "coach" || !result) return;
    (async () => {
      setCoachLoading(true);
      const wrongQuestions = result.answers
        .map((a, i) => {
          if (a.correct) return null;
          const q = result.questions[i];
          if (q.type !== "mcq") return null; // Edge function prompt only supports MCQ right now
          return {
            question: q.question,
            correctAnswer: (q as MCQQuestion).options[(q as MCQQuestion).correctIndex],
            explanation: q.explanation
          };
        })
        .filter(Boolean) as any[];

      if (wrongQuestions.length === 0) {
        setCoachMessage(
          "🎉 Perfect score! You've mastered this topic at this level. " +
            (canLevelUp ? "Try Leveling Up for a harder challenge!" : "Amazing work — you're a math wizard!")
        );
        setCoachLoading(false);
        setPhase("results");
        return;
      }

      let coachText: string;
      try {
        coachText = await explainMistakes({
          subtopic: subtopicName || subtopicSlug,
          difficulty,
          mistakes: wrongQuestions.slice(0, 3),
          totalScore: result.score,
          totalQuestions: result.total,
        });
      } catch {
        coachText = "Great effort! Review the explanations above and try again to improve.";
      }
      setCoachLoading(false);
      setCoachMessage(coachText);
      setPhase("results");
    })();
  }, [phase, result, subtopicSlug, subtopicName, difficulty, canLevelUp]);

  // ─── Navigation helpers ───────────────────────────────
  const goToStudy = () => navigate(`/learn/${topicSlug}/${subtopicSlug}`);
  const retakeSame = () => {
    // Same seed = same questions
    navigate(`/quiz/${topicSlug}/${subtopicSlug}?difficulty=${difficulty}&count=${count}&pass=${passPercentage}&seed=${seed}`);
  };
  const retakeNew = () => {
    navigate(`/quiz/${topicSlug}/${subtopicSlug}?difficulty=${difficulty}&count=${count}&pass=${passPercentage}&seed=${Date.now()}`);
  };
  const levelUp = () => {
    navigate(`/quiz/${topicSlug}/${subtopicSlug}?difficulty=${nextDepth}&count=${count}&pass=${passPercentage}&seed=${Date.now()}`);
  };
  const levelDown = () => {
    navigate(`/quiz/${topicSlug}/${subtopicSlug}?difficulty=${prevDepth}&count=${count}&pass=${passPercentage}&seed=${Date.now()}`);
  };

  // ─── Format time ──────────────────────────────────────
  const fmtTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ─── Difficulty color ─────────────────────────────────
  const diffColor = difficulty === "core" ? "var(--color-success)" : difficulty === "intermediate" ? "var(--color-warning)" : "var(--color-destructive)";
  const diffLabel = difficulty === "core" ? "Core" : difficulty === "intermediate" ? "Intermediate" : "Advanced";

  // ─── RENDER: Loading ──────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-foreground/60">Generating your quiz…</p>
      </div>
    );
  }

  // ─── RENDER: Error ────────────────────────────────────
  if (phase === "error") {
    return (
      <div className="card p-8 text-center max-w-md mx-auto mt-12">
        <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="font-heading text-xl font-bold text-foreground">Quiz unavailable</h2>
        <p className="mt-2 text-foreground/60">
          We couldn't generate questions for "{subtopicName || subtopicSlug}" at {diffLabel} level.
        </p>
        <button onClick={goToStudy} className="btn-primary mt-6">
          Back to study guide
        </button>
      </div>
    );
  }

  // ─── RENDER: Coach loading ────────────────────────────
  if (phase === "submitting" || (phase === "coach" && coachLoading)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-foreground/60">
          {phase === "submitting" ? "Saving your results…" : "Getting feedback from your AI Coach…"}
        </p>
      </div>
    );
  }

  // ─── RENDER: Results ──────────────────────────────────
  if (phase === "results" && result) {
    const scorePct = Math.round((result.score / result.total) * 100);
    const passed = result.passed;
    const perfect = result.score === result.total;

    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={TRANSITION}
        className="max-w-2xl mx-auto"
      >
        {/* Back link */}
        <button onClick={goToStudy} className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground mb-6 transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Back to {subtopicName || "study guide"}
        </button>

        {/* Result card */}
        <div className="card p-8 text-center mb-6">
          {/* Icon */}
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
            perfect ? "bg-yellow-100" : passed ? "bg-success/10" : "bg-destructive/10"
          }`}>
            {perfect ? (
              <Trophy className="w-10 h-10 text-yellow-500" />
            ) : passed ? (
              <CheckCircle className="w-10 h-10 text-success" />
            ) : (
              <XCircle className="w-10 h-10 text-destructive" />
            )}
          </div>

          <h1 className="font-heading text-3xl font-bold text-foreground">
            {perfect ? "Perfect!" : passed ? "You passed!" : "Keep practicing!"}
          </h1>
          <p className="mt-2 text-foreground/60 text-lg">
            {perfect
              ? "You got every question right. Outstanding!"
              : passed
                ? `You scored ${scorePct}% — above the ${passPercentage}% threshold.`
                : `You scored ${scorePct}% — just shy of the ${passPercentage}% needed to pass.`}
          </p>

          {/* Score ring */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="text-center">
              <p className="text-4xl font-heading font-bold" style={{ color: passed ? "var(--color-success)" : "var(--color-destructive)" }}>
                {scorePct}%
              </p>
              <p className="text-xs text-foreground/50 mt-1">Score</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-4xl font-heading font-bold text-foreground">
                {result.score}/{result.total}
              </p>
              <p className="text-xs text-foreground/50 mt-1">Correct</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-4xl font-heading font-bold text-foreground/70">
                {fmtTime(result.durationSeconds)}
              </p>
              <p className="text-xs text-foreground/50 mt-1">Time</p>
            </div>
          </div>

          {/* Difficulty badge */}
          <div className="mt-4">
            <span
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-heading font-semibold"
              style={{ backgroundColor: `${diffColor}15`, color: diffColor }}
            >
              <Zap className="w-3.5 h-3.5" />
              {diffLabel} Level
            </span>
          </div>

          {submitError && (
            <p className="mt-4 text-sm text-destructive">{submitError}</p>
          )}
        </div>

        {/* AI Coach Message */}
        {coachMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, ...TRANSITION }}
            className="card p-5 mb-6 border-l-4"
            style={{ borderLeftColor: "var(--color-accent)" }}
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-1">AI Coach Says</h3>
                <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">{coachMessage}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Wrong answer review */}
        {result.answers.filter((a) => !a.correct).length > 0 && (
          <div className="card p-6 mb-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">
              Review incorrect answers ({result.answers.filter((a) => !a.correct).length})
            </h3>
            <div className="space-y-4">
              {result.answers.map((a, i) => {
                if (a.correct) return null;
                const q = result.questions[i];
                return (
                  <div key={i} className="p-4 bg-destructive/5 rounded-xl border border-destructive/20">
                    <div className="text-sm font-medium text-foreground mb-2 flex gap-1">
                      <span>Q{i + 1}:</span>
                      <MathText text={q.question} className="[&>div]:inline" />
                    </div>
                    
                    {/* Render specific UI based on question type */}
                    {q.type === "mcq" && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {q.options.map((opt, oi) => (
                          <span
                            key={oi}
                            className={`px-2 py-0.5 rounded text-xs font-mono ${
                              oi === q.correctIndex
                                ? "bg-success/15 text-success font-bold"
                                : oi === a.selectedIndex
                                  ? "bg-destructive/15 text-destructive line-through"
                                  : "bg-muted text-foreground/40"
                            }`}
                          >
                            <MathText text={opt} className="[&>div]:inline" />
                          </span>
                        ))}
                      </div>
                    )}

                    {q.type === "ordering" && (
                      <div className="text-xs mb-2">
                        <div className="text-success font-medium mb-1">Correct Order:</div>
                        <ol className="list-decimal pl-4 text-foreground/80 mb-2">
                          {q.correctOrder.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ol>
                        <div className="text-destructive font-medium mb-1">Your Order:</div>
                        <ol className="list-decimal pl-4 text-foreground/60 line-through">
                          {a.orderedItems?.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          )) || <li>Not answered</li>}
                        </ol>
                      </div>
                    )}

                    {q.type === "matching" && (
                      <div className="text-xs mb-2">
                         <div className="text-success font-medium mb-1">Correct Pairs:</div>
                         <ul className="list-disc pl-4 text-foreground/80 mb-2">
                           {q.pairs.map((pair, idx) => (
                             <li key={idx}>{pair.left} → {pair.right}</li>
                           ))}
                         </ul>
                         <div className="text-destructive font-medium mb-1">Your Pairs:</div>
                         <ul className="list-disc pl-4 text-foreground/60 line-through">
                           {a.matchedPairs?.map((pair, idx) => (
                             <li key={idx}>{pair.left} → {pair.right}</li>
                           )) || <li>Not answered</li>}
                         </ul>
                      </div>
                    )}

                    <MathText text={q.explanation || ""} className="text-xs text-foreground/60 [&>div]:inline" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          {/* Primary: Retake or Level Up */}
          {!passed && (
            <button onClick={retakeSame} className="btn-primary w-full flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Re-attempt same quiz
            </button>
          )}

          <button onClick={retakeNew} className={passed ? "btn-primary w-full flex items-center justify-center gap-2" : "btn-secondary w-full flex items-center justify-center gap-2"}>
            <Sparkles className="w-4 h-4" />
            Try another quiz ({diffLabel})
          </button>

          {/* Level Up */}
          {canLevelUp && (
            <button onClick={levelUp} className="btn-secondary w-full flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Level Up — Try {nextDepth === "intermediate" ? "Intermediate" : "Advanced"}
            </button>
          )}

          {/* Try Previous Level */}
          {canLevelDown && (
            <button onClick={levelDown} className="btn-secondary w-full flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Try Previous Level — {prevDepth === "intermediate" ? "Intermediate" : "Core"}
            </button>
          )}

          {/* Back to study */}
          <button onClick={goToStudy} className="text-sm text-foreground/50 hover:text-foreground transition-colors mt-2 cursor-pointer">
            Back to study guide
          </button>
        </div>
      </motion.div>
    );
  }

  // ─── RENDER: Quiz ─────────────────────────────────────
  if (!currentQuestion) return null;

  return (
    <motion.div
      key={`q-${currentIdx}`}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={TRANSITION}
      className="max-w-2xl mx-auto"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={goToStudy} className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          {subtopicName || "Study"}
        </button>
        <div className="flex items-center gap-3 text-sm text-foreground/60">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {fmtTime(elapsed)}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-heading font-semibold"
            style={{ backgroundColor: `${diffColor}15`, color: diffColor }}
          >
            {diffLabel}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: `${((currentIdx) / questions.length) * 100}%` }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      {/* Question number */}
      <p className="text-sm text-foreground/50 mb-2">
        Question {currentIdx + 1} of {questions.length}
      </p>

      {/* Question text */}
      <div className="card p-6 mb-6">
        <MathText
          text={currentQuestion.question}
          className="text-lg font-heading font-semibold text-foreground leading-relaxed [&>div]:inline-block"
        />
      </div>

      {/* Options */}
      <div className="mb-6">
        {currentQuestion.type === "mcq" && (
          <div className="grid gap-3">
            {currentQuestion.options.map((opt: string, i: number) => {
              let variant: "default" | "selected" | "correct" | "wrong" = "default";
              if (currentAnswerData !== null) {
                if (i === currentQuestion.correctIndex) variant = "correct";
                else if (i === currentAnswerData) variant = "wrong";
              } else if (currentAnswerData === null && i === currentAnswerData) {
                variant = "selected";
              }

              return (
                <button
                  key={i}
                  onClick={() => selectAnswerMCQ(i)}
                  disabled={currentAnswerData !== null}
                  className={`w-full text-left px-5 py-4 rounded-2xl border-2 font-medium transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                    variant === "correct"
                      ? "border-success bg-success/5 text-foreground"
                      : variant === "wrong"
                        ? "border-destructive bg-destructive/5 text-foreground"
                        : currentAnswerData !== null
                          ? "border-border bg-muted/30 text-foreground/40"
                          : "border-border bg-card hover:border-primary/50 hover:bg-primary/5 text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-heading font-bold shrink-0 ${
                      variant === "correct"
                        ? "bg-success text-white"
                        : variant === "wrong"
                          ? "bg-destructive text-white"
                          : "bg-muted text-foreground/60"
                    }`}>
                      {variant === "correct" ? <Check className="w-4 h-4" /> : variant === "wrong" ? <X className="w-4 h-4" /> : String.fromCharCode(65 + i)}
                    </span>
                    <MathText text={opt} className="[&>div]:inline" />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {currentQuestion.type === "ordering" && (
          <OrderingUI
            items={currentQuestion.items}
            disabled={currentAnswerData !== null}
            onConfirm={selectAnswerOrdering}
            showFeedback={showExplanation}
            correctOrder={currentQuestion.correctOrder}
            userOrder={currentAnswerData as string[] | null}
          />
        )}

        {currentQuestion.type === "matching" && (
          <MatchingUI
            pairs={currentQuestion.pairs}
            disabled={currentAnswerData !== null}
            onConfirm={selectAnswerMatching}
            showFeedback={showExplanation}
            userMatches={currentAnswerData as Record<string, string> | null}
          />
        )}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={TRANSITION}
            className="overflow-hidden mb-6"
          >
            <div className="card p-5 border-l-4 bg-accent/5" style={{ borderLeftColor: "var(--color-accent)" }}>
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <MathText text={currentQuestion.explanation || ""} className="text-sm text-foreground/70 leading-relaxed [&>div]:inline" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next / Finish button */}
      {currentAnswerData !== null && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={TRANSITION}
          onClick={goNext}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isLastQuestion ? (
            <>
              <Trophy className="w-4 h-4" />
              See Results
            </>
          ) : (
            <>
              <ArrowRight className="w-4 h-4" />
              Next Question
            </>
          )}
        </motion.button>
      )}

      {/* Question nav dots */}
      <div className="flex justify-center gap-1.5 mt-6 flex-wrap">
        {questions.map((_, i) => {
          const a = answers[i];
          const isCurrent = i === currentIdx;
          const isAnswered = a?.data !== undefined;
          const isCorrect = a?.correct;
          return (
            <button
              key={i}
              onClick={() => {
                if (isAnswered || i < currentIdx) {
                  setCurrentIdx(i);
                  setCurrentAnswerData(answers[i]?.data ?? null);
                  setShowExplanation(answers[i]?.data !== undefined);
                  setCoachMessage(null);
                }
              }}
              className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                isCurrent
                  ? "w-6 bg-primary"
                  : isCorrect
                    ? "bg-success"
                    : isAnswered
                      ? "bg-destructive"
                      : "bg-muted"
              }`}
              aria-label={`Question ${i + 1}${isAnswered ? (isCorrect ? " (correct)" : " (incorrect)") : ""}`}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
