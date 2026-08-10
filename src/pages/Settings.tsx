import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import {
  Check,
  Loader2,
  LogOut,
  Save,
  Shield,
  Sliders,
  User,
} from "lucide-react";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function Settings() {
  const { user, signOut } = useAuth();

  const [username,   setUsername]   = useState("");
  const [origName,   setOrigName]   = useState("");
  const [saveState,  setSaveState]  = useState<SaveState>("idle");
  const [saveMsg,    setSaveMsg]    = useState("");
  const [defDiff,    setDefDiff]    = useState<"core" | "intermediate" | "advanced">("core");
  const [defCount,   setDefCount]   = useState(10);
  const [prefSaved,  setPrefSaved]  = useState(false);
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("users")
      .select("username")
      .eq("id", user.id)
      .single();
    if (data?.username) {
      setUsername(data.username);
      setOrigName(data.username);
    }
    // Load preferences from localStorage
    const storedDiff  = localStorage.getItem("mm_pref_difficulty");
    const storedCount = localStorage.getItem("mm_pref_count");
    if (storedDiff  && ["core","intermediate","advanced"].includes(storedDiff)) setDefDiff(storedDiff as any);
    if (storedCount) setDefCount(Number(storedCount));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const saveProfile = async () => {
    if (!user || !username.trim()) return;
    const trimmed = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!trimmed) { setSaveMsg("Username can only contain letters, numbers and underscores."); setSaveState("error"); return; }
    if (trimmed === origName) { setSaveMsg("No changes to save."); setSaveState("error"); return; }

    setSaveState("saving");
    const { error } = await supabase
      .from("users")
      .update({ username: trimmed })
      .eq("id", user.id);

    if (error) {
      if (error.code === "23505") setSaveMsg("That username is already taken.");
      else setSaveMsg("Couldn't save. Please try again.");
      setSaveState("error");
    } else {
      setOrigName(trimmed);
      setUsername(trimmed);
      setSaveMsg("Username updated!");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    }
  };

  const savePreferences = () => {
    localStorage.setItem("mm_pref_difficulty", defDiff);
    localStorage.setItem("mm_pref_count",      String(defCount));
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-xl mx-auto">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-6 space-y-3 animate-pulse">
            <div className="h-5 bg-muted rounded w-1/3" />
            <div className="h-10 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-2">
          <Sliders className="w-7 h-7 text-primary" /> Settings
        </h1>
        <p className="mt-1 text-foreground/60">Manage your profile and preferences.</p>
      </motion.div>

      {/* ── Profile ── */}
      <motion.div className="card p-6 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
          <User className="w-5 h-5 text-primary" /> Profile
        </h2>

        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-2xl text-primary">
            {(username || "?").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-foreground">{username || "—"}</p>
            <p className="text-xs text-foreground/50">{user?.email ?? ""}</p>
          </div>
        </div>

        <div>
          <label htmlFor="settings-username" className="block text-sm font-medium text-foreground mb-1.5">
            Username
          </label>
          <input
            id="settings-username"
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setSaveState("idle"); setSaveMsg(""); }}
            className="input-base"
            placeholder="your_username"
            maxLength={30}
            autoCapitalize="off"
            autoCorrect="off"
          />
          <p className="text-xs text-foreground/40 mt-1">Letters, numbers and underscores only.</p>
        </div>

        {saveMsg && (
          <p className={`text-sm font-medium ${saveState === "error" ? "text-destructive" : "text-green-600"}`}>
            {saveMsg}
          </p>
        )}

        <button
          onClick={saveProfile}
          disabled={saveState === "saving" || username.trim() === origName}
          className="btn-primary disabled:opacity-50 disabled:pointer-events-none"
        >
          {saveState === "saving" ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
          ) : saveState === "saved" ? (
            <><Check className="w-4 h-4" /> Saved!</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </button>
      </motion.div>

      {/* ── Quiz Preferences ── */}
      <motion.div className="card p-6 space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
          <Sliders className="w-5 h-5 text-primary" /> Quiz Preferences
        </h2>
        <p className="text-sm text-foreground/60">These become the default settings when you start a new quiz.</p>

        {/* Default difficulty */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Default Difficulty</label>
          <div className="flex gap-2" role="radiogroup" aria-label="Default difficulty">
            {(["core","intermediate","advanced"] as const).map((d) => (
              <button
                key={d}
                role="radio"
                aria-checked={defDiff === d}
                onClick={() => setDefDiff(d)}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-heading font-semibold transition-all cursor-pointer ${
                  defDiff === d ? "bg-primary text-on-primary shadow-sm" : "bg-muted text-foreground/60 hover:bg-muted/80"
                }`}
              >
                {d === "core" ? "Core" : d === "intermediate" ? "Intermediate" : "Advanced"}
              </button>
            ))}
          </div>
        </div>

        {/* Default question count */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Default Question Count</label>
          <div className="flex gap-2" role="radiogroup" aria-label="Default question count">
            {[5, 10, 15].map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={defCount === n}
                onClick={() => setDefCount(n)}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-heading font-semibold transition-all cursor-pointer ${
                  defCount === n ? "bg-primary text-on-primary shadow-sm" : "bg-muted text-foreground/60 hover:bg-muted/80"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button onClick={savePreferences} className="btn-secondary">
          {prefSaved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Preferences</>}
        </button>
      </motion.div>

      {/* ── Account ── */}
      <motion.div className="card p-6 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> Account
        </h2>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="font-medium text-foreground">Sign out</p>
            <p className="text-xs text-foreground/50">You'll need to sign in again to access MathMaster.</p>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-destructive/40 text-destructive text-sm font-heading font-semibold hover:bg-destructive/5 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
