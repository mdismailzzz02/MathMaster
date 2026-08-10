import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import LoadingScreen from "../components/LoadingScreen";

/**
 * Handles password-reset flow callbacks.
 * The session is auto-detected by onAuthStateChange via detectSessionInUrl,
 * so we just show a spinner and redirect.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/learn", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    });
  }, [navigate]);

  return <LoadingScreen label="Completing sign-in…" />;
}
