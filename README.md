<div align="center">

# 📐 MathMaster

**An adaptive, AI-powered math learning platform — from Algebra 1 to Calculus.**

Built for the **AI Factory — Native.builder Hackathon** (lablab.ai × NativelyAI)

<a href="https://mathmaster-qvr6.onrender.com/">
  <img src="https://img.shields.io/badge/🚀_Live_Demo-mathmaster--qvr6.onrender.com-4A7CF7?style=for-the-badge&labelColor=1a1a1a" alt="Live Demo" />
</a>

<br/>

<sub><i>Unpolished original native.builder deployment: <a href="#">[ ]</a></i></sub>

<br/><br/>

[![Built with native.builder](https://img.shields.io/badge/Built_with-native.builder-6366F1?style=flat-square)](https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Postgres_%2B_Auth-3ECF8E?style=flat-square&logo=supabase)
![Groq](https://img.shields.io/badge/Groq-Llama_3.1-F55036?style=flat-square)

</div>

---

## 🎯 The Problem

Most online math practice tools fall into one of two traps: either they're **static question banks** that repeat the same handful of problems, or they're **generic AI chatbots** with no structured curriculum, no sense of mastery, and no memory of what a student has actually learned.

Students — especially self-learners and international students studying outside a traditional classroom — need a tool that:
- Gives **infinite, non-repeating practice** at the right difficulty level
- Tracks **real mastery**, not just "did you click submit"
- Explains **why** an answer was wrong, not just what the right answer is
- Keeps them coming back with genuine progress (streaks, XP, badges) rather than gimmicks

## 👤 Target User

**Self-directed math learners — high schoolers, college students, and adult learners preparing for exams (SAT/ACT, university entrance, re-skilling)** — who want a focused, structured practice environment rather than a general-purpose tutoring chatbot. It's also built with **international students** in mind, a group the creator works with directly as a coding/math instructor.

## 🔗 Live Demo

<div align="center">

### 👉 [**Try MathMaster Live**](https://mathmaster-qvr6.onrender.com/) 👈

</div>

> Sign up with any username (no email required) and jump straight into a topic — the fastest way to see the platform end-to-end.

---

## ✨ What It Does

| Feature | Description |
|---|---|
| 📚 **4 Full Subjects, 31 Subtopics** | Algebra 1, Algebra 2, Geometry, and Calculus, each broken into core → intermediate → advanced subtopics |
| 🎲 **Infinite Question Generation** | A seeded-PRNG question engine generates unlimited, unique, mathematically-verified practice problems per subtopic — no repeats, no static question bank |
| 🧩 **Mixed Question Types** | Multiple-choice, drag-to-order, and matching questions woven into every quiz |
| 🤖 **AI Study Guides** | Groq-powered LLM generates a full structured study guide (concepts, worked examples, formula tables, study tips) for any subtopic on demand |
| 🩺 **AI Mistake Coach** | After every quiz, an AI tutor reviews exactly what you got wrong and gives targeted, encouraging feedback |
| 🧪 **Custom Topics** | Type or photograph any math problem you're stuck on — AI generates a bespoke topic, subtopics, and quiz questions around it on the fly |
| 🏆 **Mastery Tracking & Gamification** | XP, levels, daily streaks, and 6 earnable badges (first mastery, perfect score, 7-day streak, topic conqueror, speed demon, comeback kid) — all computed server-side in Postgres, not faked on the client |
| 📊 **Dashboard & Leaderboard** | Visual progress tracking per subtopic plus an opt-in leaderboard to compare with other learners |
| 🔐 **Frictionless Auth** | Username + password sign-up with zero email verification friction (accounts are created pre-confirmed via a secure server-side edge function) |

---

## 🛠️ How native.builder Was Used

MathMaster was **built primarily using [native.builder](https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits)**, following the full idea → deployed product workflow the hackathon is built around:

1. **Idea → App generation** — Native.builder scaffolded the initial React + TypeScript application: routing, page shells, auth flow, and the overall project structure, from a plain-language description of MathMaster's concept.
2. **Backend & data modeling** — The Supabase schema (11 tables, RLS policies, and the quiz-attempt gamification trigger that computes XP/streaks/badges) was generated and iterated on through native.builder's backend/data workflow.
3. **AI workflow integration** — The Groq API integration (study guide generation, mistake coaching, custom topic + quiz generation) was wired up as an AI-powered workflow inside native.builder, connecting the app's UI to live LLM calls.
4. **Design & UX refinement** — The learning-area UI, quiz flow, dashboard, and gamification visuals were iteratively refined for look, feel, and usability directly through native.builder.
5. **Deployment** — The application was deployed and published to a public URL through native.builder's deploy step.

**On top of native.builder**, the finishing touches, deeper logic edge cases, and some hand-tuning of the deterministic quiz-generation math (ensuring every generated problem is mathematically correct and non-repeating) were done using **VS Code** — used specifically for AI-assisted coding and final polish once the native.builder-generated foundation was in place. This is reflected in the git history and the level of hand-written logic in `src/lib/quiz/`.

---

## 🧱 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Framer Motion, React Router
- **Backend / Data**: Supabase (Postgres, Auth, Row-Level Security, Edge Functions, Realtime)
- **AI**: Groq API (`llama-3.1-8b-instant`) for study guides, mistake coaching, and custom-topic/question generation
- **Math rendering**: KaTeX + `react-markdown` + `remark-math` / `rehype-katex`
- **Deployment**: Render (static site) — [live demo](https://mathmaster-qvr6.onrender.com/)

### External APIs / Services Used
- **Groq API** — LLM inference for all AI-generated content
- **Supabase** — Auth, Postgres database, Row-Level Security, and a server-side Edge Function for frictionless username-based signup
- **YouTube Data API** *(optional)* — supplementary video links per subtopic

---

## 🏗️ Architecture Overview

```
src/
├── pages/          # Route-level screens (Learn, Study, Quiz, Dashboard, Mastery Test, Leaderboard, Settings)
├── components/      # Reusable UI: quiz question types, AI chat panel, study guide renderer, progress rings
├── context/         # Auth context (Supabase-backed session state)
└── lib/
    ├── quiz/         # Seeded-PRNG deterministic question generators (Algebra 1/2, Geometry, Calculus)
    ├── groq.ts        # All Groq LLM API calls (study guides, coaching, custom topics)
    └── supabase.ts    # Supabase client + Edge Function bridge

supabase/
└── migrations/       # Full schema: 11 tables, RLS policies, and the gamification trigger (XP/streaks/badges)
```

Every built-in subtopic has a **deterministic, seeded question generator** — the same seed always reproduces the same question, but every quiz session uses a fresh seed, giving effectively unlimited unique practice without needing an LLM call for the core curriculum. AI is reserved for what it's actually good at: study guides, feedback, and open-ended custom topics.

---

## 🚀 Running Locally

```bash
git clone https://github.com/mdismailzzz02/MathMaster.git
cd MathMaster
npm install
cp .env.example .env   # add your Groq API key
npm run dev
```

---

## 🏆 Hackathon Submission

- **Event**: [AI Factory — Native.builder Hackathon](https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits) (lablab.ai × NativelyAI), August 3–10, 2026
- **Built primarily with**: native.builder
- **Finishing touches / AI-assisted coding**: VS Code
- **Live app**: [mathmaster-qvr6.onrender.com](https://mathmaster-qvr6.onrender.com/)
- **native.builder unpolished/original deployment**: see link at top of README

---

## 👨‍💻 Built By

| Field | Details |
|---|---|
| **Name** | [ ] |
| **Age / Grade** | [ ] |
| **Country** | [ ] |
| **School / Institution** | [ ] |
| **Team Name** | [ ] |
| **Role** | [ ] |
