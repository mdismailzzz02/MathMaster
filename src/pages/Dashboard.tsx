import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import ProgressRing from "../components/ProgressRing";
import {
  Award,
  BookOpen,
  Clock,
  Flame,
  Star,
  Target,
  Trophy,
  TrendingUp,
  Zap,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────
interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  xp_total: number;
  level: number;
}

interface TopicProgress {
  topic_name: string;
  topic_color: string;
  topic_slug: string;
  total: number;
  mastered: number;
  in_progress: number;
}

interface RecentAttempt {
  id: string;
  score: number;
  total: number;
  passed: boolean;
  duration_seconds: number | null;
  created_at: string;
  subtopic_name: string;
  topic_name: string;
  topic_color: string;
}

interface BadgeInfo {
  slug: string;
  earned_at: string;
}

// ── Badge metadata ───────────────────────────────────────
const BADGE_META: Record<string, { label: string; emoji: string; desc: string; color: string }> = {
  first_mastery:      { label: "First Mastery",    emoji: "🎓", desc: "Mastered your first subtopic",           color: "#4A7CF7" },
  perfect_score:      { label: "Perfect Score",    emoji: "💯", desc: "Scored 100% on a quiz",                  color: "#22C55E" },
  "7_day_streak":     { label: "7-Day Streak",     emoji: "🔥", desc: "Studied 7 days in a row",               color: "#FF4500" },
  speed_demon:        { label: "Speed Demon",       emoji: "⚡", desc: "Finished a quiz at lightning speed",    color: "#F59E0B" },
  comeback_kid:       { label: "Comeback Kid",      emoji: "💪", desc: "Passed after a prior failed attempt",   color: "#A855F7" },
  conqueror_algebra_1:{ label: "Algebra Conqueror", emoji: "👑", desc: "Mastered all core Algebra 1 topics",   color: "#4A7CF7" },
  conqueror_geometry: { label: "Geo Conqueror",     emoji: "📐", desc: "Mastered all core Geometry topics",    color: "#22C55E" },
  conqueror_algebra_2:{ label: "Alg 2 Conqueror",  emoji: "🧠", desc: "Mastered all core Algebra 2 topics",   color: "#A855F7" },
  conqueror_calculus: { label: "Calc Conqueror",    emoji: "∫",  desc: "Mastered all core Calculus topics",    color: "#F59E0B" },
};

// ── XP helpers ───────────────────────────────────────────
function xpForLevel(lvl: number) { return 50 * lvl * lvl; }
function xpProgress(xp: number, level: number) {
  const start = xpForLevel(level);
  const next  = xpForLevel(level + 1);
  if (next <= start) return 100;
  return Math.min(((xp - start) / (next - start)) * 100, 100);
}

// ── Skeleton ─────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-xl ${className ?? ""}`} />;
}

// ── StatCard ─────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color ?? "#4A7CF7"}1A` }}
      >
        <span style={{ color: color ?? "#4A7CF7" }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-medium text-foreground/50 uppercase tracking-wide">{label}</p>
        <p className="font-heading text-2xl font-bold text-foreground leading-tight">{value}</p>
        {sub && <p className="text-xs text-foreground/50 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();

  const [streak, setStreak]         = useState<StreakData | null>(null);
  const [topics, setTopics]         = useState<TopicProgress[] | null>(null);
  const [recent, setRecent]         = useState<RecentAttempt[] | null>(null);
  const [badges, setBadges]         = useState<BadgeInfo[] | null>(null);
  const [username, setUsername]     = useState<string>("");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setError(null);

    try {
      const [
        { data: streakData },
        { data: progressData },
        { data: recentData },
        { data: badgeData },
        { data: userData },
      ] = await Promise.all([
        supabase.from("user_streaks").select("*").eq("user_id", user.id).single(),
        supabase
          .from("user_progress")
          .select("status, subtopics(id, depth, topic_id, topics(name, slug, color))")
          .eq("user_id", user.id),
        supabase
          .from("quiz_attempts")
          .select("id, score, total, passed, duration_seconds, created_at, subtopics(name, topics(name, color))")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("user_badges")
          .select("badge_slug, earned_at")
          .eq("user_id", user.id)
          .order("earned_at", { ascending: false }),
        supabase.from("users").select("username").eq("id", user.id).single(),
      ]);

      setStreak(streakData ?? { current_streak: 0, longest_streak: 0, last_active_date: null, xp_total: 0, level: 0 });
      setUsername(userData?.username ?? "");

      // Build per-topic summary
      const topicMap = new Map<string, TopicProgress>();
      (progressData ?? []).forEach((p: any) => {
        const sub   = p.subtopics as any;
        const topic = sub?.topics as any;
        if (!topic) return;
        const key = topic.slug;
        if (!topicMap.has(key)) {
          topicMap.set(key, { topic_name: topic.name, topic_color: topic.color, topic_slug: topic.slug, total: 0, mastered: 0, in_progress: 0 });
        }
        const entry = topicMap.get(key)!;
        entry.total++;
        if (p.status === "mastered")    entry.mastered++;
        if (p.status === "in_progress") entry.in_progress++;
      });
      setTopics(Array.from(topicMap.values()));

      // Recent attempts
      const mapped: RecentAttempt[] = (recentData ?? []).map((a: any) => ({
        id: a.id,
        score: a.score,
        total: a.total,
        passed: a.passed,
        duration_seconds: a.duration_seconds,
        created_at: a.created_at,
        subtopic_name: a.subtopics?.name ?? "Quiz",
        topic_name:    a.subtopics?.topics?.name ?? "",
        topic_color:   a.subtopics?.topics?.color ?? "#4A7CF7",
      }));
      setRecent(mapped);

      setBadges((badgeData ?? []).map((b: any) => ({ slug: b.badge_slug, earned_at: b.earned_at })));
    } catch {
      setError("Couldn't load your dashboard. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // ── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-10 text-center">
        <p className="text-destructive font-medium">{error}</p>
        <button onClick={loadDashboard} className="btn-primary mt-4">Retry</button>
      </div>
    );
  }

  const level   = streak?.level ?? 0;
  const xp      = streak?.xp_total ?? 0;
  const prog    = xpProgress(xp, level);
  const xpToNext = xpForLevel(level + 1) - xp;

  const totalTopicsStudied = topics?.length ?? 0;
  const totalMastered      = topics?.reduce((s, t) => s + t.mastered, 0) ?? 0;
  const totalSubtopics     = topics?.reduce((s, t) => s + t.total, 0) ?? 0;

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          {username ? `Hey, ${username}! 👋` : "Your Dashboard"}
        </h1>
        <p className="mt-1 text-foreground/60">Here's how your math journey is going.</p>
      </motion.div>

      {/* ── Stat cards ── */}
      <motion.div
        className="grid gap-4 grid-cols-2 sm:grid-cols-4"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
      >
        {[
          { icon: <Flame className="w-5 h-5" />, label: "Current Streak", value: `${streak?.current_streak ?? 0}d`, sub: `Best: ${streak?.longest_streak ?? 0} days`, color: "#FF4500" },
          { icon: <Zap className="w-5 h-5" />,   label: "Total XP",        value: `${xp.toLocaleString()}`, sub: `Level ${level}`, color: "#FFD700" },
          { icon: <Star className="w-5 h-5" />,  label: "Mastered",        value: totalMastered, sub: `of ${totalSubtopics} subtopics`, color: "#22C55E" },
          { icon: <Trophy className="w-5 h-5" />,label: "Badges",          value: badges?.length ?? 0, sub: "earned", color: "#A855F7" },
        ].map((s, i) => (
          <motion.div key={i} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Level / XP Bar ── */}
      <motion.div className="card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-heading font-bold text-sm">
              {level}
            </span>
            <span className="font-heading font-semibold text-foreground">Level {level}</span>
          </div>
          <span className="text-sm text-foreground/60 font-medium">{xpToNext} XP to Level {level + 1}</span>
        </div>
        <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"
            initial={{ width: 0 }}
            animate={{ width: `${prog}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          />
        </div>
        <p className="mt-2 text-xs text-foreground/40 text-right">{xp.toLocaleString()} / {xpForLevel(level + 1).toLocaleString()} XP</p>
      </motion.div>

      {/* ── Topic Progress ── */}
      {(topics?.length ?? 0) > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> Topic Progress
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {topics!.map((t, i) => {
              const pct = t.total === 0 ? 0 : (t.mastered / t.total) * 100;
              return (
                <motion.div
                  key={t.topic_slug}
                  className="card p-4 flex items-center gap-4"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <ProgressRing percent={pct} color={t.topic_color} size={56} />
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-foreground truncate">{t.topic_name}</p>
                    <p className="text-sm text-foreground/60">{t.mastered} of {t.total} mastered</p>
                    {t.in_progress > 0 && (
                      <p className="text-xs text-accent font-medium mt-0.5">{t.in_progress} in progress</p>
                    )}
                  </div>
                  <Link
                    to={`/learn`}
                    className="text-xs font-semibold text-primary hover:underline shrink-0"
                  >
                    Study →
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Recent Quizzes ── */}
      {(recent?.length ?? 0) > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Recent Quizzes
          </h2>
          <div className="card overflow-hidden divide-y divide-border">
            {recent!.map((a) => {
              const pct = Math.round((a.score / a.total) * 100);
              const mins = a.duration_seconds ? Math.floor(a.duration_seconds / 60) : null;
              const secs = a.duration_seconds ? a.duration_seconds % 60 : null;
              return (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: a.passed ? "#22C55E" : "#EF4444" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.subtopic_name}</p>
                    <p className="text-xs text-foreground/50">{a.topic_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="text-sm font-heading font-bold"
                      style={{ color: a.passed ? "#22C55E" : "#EF4444" }}
                    >
                      {pct}%
                    </p>
                    {mins !== null && (
                      <p className="text-xs text-foreground/40 flex items-center gap-0.5 justify-end">
                        <Clock className="w-3 h-3" />
                        {mins}m {secs}s
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Badges ── */}
      {(badges?.length ?? 0) > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> Badges Earned
          </h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {badges!.map((b, i) => {
              const meta = BADGE_META[b.slug] ?? { label: b.slug, emoji: "🏅", desc: "", color: "#4A7CF7" };
              return (
                <motion.div
                  key={b.slug}
                  className="card p-4 flex flex-col items-center text-center gap-2"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * i, type: "spring", stiffness: 260, damping: 20 }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${meta.color}1A` }}
                  >
                    {meta.emoji}
                  </div>
                  <p className="font-heading font-bold text-sm text-foreground leading-tight">{meta.label}</p>
                  <p className="text-xs text-foreground/50">{meta.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Empty state ── */}
      {totalSubtopics === 0 && (recent?.length ?? 0) === 0 && (
        <div className="card p-10 text-center">
          <Target className="w-12 h-12 mx-auto text-foreground/20 mb-4" />
          <h3 className="font-heading text-xl font-bold text-foreground">Nothing here yet</h3>
          <p className="mt-1 text-foreground/60">Complete your first quiz to start tracking your progress!</p>
          <Link to="/learn" className="btn-primary mt-5 inline-flex">
            Start Learning
          </Link>
        </div>
      )}
    </div>
  );
}
