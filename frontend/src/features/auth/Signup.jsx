import { useEffect, useRef, useState } from "react";
import { googleLoginUser, signupUser } from "./authApi";

export default function Signup({ onClose, onSwitchToLogin, onSignup }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleInitedRef = useRef(false);
  const googleButtonRef = useRef(null);

  function decodeJwtPayload(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(
        atob(base64)
          .split("")
          .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join("")
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  async function handleGoogleCredential(response) {
    const payload = decodeJwtPayload(response?.credential || "");
    if (!payload || !payload.email) {
      setGoogleError("Google sign-up failed. Please try again.");
      return;
    }

    setGoogleError("");

    try {
      const authResponse = await googleLoginUser(response.credential);
      localStorage.setItem("codeviz_token", authResponse.token);
      localStorage.setItem("codeviz_user", JSON.stringify(authResponse.user));
      onSignup(authResponse.user);
    } catch (err) {
      setGoogleError(err.message || "Google sign-up failed. Please try again.");
    }
  }

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setGoogleError("Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID in .env.");
      return;
    }

    function initializeGoogle() {
      if (!window.google?.accounts?.id || googleInitedRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          width: 280
        });
      }

      googleInitedRef.current = true;
      setGoogleReady(true);
    }

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    const existingScript = document.querySelector("script[data-google-identity]");
    if (existingScript) {
      existingScript.addEventListener("load", initializeGoogle);
      return () => existingScript.removeEventListener("load", initializeGoogle);
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.addEventListener("load", initializeGoogle);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", initializeGoogle);
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await signupUser({
        name: name.trim(),
        email: email.trim(),
        password
      });

      localStorage.setItem("codeviz_token", response.token);
      localStorage.setItem("codeviz_user", JSON.stringify(response.user));
      onSignup(response.user);
    } catch (err) {
      setError(err.message || "Unable to create account right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true" aria-label="Sign up page">
      <div className="auth-card">
        <div className="auth-head">
          <h2>Sign Up</h2>
          <p>Create your Shahira Code account to track progress.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="signup-name">Name</label>
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />

          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create password"
            minLength={6}
            required
          />

          <label htmlFor="signup-confirm-password">Confirm Password</label>
          <input
            id="signup-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            minLength={6}
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="bp" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>


          <div className="google-btn" ref={googleButtonRef} />
          {!googleReady && (
            <p className="auth-error">Loading Google sign-in...</p>
          )}

          {googleError && <p className="auth-error">{googleError}</p>}
        </form>

        <div className="auth-foot">
          <button type="button" className="bg small-btn" onClick={onSwitchToLogin}>Already Have Account</button>
          <button type="button" className="bg small-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
