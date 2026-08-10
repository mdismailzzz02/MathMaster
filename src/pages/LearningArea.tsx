import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { generateCustomTopic } from "../lib/groq";
import { getAllSubtopicMeta } from "../lib/quiz/core";
import ProgressRing from "../components/ProgressRing";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import {
  BookOpen,
  ChevronDown,
  FileText,
  ImagePlus,
  Loader2,
  PlayCircle,
  Sparkles,
  Wand2,
} from "lucide-react";

interface Subtopic {
  id: string;
  topic_id: string;
  name: string;
  slug: string;
  order: number;
  depth: "core" | "intermediate" | "advanced";
  created_at: string;
}

interface Topic {
  id: string;
  name: string;
  slug: string;
  color: string;
  order: number;
  created_at: string;
  subtopics: Subtopic[];
}

interface UserProgress {
  id: string;
  subtopic_id: string;
  status: "not_started" | "in_progress" | "mastered";
  updated_at: string;
}

const DEPTH_LABELS: Record<Subtopic["depth"], string> = {
  core: "Core",
  intermediate: "Int",
  advanced: "Adv",
};

const DEPTH_STYLES: Record<Subtopic["depth"], string> = {
  core: "bg-primary/10 text-primary",
  intermediate: "bg-accent/10 text-accent",
  advanced: "bg-purple-100 text-purple-700",
};

function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      </div>
      <div className="h-3 bg-muted rounded w-full" />
      <div className="h-3 bg-muted rounded w-4/5" />
    </div>
  );
}

export default function LearningArea() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [continueSubtopic, setContinueSubtopic] = useState<
    { subtopic: Subtopic; topic: Topic } | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Generate-topic modal state
  const [genOpen, setGenOpen] = useState(false);
  const [genMode, setGenMode] = useState<"text" | "image">("text");
  const [genText, setGenText] = useState("");
  const [genImage, setGenImage] = useState<string | null>(null);
  const [genFileName, setGenFileName] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setError(null);

    // ── Build built-in topics from local metadata (always available, no DB needed) ──
    const allMeta = getAllSubtopicMeta();
    const topicMap = new Map<string, Topic>();

    const TOPIC_COLORS: Record<string, string> = {
      "algebra-1": "#4A7CF7",
      "geometry":  "#22C55E",
      "algebra-2": "#A855F7",
      "calculus":  "#F59E0B",
    };

    allMeta.forEach((meta, i) => {
      if (!topicMap.has(meta.topicSlug)) {
        topicMap.set(meta.topicSlug, {
          id: `local-${meta.topicSlug}`,
          name: meta.topicName,
          slug: meta.topicSlug,
          color: TOPIC_COLORS[meta.topicSlug] ?? "#4A7CF7",
          order: topicMap.size,
          created_at: "",
          subtopics: [],
        });
      }
      const topic = topicMap.get(meta.topicSlug)!;
      topic.subtopics.push({
        id: `local-${meta.slug}`,
        topic_id: `local-${meta.topicSlug}`,
        name: meta.name,
        slug: meta.slug,
        order: i,
        depth: meta.depth,
        created_at: "",
      });
    });

    const localTopics = Array.from(topicMap.values());

    // ── Fetch any custom DB topics (user-generated via AI) ──
    const [{ data: dbTopicData }, { data: progData }] = await Promise.all([
      supabase
        .from("topics")
        .select("*, subtopics(*)")
        .order("order")
        .order("order", { referencedTable: "subtopics" }),
      supabase.from("user_progress").select("*").eq("user_id", user.id),
    ]);

    // Load any custom topics saved in localStorage
    const localCustomTopicsStr = localStorage.getItem("custom_topics");
    const localCustomTopics: Topic[] = localCustomTopicsStr ? JSON.parse(localCustomTopicsStr) : [];

    // Merge: built-in topics first, then local custom topics, then any DB topics that aren't already present
    const dbTopics = (dbTopicData as Topic[] | null) ?? [];
    const allTopics = [
      ...localTopics,
      ...localCustomTopics,
      ...dbTopics.filter((dt) => !topicMap.has(dt.slug) && !localCustomTopics.some(lt => lt.slug === dt.slug)),
    ];

    setTopics(allTopics);
    setProgress((progData as UserProgress[] | null) ?? []);

    // Continue where you left off (only for DB-tracked subtopics)
    const { data: cont } = await supabase
      .from("user_progress")
      .select("*, subtopics(*)")
      .eq("user_id", user.id)
      .eq("status", "in_progress")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cont?.subtopics) {
      const sub = cont.subtopics as Subtopic;
      const topic = allTopics.find((t) => t.id === sub.topic_id || t.subtopics.some(s => s.id === sub.id));
      if (topic) setContinueSubtopic({ subtopic: sub, topic });
    } else {
      setContinueSubtopic(null);
    }
  }, [user]);


  useEffect(() => {
    loadData();
  }, [loadData]);

  const progressBySubtopic = useMemo(() => {
    const map = new Map<string, UserProgress>();
    progress.forEach((p) => map.set(p.subtopic_id, p));
    return map;
  }, [progress]);

  const masteredCount = useCallback(
    (topicId: string) =>
      (topics ?? [])
        .find((t) => t.id === topicId)
        ?.subtopics.filter(
          (s) => progressBySubtopic.get(s.id)?.status === "mastered"
        ).length ?? 0,
    [topics, progressBySubtopic]
  );

  const topicStatus = useCallback(
    (subtopicId: string): "not_started" | "in_progress" | "mastered" =>
      progressBySubtopic.get(subtopicId)?.status ?? "not_started",
    [progressBySubtopic]
  );

  // ---- Image handling ----
  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setGenError("Please choose an image file (PNG, JPG, etc.).");
      return;
    }
    setGenError(null);
    setGenFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? result;
      setGenImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    setGenError(null);
    if (genMode === "text" && genText.trim().length < 10) {
      setGenError("Paste at least a sentence about the topic you want to learn.");
      return;
    }
    if (genMode === "image" && !genImage) {
      setGenError("Upload a screenshot of a math problem first.");
      return;
    }

    setGenLoading(true);
    try {
      const data = await generateCustomTopic({
        text: genMode === "text" ? genText.trim() : undefined,
        image: genMode === "image" && genImage ? genImage : undefined
      });
      
      const firstSub = data.subtopics?.[0];
      if (!firstSub) {
        setGenError("Your topic was created but has no subtopics yet.");
        setGenLoading(false);
        return;
      }
      
      // Save to localStorage so they don't need a DB migration immediately
      const newCustomTopic: Topic = {
        id: data.topic.id,
        name: data.topic.name,
        slug: data.topic.slug,
        color: data.topic.color,
        order: 99,
        created_at: new Date().toISOString(),
        subtopics: data.subtopics.map(sub => ({
          id: sub.id,
          topic_id: data.topic.id,
          name: sub.name,
          slug: sub.slug,
          depth: sub.depth as "core" | "intermediate" | "advanced",
          order: sub.order_index,
          created_at: new Date().toISOString()
        }))
      };

      const existingCustomStr = localStorage.getItem("custom_topics");
      const existingCustom: Topic[] = existingCustomStr ? JSON.parse(existingCustomStr) : [];
      existingCustom.push(newCustomTopic);
      localStorage.setItem("custom_topics", JSON.stringify(existingCustom));
      
      // Attempt DB insert anyway in case they did run the migration
      if (user) {
        supabase.from("topics").insert({
          id: data.topic.id.replace('local-', ''),
          name: data.topic.name,
          slug: data.topic.slug,
          color: data.topic.color,
          order: 99,
          user_id: user.id
        }).then(({ error: topicErr }) => {
          if (!topicErr) {
            const subsToInsert = data.subtopics.map(sub => ({
              id: sub.id.replace('local-', ''),
              topic_id: data.topic.id.replace('local-', ''),
              name: sub.name,
              slug: sub.slug,
              depth: sub.depth,
              order: sub.order_index,
              user_id: user.id
            }));
            supabase.from("subtopics").insert(subsToInsert).then();
          }
        });
      }
      
      // Refresh topics list
      loadData();
      
      setGenLoading(false);
      setGenOpen(false);
      setGenText("");
      setGenImage(null);
      setGenFileName("");
      
      // Navigate to the newly generated/saved topic
      navigate(`/learn/${data.topic.slug}/${firstSub.slug}`);
      
    } catch (err: any) {
      setGenLoading(false);
      setGenError(err.message || "Something went wrong generating your topic. Please try again.");
    }
  };

  if (error) {
    return (
      <div className="card p-8 text-center">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Something went wrong
        </h2>
        <p className="mt-2 text-foreground/60">{error}</p>
        <button onClick={loadData} className="btn-primary mt-5">
          Try again
        </button>
      </div>
    );
  }

  if (!topics) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded-lg w-1/2 animate-pulse" />
        <div className="grid gap-5 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Your Learning
          </h1>
          <p className="mt-1 text-foreground/60">
            Pick a subject and keep building your math skills.
          </p>
        </div>
        <button
          onClick={() => {
            setGenOpen(true);
            setGenError(null);
            setGenMode("text");
          }}
          className="btn-secondary"
        >
          <Wand2 className="w-4 h-4" aria-hidden="true" />
          Generate your own topic
        </button>
      </div>

      {/* Continue where you left off */}
      {continueSubtopic && (
        <Link
          to={`/learn/${continueSubtopic.topic.slug}/${continueSubtopic.subtopic.slug}`}
          className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow group"
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${continueSubtopic.topic.color}1A` }}
          >
            <PlayCircle
              className="w-6 h-6"
              style={{ color: continueSubtopic.topic.color }}
              aria-hidden="true"
            />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground/50 uppercase tracking-wide">
              Continue where you left off
            </p>
            <p className="font-heading font-bold text-foreground group-hover:text-primary transition-colors">
              {continueSubtopic.subtopic.name}
            </p>
            <p className="text-sm text-foreground/60">
              {continueSubtopic.topic.name}
            </p>
          </div>
          <ChevronDown className="w-5 h-5 text-foreground/40 -rotate-90 shrink-0" />
        </Link>
      )}

      {/* Topics grid */}
      {topics.length === 0 ? (
        <div className="card p-10 text-center">
          <BookOpen className="w-10 h-10 mx-auto text-foreground/30" aria-hidden="true" />
          <h2 className="mt-4 font-heading text-xl font-bold text-foreground">
            No topics yet
          </h2>
          <p className="mt-1 text-foreground/60">
            Click “Generate your own topic” to create your first custom topic.
          </p>
          <button
            onClick={() => setGenOpen(true)}
            className="btn-primary mt-5"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            Generate a topic
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 items-start">
          {topics.map((topic) => {
            const total = topic.subtopics.length;
            const mastered = masteredCount(topic.id);
            const percent = total === 0 ? 0 : (mastered / total) * 100;
            const isOpen = expandedId === topic.id;
            const inProgressCount = topic.subtopics.filter(
              (s) => topicStatus(s.id) === "in_progress"
            ).length;

            return (
              <div key={topic.id} className="card overflow-hidden">
                {/* Card header */}
                <button
                  onClick={() => setExpandedId(isOpen ? null : topic.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left p-5 flex items-center gap-4 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${topic.color}1A` }}
                  >
                    <BookOpen
                      className="w-6 h-6"
                      style={{ color: topic.color }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-lg font-bold text-foreground truncate">
                      {topic.name}
                    </h3>
                    <p className="text-sm text-foreground/60">
                      {mastered} of {total} mastered
                      {inProgressCount > 0 && ` · ${inProgressCount} in progress`}
                    </p>
                  </div>
                  <ProgressRing percent={percent} color={topic.color} size={52} />
                  <ChevronDown
                    className={`w-5 h-5 text-foreground/40 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {/* Subtopics */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.ul
                      key="subtopics"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden border-t border-border"
                    >
                      {topic.subtopics.map((sub) => {
                        const status = topicStatus(sub.id);
                        return (
                          <li key={sub.id} className="border-b border-border last:border-b-0">
                            <Link
                              to={`/learn/${topic.slug}/${sub.slug}`}
                              className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors group"
                            >
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${DEPTH_STYLES[sub.depth]}`}
                              >
                                {DEPTH_LABELS[sub.depth]}
                              </span>
                              <span className="flex-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {sub.name}
                              </span>
                              <StatusBadge status={status} />
                            </Link>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Generate topic modal */}
      <Modal
        open={genOpen}
        onClose={() => {
          if (!genLoading) setGenOpen(false);
        }}
        title="Generate your own topic"
      >
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
            <button
              type="button"
              onClick={() => setGenMode("text")}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                genMode === "text"
                  ? "bg-card shadow-sm text-primary"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              Paste text
            </button>
            <button
              type="button"
              onClick={() => setGenMode("image")}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                genMode === "image"
                  ? "bg-card shadow-sm text-primary"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              <ImagePlus className="w-4 h-4" aria-hidden="true" />
              Upload screenshot
            </button>
          </div>

          {genMode === "text" ? (
            <div>
              <label
                htmlFor="gen-topic-text"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Paste text about the math topic you want to learn
              </label>
              <textarea
                id="gen-topic-text"
                value={genText}
                onChange={(e) => setGenText(e.target.value)}
                rows={5}
                placeholder="e.g. I need help with quadratic equations — factoring, the quadratic formula, and graphing parabolas…"
                className="input-base resize-none"
              />
            </div>
          ) : (
            <div>
              <span className="block text-sm font-medium text-foreground mb-1.5">
                Upload a screenshot of a math problem
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0])}
                id="gen-topic-file"
              />
              <label
                htmlFor="gen-topic-file"
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl px-4 py-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                {genImage ? (
                  <>
                    <img
                      src={`data:image/jpeg;base64,${genImage}`}
                      alt="Uploaded math problem"
                      className="max-h-40 rounded-lg shadow-sm"
                    />
                    <span className="text-xs text-foreground/50">
                      {genFileName} — click to replace
                    </span>
                  </>
                ) : (
                  <>
                    <ImagePlus
                      className="w-8 h-8 text-foreground/30"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-foreground/60">
                      Click to choose a screenshot
                    </span>
                    <span className="text-xs text-foreground/40">
                      PNG, JPG or WebP
                    </span>
                  </>
                )}
              </label>
            </div>
          )}

          {genError && (
            <p role="alert" className="text-sm text-destructive font-medium">
              {genError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setGenOpen(false)}
              disabled={genLoading}
              className="btn-secondary disabled:opacity-50 disabled:pointer-events-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={genLoading}
              className="btn-primary"
            >
              {genLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {genLoading ? "Generating…" : "Generate topic"}
            </button>
          </div>

          {genLoading && (
            <p className="flex items-center gap-2 text-sm text-foreground/60">
              <Sparkles className="w-4 h-4 text-accent animate-pulse" aria-hidden="true" />
              Creating your topic and study guides — this takes a few seconds…
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
