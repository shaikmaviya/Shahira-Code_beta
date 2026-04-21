import { useEffect, useRef, useState } from "react";
import { loginUser } from "./authApi";

export default function Login({ onClose, onSwitchToSignup, onLogin }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [googleReady, setGoogleReady] = useState(false);
	const [googleError, setGoogleError] = useState("");
	const [googleLoading, setGoogleLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const googleInitedRef = useRef(false);

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

	function handleGoogleCredential(response) {
		const payload = decodeJwtPayload(response?.credential || "");
		if (!payload || !payload.email) {
			setGoogleError("Google sign-in failed. Please try again.");
			setGoogleLoading(false);
			return;
		}

		const sessionUser = {
			name: payload.name || payload.given_name || "Google User",
			email: payload.email,
			provider: "google"
		};

		localStorage.removeItem("codeviz_token");
		localStorage.setItem("codeviz_user", JSON.stringify(sessionUser));
		onLogin(sessionUser);
		setGoogleLoading(false);
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

		try {
			const response = await loginUser({
				email: email.trim(),
				password
			});

			localStorage.setItem("codeviz_token", response.token);
			localStorage.setItem("codeviz_user", JSON.stringify(response.user));
			onLogin(response.user);
		} catch (err) {
			setError(err.message || "Unable to login right now.");
		} finally {
			setIsSubmitting(false);
		}
	}

	function handleGoogleSigninClick() {
		if (!googleReady || !window.google?.accounts?.id) {
			setGoogleError("Google sign-in is still loading. Please wait.");
			return;
		}

		setGoogleError("");
		setGoogleLoading(true);
		window.google.accounts.id.prompt((notification) => {
			if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
				setGoogleLoading(false);
				setGoogleError("Google prompt was closed. Try again.");
			}
		});
	}

	return (
		<div className="auth-overlay" role="dialog" aria-modal="true" aria-label="Login page">
			<div className="auth-card">
				<div className="auth-head">
					<h2>Login</h2>
					<p>Access your CodeViz practice account.</p>
				</div>

				<form className="auth-form" onSubmit={handleSubmit}>
					<label htmlFor="login-email">Email</label>
					<input
						id="login-email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@example.com"
						required
					/>

					<label htmlFor="login-password">Password</label>
					<input
						id="login-password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Enter password"
						required
					/>

					{error && <p className="auth-error">{error}</p>}

					<button type="submit" className="bp" disabled={isSubmitting}>
						{isSubmitting ? "Logging in..." : "Login"}
					</button>

					<div className="auth-divider">
						<span>or</span>
					</div>

					<button type="button" className="google-btn" onClick={handleGoogleSigninClick}>
						{googleLoading ? "Opening Google..." : "Continue with Google"}
					</button>

					{googleError && <p className="auth-error">{googleError}</p>}
				</form>

				<div className="auth-foot">
					<button type="button" className="bg small-btn" onClick={onSwitchToSignup}>Create New Account</button>
					<button type="button" className="bg small-btn" onClick={onClose}>Close</button>
				</div>
			</div>
		</div>
	);
}
