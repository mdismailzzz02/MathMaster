import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import Header from "./components/Header";
import LoadingScreen from "./components/LoadingScreen";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const LearningArea = lazy(() => import("./pages/LearningArea"));
const StudyView = lazy(() => import("./pages/StudyView"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MasteryTest = lazy(() => import("./pages/MasteryTest"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Settings    = lazy(() => import("./pages/Settings"));

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Root → /learn */}
            <Route path="/" element={<Navigate to="/learn" replace />} />

            {/* Public */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected pages with shell */}
            <Route
              path="/learn"
              element={
                <ProtectedRoute>
                  <PageShell>
                    <LearningArea />
                  </PageShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/learn/:topic/:subtopic"
              element={
                <ProtectedRoute>
                  <PageShell>
                    <StudyView />
                  </PageShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:topic/:subtopic"
              element={
                <ProtectedRoute>
                  <PageShell>
                    <QuizPage />
                  </PageShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <PageShell>
                    <Dashboard />
                  </PageShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mastery-test"
              element={
                <ProtectedRoute>
                  <PageShell>
                    <MasteryTest />
                  </PageShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <PageShell>
                    <Leaderboard />
                  </PageShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <PageShell>
                    <Settings />
                  </PageShell>
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/learn" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
