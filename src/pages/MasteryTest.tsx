import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { getAllSubtopicMeta, generateQuestions, type SubtopicMeta } from "../lib/quiz/core";
import type { Question, AnswerRecord } from "../lib/quiz/types";
import {
  ArrowRight,
  Check,
  CheckCircle,
  Clock,
  Loader2,
  RotateCcw,
  Target,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import MathText from "../components/MathText";

// ── Config ─────────────────────────────────────────────
const QUESTIONS_PER_TOPIC = 3; // 3 per topic × 4 topics = 12 questions
const PASS_PERCENTAGE     = 70;

type Phase = "intro" | "quiz" | "feedback" | "results" | "submitting";

interface TopicResult {
  topicName: string;
  topicColor: string;
  topicSlug: string;
  correct: number;
  total: number;
  weaknesses: string[];
}

// ── Helpers ────────────────────────────────────────────
function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function pickRandom<T>(arr: T[], count: number, seed: number): T[] {
  const rng = { s: seed | 0, next() {
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }};
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(count, a.length));
}

export default function MasteryTest() {
  const { user }   = useAuth();

  const [phase, setPhase]               = useState<Phase>("intro");
  const [questions, setQuestions]       = useState<Question[]>([]);
  const [subtopicMetas, setSubtopicMetas] = useState<SubtopicMeta[]>([]);
  const [currentIdx, setCurrentIdx]     = useState(0);
  const [answers, setAnswers]           = useState<AnswerRecord[]>([]);
  const [selected, setSelected]         = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [elapsed, setElapsed]           = useState(0);
  const [topicResults, setTopicResults] = useState<TopicResult[]>([]);
  const [submitting, setSubmitting]     = useState(false);
  const [availableTopics, setAvailableTopics] = useState<{slug: string, name: string}[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load available topics on mount
  useEffect(() => {
    const metas = getAllSubtopicMeta();
    const coreMap = new Map<string, string>();
    metas.forEach(m => {
      if (!coreMap.has(m.topicSlug)) coreMap.set(m.topicSlug, m.topicName);
    });
    const topicsList = Array.from(coreMap.entries()).map(([slug, name]) => ({ slug, name }));

    // Add custom topics
    try {
      const customRaw = localStorage.getItem("custom_topics");
      if (customRaw) {
        const customParsed = JSON.parse(customRaw);
        customParsed.forEach((ct: any) => {
          if (!topicsList.find(t => t.slug === ct.slug)) {
            topicsList.push({ slug: ct.slug, name: ct.name });
          }
        });
      }
    } catch(e) {}

    setAvailableTopics(topicsList);
    setSelectedTopics(new Set(topicsList.map(t => t.slug)));
  }, []);

  // Build question set from selected topics
  const buildQuestions = useCallback(() => {
    const seed = Date.now();
    
    // Core topics
    let allMeta = [...getAllSubtopicMeta()];
    
    // Custom topics
    try {
      const customRaw = localStorage.getItem("custom_topics");
      if (customRaw) {
        const customParsed = JSON.parse(customRaw);
        customParsed.forEach((ct: any) => {
          ct.subtopics.forEach((sub: any) => {
            allMeta.push({
              slug: sub.slug,
              name: sub.name,
              topicSlug: ct.slug,
              topicName: ct.name,
              topicColor: ct.color || "#4A7CF7",
              depth: sub.depth as "core" | "intermediate" | "advanced"
            });
          });
        });
      }
    } catch(e) {}

    // Group by topic, filtering out unselected ones
    const byTopic = new Map<string, SubtopicMeta[]>();
    allMeta.forEach((m) => {
      if (!selectedTopics.has(m.topicSlug)) return;
      if (!byTopic.has(m.topicSlug)) byTopic.set(m.topicSlug, []);
      byTopic.get(m.topicSlug)!.push(m);
    });

    const allQuestions: Question[] = [];
    const usedMetas: SubtopicMeta[] = [];
    let qi = 0;
    byTopic.forEach((metas, _topicSlug) => {
      const chosen = pickRandom(metas, QUESTIONS_PER_TOPIC, seed + qi * 999);
      chosen.forEach((meta) => {
        const qs = generateQuestions(meta.slug, meta.depth, 1, seed + qi * 137);
        if (qs.length > 0) {
          allQuestions.push({ ...qs[0], id: allQuestions.length + 1 } as Question);
          usedMetas.push(meta);
        }
        qi++;
      });
    });

    setQuestions(allQuestions);
    setSubtopicMetas(usedMetas);
    setAnswers(allQuestions.map((_, i) => ({ questionId: i + 1, selectedIndex: null, correct: false })));
    return { questions: allQuestions };
  }, [selectedTopics]);

  // Timer
  useEffect(() => {
    if (phase === "quiz") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const startTest = () => {
    if (selectedTopics.size === 0) return;
    const { questions: qs } = buildQuestions();
    if (qs.length === 0) {
      alert("No questions could be generated for the selected topics.");
      return;
    }
    setCurrentIdx(0);
    setSelected(null);
    setShowFeedback(false);
    setElapsed(0);
    setPhase("quiz");
  };

  const submitAnswer = () => {
    if (selected === null) return;
    const q  = questions[currentIdx];
    const ok = selected === q.correctIndex;
    const newAnswers = [...answers];
    newAnswers[currentIdx] = { questionId: q.id, selectedIndex: selected, correct: ok };
    setAnswers(newAnswers);
    setShowFeedback(true);
  };

  const next = () => {
    setShowFeedback(false);
    setSelected(null);
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      finishTest();
    }
  };

  const finishTest = () => {
    // Build per-topic results
    const topicMap = new Map<string, TopicResult>();
    questions.forEach((_q, i) => {
      const meta = subtopicMetas[i];
      if (!meta) return;
      if (!topicMap.has(meta.topicSlug)) {
        topicMap.set(meta.topicSlug, {
          topicName: meta.topicName,
          topicColor: meta.topicColor,
          topicSlug: meta.topicSlug,
          correct: 0,
          total: 0,
          weaknesses: [],
        });
      }
      const entry = topicMap.get(meta.topicSlug)!;
      entry.total++;
      if (answers[i]?.correct) {
        entry.correct++;
      } else {
        entry.weaknesses.push(meta.name);
      }
    });
    setTopicResults(Array.from(topicMap.values()));
    setPhase("results");
    submitResults();
  };

  const submitResults = async () => {
    if (!user) return;
    setSubmitting(true);
    // Submit one quiz attempt per subtopic directly to Supabase (no edge function)
    try {
      const promises = questions.map(async (q, i) => {
        const meta = subtopicMetas[i];
        if (!meta) return;
        const ok = answers[i]?.correct ?? false;
        await supabase.from("quiz_attempts").insert({
          user_id: user.id,
          subtopic_slug: meta.slug,
          difficulty: meta.depth,
          score: ok ? 1 : 0,
          total: 1,
          passed: ok,
          pass_percentage: PASS_PERCENTAGE,
          seed: Date.now() + i,
          duration_seconds: Math.round(elapsed / questions.length),
          answers_json: [{ questionId: q.id, correct: ok, depth: meta.depth }],
        });
      });
      await Promise.allSettled(promises);
    } catch { /* silent — don't block results */ }
    setSubmitting(false);
    window.dispatchEvent(new Event("mathmaster:streaks-updated"));
  };

  const totalCorrect   = answers.filter((a) => a.correct).length;
  const totalQuestions = questions.length;
  const score          = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const passed         = score >= PASS_PERCENTAGE;

  const weakTopics = topicResults.filter((t) => t.correct / t.total < 0.67);

  // ── Phases ───────────────────────────────────────────

  if (phase === "intro") {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-7 h-7 text-primary" /> Mastery Test
          </h1>
          <p className="mt-1 text-foreground/60">
            A cross-topic diagnostic across all 4 subjects. Find your strengths and areas to improve.
          </p>
        </motion.div>

        <motion.div className="card p-6 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-heading text-2xl font-bold text-primary">{selectedTopics.size * QUESTIONS_PER_TOPIC}</p>
              <p className="text-xs text-foreground/60">Questions</p>
            </div>
            <div>
              <p className="font-heading text-2xl font-bold text-accent">{selectedTopics.size}</p>
              <p className="text-xs text-foreground/60">Topics</p>
            </div>
            <div>
              <p className="font-heading text-2xl font-bold text-purple-600">{PASS_PERCENTAGE}%</p>
              <p className="text-xs text-foreground/60">Pass threshold</p>
            </div>
          </div>

          <hr className="border-border" />

          <div>
            <p className="text-sm font-semibold mb-3">Select Topics for Test:</p>
            <div className="grid grid-cols-2 gap-2">
              {availableTopics.map(t => {
                const isSel = selectedTopics.has(t.slug);
                return (
                  <button
                    key={t.slug}
                    onClick={() => {
                      const n = new Set(selectedTopics);
                      if (n.has(t.slug)) n.delete(t.slug);
                      else n.add(t.slug);
                      setSelectedTopics(n);
                    }}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-colors ${
                      isSel 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border bg-card text-foreground/60 hover:bg-muted'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
                      isSel ? 'border-primary bg-primary' : 'border-foreground/30 bg-transparent'
                    }`}>
                      {isSel && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm font-medium truncate">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <p className="text-xs text-center text-foreground/50 italic mt-2">
            3 questions per selected topic
          </p>

          <button
            onClick={startTest}
            disabled={selectedTopics.size === 0}
            className="btn-primary w-full shadow-lg shadow-primary/20"
          >
            Start Mastery Test <ArrowRight className="w-5 h-5 ml-1" />
          </button>
        </motion.div>
      </div>
    );
  }

  if (phase === "quiz") {
    const q          = questions[currentIdx];
    const answered   = answers[currentIdx]?.selectedIndex !== null;
    const progress   = ((currentIdx + (showFeedback ? 1 : 0)) / totalQuestions) * 100;
    const meta       = subtopicMetas[currentIdx];

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2 text-sm text-foreground/60">
            <span>Question {currentIdx + 1} of {totalQuestions}</span>
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-4 h-4" /> {formatTime(elapsed)}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Topic pill */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: meta?.topicColor ?? "#4A7CF7" }}
          >
            {meta?.topicName}
          </span>
          <span className="text-xs text-foreground/50">{meta?.name}</span>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="card p-6 space-y-5"
          >
            <MathText
              text={q.question}
              className="font-heading font-semibold text-lg text-foreground leading-snug [&>div]:inline-block"
            />

            <div className="space-y-3">
              {q.options.map((opt, i) => {
                let cls = "w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ";
                if (!showFeedback) {
                  cls += selected === i
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/50 text-foreground";
                } else {
                  if (i === q.correctIndex) cls += "border-green-500 bg-green-50 text-green-700";
                  else if (i === selected)   cls += "border-red-400 bg-red-50 text-red-600";
                  else                       cls += "border-border bg-card text-foreground/50";
                }
                return (
                  <button
                    key={i}
                    className={cls}
                    disabled={showFeedback}
                    onClick={() => setSelected(i)}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ borderColor: "currentColor" }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <MathText text={opt} className="[&>div]:inline" />
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl text-sm ${answers[currentIdx]?.correct ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
              >
                <p className="flex items-center gap-2 font-semibold mb-1">
                  {answers[currentIdx]?.correct
                    ? <><CheckCircle className="w-4 h-4" /> Correct!</>
                    : <><XCircle className="w-4 h-4" /> Not quite</>
                  }
                </p>
                <MathText text={q.explanation || ""} className="text-xs opacity-80 [&>div]:inline" />
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              {!showFeedback ? (
                <button
                  className="btn-primary"
                  disabled={selected === null}
                  onClick={submitAnswer}
                >
                  Confirm
                </button>
              ) : (
                <button className="btn-primary" onClick={next}>
                  {currentIdx + 1 < totalQuestions ? (
                    <>Next <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    <>Finish <Trophy className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (phase === "results") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Score */}
        <motion.div
          className="card p-8 text-center"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl font-heading font-bold mb-4 ${passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {score}%
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {passed ? "Great work! 🎉" : "Keep practising! 💪"}
          </h2>
          <p className="text-foreground/60 mt-1">
            {totalCorrect} of {totalQuestions} correct · {formatTime(elapsed)}
          </p>
          {submitting && (
            <p className="flex items-center justify-center gap-2 text-sm text-foreground/50 mt-3">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving results…
            </p>
          )}
        </motion.div>

        {/* Per-topic breakdown */}
        <h2 className="font-heading text-xl font-bold text-foreground">Topic Breakdown</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {topicResults.map((t, i) => {
            const pct = Math.round((t.correct / t.total) * 100);
            return (
              <motion.div
                key={t.topicSlug}
                className="card p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 * i }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-heading font-semibold text-foreground">{t.topicName}</p>
                  <span
                    className="font-heading font-bold text-sm px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${t.topicColor}22`, color: t.topicColor }}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: t.topicColor }}
                  />
                </div>
                <p className="text-xs text-foreground/50 mt-1">{t.correct}/{t.total} correct</p>
              </motion.div>
            );
          })}
        </div>

        {/* Weak areas */}
        {weakTopics.length > 0 && (
          <div className="card p-5">
            <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" /> Suggested focus areas
            </h3>
            <div className="space-y-2">
              {weakTopics.flatMap((t) =>
                t.weaknesses.map((w) => (
                  <Link
                    key={`${t.topicSlug}-${w}`}
                    to={`/learn/${t.topicSlug}/${w.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted hover:bg-muted/70 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{w}</p>
                      <p className="text-xs text-foreground/50">{t.topicName}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-foreground/30 group-hover:text-primary transition-colors" />
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={startTest} className="btn-secondary">
            <RotateCcw className="w-4 h-4" /> Retake Test
          </button>
          <Link to="/learn" className="btn-primary">
            Continue Learning
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
