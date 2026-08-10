import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import StudyGuideRenderer from "../components/StudyGuideRenderer";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { generateStudyContent } from "../lib/groq";
import { searchYouTubeVideos, type YouTubeVideo } from "../lib/youtube";
import ChatPanel from "../components/ChatPanel";
import { SiYoutube } from "react-icons/si";
import {
  ArrowLeft,
  Lightbulb,
  Loader2,
  MessageSquare,
  RefreshCw,
  X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────
export interface Topic {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export interface Subtopic {
  id: string;
  topic_id: string;
  name: string;
  slug: string;
  depth: "core" | "intermediate" | "advanced";
  topics: Topic;
}

export interface StudyGuide {
  id: string;
  subtopic_id: string;
  content: string;
  generated_at: string;
  model: string | null;
}

export interface VideoLink {
  id: string;
  subtopic_id: string;
  video_id: string;
  title: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  order: number;
}

// ─── StudyView ─────────────────────────────────────────
export default function StudyView() {
  const { topic: topicSlug, subtopic: subtopicSlug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subtopic, setSubtopic] = useState<Subtopic | null>(null);
  const [studyGuide, setStudyGuide] = useState<StudyGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // YouTube videos
  const [ytVideos, setYtVideos] = useState<YouTubeVideo[]>([]);
  const [ytLoading, setYtLoading] = useState(false);

  // Video modal
  const [videoModalId, setVideoModalId] = useState<string | null>(null);

  // Chat panel
  const [chatOpen, setChatOpen] = useState(false);

  // Quiz config
  const [quizDifficulty, setQuizDifficulty] = useState<
    "core" | "intermediate" | "advanced"
  >("core");
  const [quizCount, setQuizCount] = useState(10);
  const [quizPass, setQuizPass] = useState(80);

  // ─── Slug → human name helper ──────────────────────────────────────
  const slugToName = (slug: string) =>
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  // ─── YouTube Video Fetcher ─────────────────────────────────────────────
  const fetchYouTubeVideos = async (query: string, saveToSubtopicId: string | null = null) => {
    // Try to load from localStorage first
    if (saveToSubtopicId) {
      const cached = localStorage.getItem(`yt_videos_${saveToSubtopicId}`);
      if (cached) {
        try {
          setYtVideos(JSON.parse(cached));
          return;
        } catch(e) {}
      }
    }

    setYtLoading(true);
    try {
      const vids = await searchYouTubeVideos(query, 4);
      setYtVideos(vids);
      
      // Save videos to localStorage and DB
      if (saveToSubtopicId) {
        localStorage.setItem(`yt_videos_${saveToSubtopicId}`, JSON.stringify(vids));
        
        const vidLinksToInsert = vids.map((v, idx) => ({
          subtopic_id: saveToSubtopicId,
          video_id: v.videoId,
          title: v.title,
          channel_title: v.channelTitle,
          thumbnail_url: v.thumbnailUrl,
          order: idx
        }));
        // We still try DB for backup/sync if they did run the migration
        supabase.from("video_links").insert(vidLinksToInsert).then();
      }
    } catch (e) {
      console.warn("YouTube search failed:", e);
    } finally {
      setYtLoading(false);
    }
  };

  // ─── Load content ──────────────────────────────────────────────────
  const loadContent = useCallback(async () => {
    if (!topicSlug || !subtopicSlug || !user) return;
    setLoading(true);
    setGenError(null);

    // 1. Try to load subtopic from DB
    let resolvedSubtopic: Subtopic | null = null;
    const { data: sub } = await supabase
      .from("subtopics")
      .select("*, topics!inner(*)")
      .eq("topics.slug", topicSlug)
      .eq("slug", subtopicSlug)
      .maybeSingle();

    if (sub) {
      resolvedSubtopic = sub as unknown as Subtopic;
    } else {
      // 2. Not in DB — construct a synthetic subtopic from the URL slugs
      resolvedSubtopic = {
        id: `local-${subtopicSlug}`,
        topic_id: `local-${topicSlug}`,
        name: slugToName(subtopicSlug),
        slug: subtopicSlug,
        depth: "core",
        topics: {
          id: `local-${topicSlug}`,
          name: slugToName(topicSlug),
          slug: topicSlug,
          color: "#4A7CF7",
        },
      };
    }

    setSubtopic(resolvedSubtopic);
    setQuizDifficulty(resolvedSubtopic.depth ?? "core");

    // 3. Try to load cached study guide from localStorage first
    const cachedGuide = localStorage.getItem(`study_guide_${resolvedSubtopic.id}`);
    if (cachedGuide) {
      try {
        const parsed = JSON.parse(cachedGuide);
        setStudyGuide(parsed);
        setLoading(false);
        fetchYouTubeVideos(`${resolvedSubtopic.name} ${resolvedSubtopic.topics?.name ?? ""}`, resolvedSubtopic.id);
        return;
      } catch(e) {}
    }

    // 4. Try to load cached study guide from DB
    if (!resolvedSubtopic.id.startsWith("local-")) {
      const [{ data: guide }] = await Promise.all([
        supabase
          .from("study_guides")
          .select("*")
          .eq("subtopic_id", resolvedSubtopic.id)
          .maybeSingle(),
        supabase
          .from("video_links")
          .select("id")
          .eq("subtopic_id", resolvedSubtopic.id)
          .limit(1),
      ]);

      if (guide) {
        setStudyGuide(guide as StudyGuide);
        setLoading(false);
        // Save to local storage for faster subsequent loads
        localStorage.setItem(`study_guide_${resolvedSubtopic.id}`, JSON.stringify(guide));
        // Fetch YouTube videos even for cached guides
        fetchYouTubeVideos(`${resolvedSubtopic.name} ${resolvedSubtopic.topics?.name ?? ""}`, resolvedSubtopic.id);
        return;
      }
    }

    // 5. Generate content via Groq (always for local slugs, or when DB has no guide)
    setLoading(false);
    await generateContent(
      resolvedSubtopic.id,
      resolvedSubtopic.name,
      resolvedSubtopic.topics?.name ?? slugToName(topicSlug),
      resolvedSubtopic.depth ?? "core"
    );
  }, [topicSlug, subtopicSlug, user]);

  const generateContent = async (subtopicId: string, subtopicName: string, topicName: string, depth: string) => {
    setGenerating(true);
    setGenError(null);
    try {
      const data = await generateStudyContent({ subtopicId, subtopicName, topicName, depth });
      setStudyGuide(data.studyGuide as unknown as StudyGuide);
      
      // Save the generated guide to localStorage so we don't regenerate on refresh/back
      localStorage.setItem(`study_guide_${subtopicId}`, JSON.stringify(data.studyGuide));
      
      // Save the generated guide to the database if the user is authenticated and the subtopic isn't a temporary local one
      if (user && !subtopicId.startsWith('local-')) {
        supabase.from("study_guides").insert({
          subtopic_id: subtopicId,
          content: data.studyGuide.content,
          model: "groq-custom"
        }).then();
      }

      // Fetch YouTube videos in the background after guide loads
      fetchYouTubeVideos(`${subtopicName} ${topicName}`, subtopicId);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "We couldn't generate the study guide right now. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // ─── Adaptive recommendation ─────────────────────────
  const adaptiveRecommendation = useMemo(() => {
    if (!subtopic?.depth) return "";
    switch (subtopic.depth) {
      case "advanced":
        return "You're at the advanced level — challenge yourself with a full quiz!";
      case "intermediate":
        return "Building on your skills — Intermediate is a great place to test yourself.";
      default:
        return "Starting fresh — try Core questions to build confidence.";
    }
  }, [subtopic]);

  // ─── Loading state ───────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-5 bg-muted rounded w-40" />
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-muted rounded"
              style={{ width: `${70 + i * 5}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ─── Error (no guide at all) ─────────────────────────
  if (genError && !generating && !studyGuide) {
    return (
      <div className="card p-8 text-center">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Couldn't load content
        </h2>
        <p className="mt-2 text-foreground/60">{genError}</p>
        <div className="flex flex-wrap justify-center gap-3 mt-5">
          <button
            onClick={() => subtopic && generateContent(subtopic.id, subtopic.name, subtopic.topics?.name ?? "", subtopic.depth ?? "core")}
            className="btn-primary"
          >
            Try again
          </button>
          <Link to="/learn" className="btn-secondary">
            Back to topics
          </Link>
        </div>
      </div>
    );
  }

  const topicColor = subtopic?.topics?.color ?? "var(--color-primary)";

  return (
    <div className="relative">
      {/* ── Back link ── */}
      <Link
        to="/learn"
        className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        All topics
      </Link>

      {/* ── Subtopic header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: topicColor }}
          >
            {subtopic?.topics?.name}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <h1 className="font-heading text-3xl font-bold text-foreground">
              {subtopic?.name}
            </h1>
            {studyGuide && !generating && (
              <button
                onClick={() => subtopic && generateContent(subtopic.id, subtopic.name, subtopic.topics?.name ?? "", subtopic.depth ?? "core")}
                className="p-1.5 rounded-md text-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors"
                title="Regenerate Study Guide"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* ── Main column (always full width now) ── */}
        <div className="flex-1 min-w-0">
          {/* Generating skeleton */}
          {generating && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="font-heading font-semibold text-foreground">
                  Generating your study guide…
                </span>
              </div>
              <p className="text-sm text-foreground/60">
                This takes a moment while AI creates a structured lesson for you.
              </p>
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </div>
          )}

          {/* Study guide */}
          {studyGuide && !generating && (
            <div className="card p-6 sm:p-8 mb-6 [&_.katex-display]:my-4 [&_.katex-display]:bg-muted/30 [&_.katex-display]:py-3 [&_.katex-display]:rounded-xl [&_.katex]:text-base">
              <StudyGuideRenderer content={studyGuide.content} />
            </div>
          )}

          {/* Retry error */}
          {genError && !generating && !studyGuide && (
            <div className="card p-6 text-center">
              <p className="text-destructive mb-3">{genError}</p>
              <button
                onClick={() => subtopic && generateContent(subtopic.id, subtopic.name, subtopic.topics?.name ?? "", subtopic.depth ?? "core")}
                className="btn-primary"
              >
                Retry
              </button>
            </div>
          )}

          {/* ── YouTube Videos ── */}
          {(ytLoading || ytVideos.length > 0) && (
            <div className="mb-8">
              <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                  <SiYoutube className="w-3.5 h-3.5 text-white" />
                </span>
                Video Lessons
              </h2>
              {ytLoading ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="card overflow-hidden animate-pulse">
                      <div className="aspect-video bg-muted" />
                      <div className="p-3 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
                  {ytVideos.map((video) => (
                    <button
                      key={video.videoId}
                      onClick={() => setVideoModalId(video.videoId)}
                      className="card overflow-hidden text-left group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <div className="relative aspect-video bg-muted overflow-hidden">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <SiYoutube className="w-8 h-8 text-foreground/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                          <div className="w-14 h-14 rounded-full bg-card/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <SiYoutube className="w-7 h-7 text-red-600 ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                          {video.title}
                        </p>
                        {video.channelTitle && (
                          <p className="text-xs text-foreground/50 mt-1 flex items-center gap-1">
                            <SiYoutube className="w-3 h-3 text-red-500" />
                            {video.channelTitle}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Quiz config ── */}
          <div className="card p-6 mb-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              Quiz Settings
            </h2>
            <div className="space-y-5">
              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Difficulty
                </label>
                <div
                  className="flex gap-2"
                  role="radiogroup"
                  aria-label="Quiz difficulty"
                >
                  {(["core", "intermediate", "advanced"] as const).map((d) => (
                    <button
                      key={d}
                      role="radio"
                      aria-checked={quizDifficulty === d}
                      onClick={() => setQuizDifficulty(d)}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-heading font-semibold transition-all cursor-pointer ${
                        quizDifficulty === d
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-muted text-foreground/60 hover:bg-muted/80"
                      }`}
                    >
                      {d === "core"
                        ? "Core"
                        : d === "intermediate"
                          ? "Intermediate"
                          : "Advanced"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question count */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Questions
                </label>
                <div
                  className="flex gap-2"
                  role="radiogroup"
                  aria-label="Question count"
                >
                  {[5, 10, 15].map((n) => (
                    <button
                      key={n}
                      role="radio"
                      aria-checked={quizCount === n}
                      onClick={() => setQuizCount(n)}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-heading font-semibold transition-all cursor-pointer ${
                        quizCount === n
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-muted text-foreground/60 hover:bg-muted/80"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pass % slider */}
              <div>
                <label
                  htmlFor="quiz-pass"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Pass threshold: <strong>{quizPass}%</strong>
                </label>
                <input
                  id="quiz-pass"
                  type="range"
                  min={75}
                  max={100}
                  step={5}
                  value={quizPass}
                  onChange={(e) => setQuizPass(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-foreground/40 mt-0.5">
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Adaptive recommendation */}
              <div className="flex items-start gap-2 text-sm text-foreground/60 italic">
                <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
                <span>{adaptiveRecommendation}</span>
              </div>

              {/* Start Quiz */}
              <button
                onClick={() =>
                  navigate(
                    `/quiz/${topicSlug}/${subtopicSlug}?difficulty=${quizDifficulty}&count=${quizCount}&pass=${quizPass}`
                  )
                }
                className="btn-primary w-full"
              >
                Start Quiz
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── AI Tutor full-screen modal ── */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm"
            onClick={() => setChatOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-2xl h-[80vh] bg-card rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <ChatPanel
                subtopicId={subtopic?.id ?? null}
                subtopicName={subtopic?.name ?? null}
                onClose={() => setChatOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating chat toggle (when closed) ── */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
          aria-label="Open AI Tutor"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* ── YouTube video modal ── */}
      {videoModalId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setVideoModalId(null)}
        >
          <div
            className="relative w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setVideoModalId(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
              aria-label="Close video"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${videoModalId}?autoplay=1&rel=0`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
