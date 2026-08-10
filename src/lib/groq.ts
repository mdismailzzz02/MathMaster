/**
 * Groq API client — calls Groq directly from the browser using the key
 * stored in VITE_GROQ_API_KEY (set in your .env file).
 *
 * Uses the llama-3.3-70b-versatile model which is fast and free on Groq.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

function getApiKey(): string {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key || key === "your_groq_api_key_here") {
    throw new Error(
      "VITE_GROQ_API_KEY is not set. Please add your Groq API key to the .env file."
    );
  }
  return key;
}

async function groqChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error (${res.status}): ${err}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

/**
 * Robust JSON extractor for LLM responses that might contain markdown formatting
 * or conversational text before/after the JSON.
 */
function extractJson(raw: string): any {
  let cleaned = raw.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    const lines = cleaned.split("\n");
    if (lines.length >= 2) {
      lines.shift(); // remove opening ```
      if (lines[lines.length - 1].trim().startsWith("```")) {
        lines.pop(); // remove closing ```
      }
      cleaned = lines.join("\n").trim();
    }
  }

  // Find the first { or [ and last } or ]
  const startObj = cleaned.indexOf("{");
  const startArr = cleaned.indexOf("[");
  let startIndex = -1;
  let isArray = false;

  if (startObj !== -1 && startArr !== -1) {
    if (startObj < startArr) { startIndex = startObj; }
    else { startIndex = startArr; isArray = true; }
  } else if (startObj !== -1) {
    startIndex = startObj;
  } else if (startArr !== -1) {
    startIndex = startArr;
    isArray = true;
  }

  if (startIndex === -1) {
    return JSON.parse(cleaned);
  }

  const endChar = isArray ? "]" : "}";
  const endIndex = cleaned.lastIndexOf(endChar);

  if (endIndex > startIndex) {
    cleaned = cleaned.slice(startIndex, endIndex + 1);
  }

  return JSON.parse(cleaned);
}

// ─── Groq API Client (Streaming) ──────────────────────────────────────────────
export async function streamGroqChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
  signal: AbortSignal,
  opts?: { temperature?: number; maxTokens?: number }
) {
  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: opts?.temperature ?? 0.7,
        max_tokens: opts?.maxTokens ?? 1024,
        stream: true,
      }),
      signal,
    });

    if (!res.ok) {
      const err = await res.text();
      onError(`Groq API error (${res.status}): ${err}`);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      onError("No response stream");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(payload);
          const chunk = parsed.choices?.[0]?.delta?.content;
          if (chunk) onChunk(chunk);
        } catch {
          // ignore incomplete JSON
        }
      }
    }
    onDone();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
    onError(err instanceof Error ? err.message : "Stream error");
  }
}

// ─── AI Coach: explain mistakes after a quiz ─────────────────────────────────
export async function explainMistakes(opts: {
  subtopic: string;
  difficulty: string;
  mistakes: Array<{
    question: string;
    correctAnswer: string;
    explanation: string;
  }>;
  totalScore: number;
  totalQuestions: number;
}): Promise<string> {
  const { subtopic, difficulty, mistakes, totalScore, totalQuestions } = opts;

  const mistakeText = mistakes
    .map(
      (m, i) =>
        `${i + 1}. Question: "${m.question}"\n   Correct answer: ${m.correctAnswer}\n   Explanation: ${m.explanation}`
    )
    .join("\n\n");

  const messages = [
    {
      role: "system" as const,
      content:
        "You are a friendly, encouraging math tutor. Give concise, specific feedback (2–4 sentences) to help a student understand their mistakes. Be warm, not harsh. Always end with an encouraging note.",
    },
    {
      role: "user" as const,
      content: `The student scored ${totalScore}/${totalQuestions} on a ${difficulty} quiz about "${subtopic}".

Their mistakes were:
${mistakeText}

Give them brief, helpful feedback on what they got wrong and how to improve.`,
    },
  ];

  return groqChat(messages, { temperature: 0.6, maxTokens: 512 });
}

// ─── Study Guide: generate study content for a subtopic ──────────────────────
export async function generateStudyContent(opts: {
  subtopicId: string;
  subtopicName: string;
  topicName: string;
  depth: string;
}): Promise<{
  studyGuide: { id: string; subtopic_id: string; content: string };
  videoLinks: Array<{ title: string; url: string; thumbnail?: string }>;
}> {
  const { subtopicId, subtopicName, topicName, depth } = opts;

  const depthLabel =
    depth === "core" ? "beginner" : depth === "intermediate" ? "intermediate" : "advanced";

  const messages = [
    {
      role: "system" as const,
      content:
        "You are an expert curriculum writer and educational content creator for a multi-subject student learning app. Generate comprehensive study notes, summaries, or lesson modules for any given subject (e.g., Mathematics, History, Literature, Science) following this strict structural and formatting standard.\n\n" +
        "### Structure Requirements:\n" +
        "1. **Introduction (1-2 paragraphs):** Define the topic, context, historical background, or core significance.\n" +
        "2. **Core Concepts / Breakdown:** Break down the topic into logical thematic or chronological subheadings (`###`). Use bullet points for key attributes, dates, characters, formulas, or theorems.\n" +
        "3. **Worked Examples / Case Studies:** \n" +
        "   - For STEM: Provide step-by-step problem breakdowns (Given, Formula, Solution).\n" +
        "   - For Humanities/Arts/Languages: Provide textual analysis, case studies, or contextual breakdowns.\n" +
        "4. **Summary / Quick Reference Table:** Use a clean Markdown table to contrast key terms, dates, formulas, or historical figures.\n" +
        "5. **Actionable Study Tips:** Provide 3-5 concise bullet points advising students on how to memorize, analyze, or practice the concept.\n\n" +
        "### Formatting Rules:\n" +
        "- **Never** output raw, broken symbols or unformatted math/linguistic symbols. Use proper Markdown tables.\n" +
        "- For mathematics, science, or formal logic, use standard LaTeX enclosed in single dollar signs ($) for inline math and double dollar signs ($$) for standalone equations.\n" +
        "- Keep paragraphs short (maximum 3-4 sentences) to ensure high readability on mobile and desktop app screens.\n" +
        "- Use bolding (`**text**`) judiciously to highlight key vocabulary terms on first mention.",
    },
    {
      role: "user" as const,
      content: `Please generate a comprehensive study guide for "${subtopicName}" (part of the subject/topic: ${topicName}) at the ${depthLabel} level. Ensure it strictly follows the requested structure and formatting rules.`,
    },
  ];

  const raw = await groqChat(messages, { temperature: 0.5, maxTokens: 2048 });

  return {
    studyGuide: {
      id: `local-${subtopicId}`,
      subtopic_id: subtopicId,
      content: raw.trim(),
    },
    videoLinks: [],
  };
}

// ─── Custom Topic: generate a topic + subtopics from user input ───────────────
export async function generateCustomTopic(opts: {
  text?: string;
  image?: string;
}): Promise<{
  topic: {
    id: string;
    name: string;
    slug: string;
    description: string;
    color: string;
  };
  subtopics: Array<{
    id: string;
    topic_id: string;
    name: string;
    slug: string;
    depth: string;
    order_index: number;
  }>;
}> {
  const prompt = opts.text
    ? `The user wants to learn about: "${opts.text}"`
    : "The user uploaded a math problem image and wants to learn the underlying concept.";

  const messages = [
    {
      role: "system" as const,
      content:
        "You are a math curriculum designer. Create a focused math topic with subtopics based on user input. Return ONLY valid JSON, no extra text.",
    },
    {
      role: "user" as const,
      content: `${prompt}

Create a math learning topic with 3-5 subtopics. Return ONLY this JSON structure:
{
  "topic": {
    "name": "string",
    "slug": "lowercase-hyphenated-slug",
    "description": "string — 1-2 sentences",
    "color": "#hexcolor"
  },
  "subtopics": [
    {
      "name": "string",
      "slug": "lowercase-hyphenated-slug",
      "depth": "core" | "intermediate" | "advanced",
      "order_index": 0
    }
  ]
}`,
    },
  ];

  const raw = await groqChat(messages, { temperature: 0.6, maxTokens: 1024 });

  let parsed: any;
  try {
    parsed = extractJson(raw);
  } catch {
    throw new Error("Failed to parse AI response as a topic. Please try again.");
  }

  const topicId = `custom-${Date.now()}`;
  const topic = {
    id: topicId,
    name: parsed.topic?.name ?? "Custom Topic",
    slug: parsed.topic?.slug ?? `custom-${Date.now()}`,
    description: parsed.topic?.description ?? "",
    color: parsed.topic?.color ?? "#6366F1",
  };

  const subtopics = (parsed.subtopics ?? []).map((s: any, i: number) => ({
    id: `custom-sub-${Date.now()}-${i}`,
    topic_id: topicId,
    name: s.name ?? `Subtopic ${i + 1}`,
    slug: s.slug ?? `subtopic-${i + 1}`,
    depth: s.depth ?? "core",
    order_index: s.order_index ?? i,
  }));

  return { topic, subtopics };
}

// ─── Quiz Generator: generate MCQ questions for any subtopic via Groq ─────────
export async function generateQuizQuestions(opts: {
  subtopicName: string;
  topicName: string;
  depth: string;
  count: number;
}): Promise<Array<{
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}>> {
  const { subtopicName, topicName, depth, count } = opts;

  const depthLabel =
    depth === "core" ? "beginner" : depth === "intermediate" ? "intermediate" : "advanced";

  const messages = [
    {
      role: "system" as const,
      content:
        "You are an expert math question writer. Generate multiple-choice questions in valid JSON. Return ONLY the JSON array — no extra text, no markdown fences.",
    },
    {
      role: "user" as const,
      content: `Generate exactly ${count} multiple-choice math questions about "${subtopicName}" (part of ${topicName}) at the ${depthLabel} level.

Return ONLY a JSON array with this exact structure:
[
  {
    "question": "string — the question text",
    "options": ["A text", "B text", "C text", "D text"],
    "correctIndex": 0,
    "explanation": "string — brief explanation of the correct answer"
  }
]

Rules:
- Each question must have exactly 4 options
- correctIndex is 0-based (0=A, 1=B, 2=C, 3=D)
- Questions must be mathematically accurate
- Vary the question styles (solve, find, identify, calculate)
- Difficulty should match the ${depthLabel} level
- Do NOT include labels like "A)" in the options array`,
    },
  ];

  const raw = await groqChat(messages, { temperature: 0.7, maxTokens: 4096 });

  let parsed: any[];
  try {
    parsed = extractJson(raw);
  } catch {
    throw new Error("Failed to parse AI-generated questions. Please try again.");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("AI returned no questions. Please try again.");
  }

  // Validate and clamp each item
  return parsed.slice(0, count).map((q: any, i: number) => ({
    question: q.question ?? `Question ${i + 1}`,
    options: Array.isArray(q.options) && q.options.length === 4
      ? q.options
      : ["Option A", "Option B", "Option C", "Option D"],
    correctIndex: typeof q.correctIndex === "number" ? Math.min(3, Math.max(0, q.correctIndex)) : 0,
    explanation: q.explanation ?? "See your study guide for details.",
  }));
}
