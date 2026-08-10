import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2, User, Lock, Eye, EyeOff } from "lucide-react";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export default function LoginPage() {
  const { session, signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Already authenticated -> redirect
  if (session) return <Navigate to="/learn" replace />;

  const handleUsernameChange = (value: string) => {
    // Keep only lowercase letters, numbers, underscores while typing
    setUsername(value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!USERNAME_RE.test(username)) {
      setError("Username must be 3–20 characters using letters, numbers, or underscores.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error: authError } = isSignUp
      ? await signUp(username, password)
      : await signIn(username, password);
    setLoading(false);

    if (authError) {
      setError(authError);
    } else {
      navigate("/learn", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            MathMaster
          </h1>
          <p className="font-sans text-sm text-foreground/60 mt-1">
            {isSignUp
              ? "Create your account to start learning"
              : "Welcome back! Sign in to continue"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card p-6 space-y-4"
          noValidate
        >
          {/* Username */}
          <div>
            <label
              htmlFor="login-username"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="e.g. math_wiz"
                autoComplete="username"
                aria-describedby={
                  isSignUp ? "login-username-hint" : error ? "login-error" : undefined
                }
                aria-invalid={!!error}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-all"
              />
            </div>
            {isSignUp && (
              <p
                id="login-username-hint"
                className="text-xs text-foreground/50 mt-1.5"
              >
                3–20 characters — letters, numbers, and underscores
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder={isSignUp ? "At least 6 characters" : "Your password"}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                aria-describedby={error ? "login-error" : undefined}
                aria-invalid={!!error}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm password (sign up only) */}
          {isSignUp && (
            <div>
              <label
                htmlFor="login-confirm"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <input
                  id="login-confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  aria-invalid={!!error}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-all"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p
              id="login-error"
              role="alert"
              className="text-sm text-destructive font-medium"
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading
              ? "Please wait…"
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-foreground/60 mt-4">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp((p) => !p);
              setError(null);
              setConfirmPassword("");
            }}
            className="text-primary font-medium hover:underline cursor-pointer"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
