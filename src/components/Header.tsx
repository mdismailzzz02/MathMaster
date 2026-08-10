import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Flame, LogOut, Settings, Zap, Moon, Sun } from "lucide-react";
import Logo from "./Logo";

interface StreakData {
  current_streak: number;
  xp_total: number;
  level: number;
}

const NAV_ITEMS = [
  { href: "/learn",        label: "Learn" },
  { href: "/dashboard",   label: "Dashboard" },
  { href: "/mastery-test", label: "Mastery Test" },
  { href: "/leaderboard", label: "Leaderboard" },
];

function xpProgress(xp: number, level: number): number {
  const xpStart = 50 * level * level;
  const xpNext = 50 * (level + 1) * (level + 1);
  if (xpNext <= xpStart) return 100;
  return ((xp - xpStart) / (xpNext - xpStart)) * 100;
}

export default function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [streaks, setStreaks] = useState<StreakData | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Initialize theme
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (saved === "dark" || (!saved && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  };

  const fetchStreaks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_streaks")
      .select("current_streak, xp_total, level")
      .eq("user_id", user.id)
      .single();
    if (data) setStreaks(data);
  }, [user]);

  useEffect(() => {
    fetchStreaks();
  }, [fetchStreaks, location.pathname]);

  // Listen for quiz-submitted custom event
  useEffect(() => {
    const handler = () => fetchStreaks();
    window.addEventListener("mathmaster:streaks-updated", handler);
    return () => window.removeEventListener("mathmaster:streaks-updated", handler);
  }, [fetchStreaks]);

  const level = streaks?.level ?? 0;
  const xp = streaks?.xp_total ?? 0;
  const progress = xpProgress(xp, level);

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <Link
          to="/learn"
          className="flex items-center gap-2 font-heading text-xl font-bold text-foreground hover:text-primary transition-colors shrink-0"
        >
          <Logo size={28} />
          MathMaster
        </Link>

        {/* Center: Nav */}
        <nav className="hidden sm:flex items-center gap-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "px-4 py-1.5 rounded-full bg-primary/10 text-primary font-heading font-semibold text-sm transition-colors"
                    : "px-4 py-1.5 rounded-full text-foreground/70 hover:text-foreground hover:bg-muted font-heading text-sm transition-colors"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Streak + XP + Level + Sign Out */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Streak */}
          {streaks && (
            <div className="flex items-center gap-1 text-sm">
              <Flame className="w-4 h-4 text-streak" aria-hidden="true" />
              <span className="font-heading font-bold text-streak">
                {streaks.current_streak}
              </span>
            </div>
          )}

          {/* XP Bar */}
          {streaks && (
            <div className="hidden xs:flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-foreground/70">
                <Zap className="w-3.5 h-3.5 text-xp" aria-hidden="true" />
                <span>{xp} XP</span>
              </div>
              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-xp to-yellow-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-foreground/40 hover:text-primary transition-colors rounded-lg hover:bg-muted"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Level badge */}
          {streaks && (
            <span className="inline-flex items-center justify-center min-w-[2rem] h-6 px-1.5 rounded-full bg-primary/10 text-primary font-heading font-bold text-xs">
              Lv{level}
            </span>
          )}

          {/* Settings */}
          <Link
            to="/settings"
            className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* Sign Out */}
          <button
            onClick={signOut}
            className="p-1.5 rounded-lg text-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <nav
        className="sm:hidden flex border-t border-border"
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "flex-1 text-center py-2 text-primary font-heading font-semibold text-xs border-b-2 border-primary"
                  : "flex-1 text-center py-2 text-foreground/60 font-heading text-xs border-b-2 border-transparent hover:text-foreground"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
