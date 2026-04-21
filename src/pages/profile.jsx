import { useMemo, useState } from "react";
import "./Profile.css";
import { logoutUser, meUser } from "../authentication/authApi";

const assetAvatarModules = import.meta.glob(
	[
		"../assets/*.{png,jpg,jpeg,webp,avif,svg}",
		"../assets/avatars/*.{png,jpg,jpeg,webp,avif,svg}"
	],
	{
		eager: true,
		import: "default"
	}
);

const assetAvatars = Object.values(assetAvatarModules).sort((a, b) => a.localeCompare(b));

function formatDate(value) {
	if (!value) {
		return "-";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return date.toLocaleString();
}

function buildFallbackAvatar(name) {
	const baseName = (name || "User").trim();
	const letters = baseName
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0].toUpperCase())
		.join("") || "U";

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220"><rect width="220" height="220" fill="#1f2937"/><circle cx="110" cy="88" r="42" fill="#334155"/><rect x="42" y="140" width="136" height="58" rx="28" fill="#334155"/><text x="110" y="122" font-size="40" text-anchor="middle" fill="#cbd5e1" font-family="Arial, sans-serif">${letters}</text></svg>`;

	return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function ProfilePage({ onBack, onRequireLogin }) {
	const [user, setUser] = useState(() => {
		const rawUser = localStorage.getItem("codeviz_user");
		if (!rawUser) {
			return null;
		}

		try {
			return JSON.parse(rawUser);
		} catch {
			localStorage.removeItem("codeviz_user");
			return null;
		}
	});
	const [token] = useState(() => localStorage.getItem("codeviz_token"));
	const [avatarPath, setAvatarPath] = useState(() => localStorage.getItem("codeviz_avatar") || "");
	const [showAvatarPicker, setShowAvatarPicker] = useState(false);
	const [status, setStatus] = useState("idle");
	const [message, setMessage] = useState("");
	const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

	const allAvatarOptions = useMemo(() => {
		return Array.from(new Set(assetAvatars));
	}, []);

	const fallbackAvatar = useMemo(() => buildFallbackAvatar(user?.name), [user?.name]);

	const maskedToken = useMemo(() => {
		if (!token) {
			return "No token";
		}

		if (token.length < 16) {
			return token;
		}

		return `${token.slice(0, 8)}...${token.slice(-8)}`;
	}, [token]);

	const activeAvatar = avatarPath || fallbackAvatar;

	async function refreshSession() {
		if (!token) {
			setStatus("error");
			setMessage("No auth token found. Please login again.");
			return;
		}

		setStatus("loading");
		setMessage("");

		try {
			const freshUser = await meUser(token);
			setUser(freshUser);
			localStorage.setItem("codeviz_user", JSON.stringify(freshUser));
			setStatus("success");
			setMessage("Profile synced from server.");
		} catch (err) {
			setStatus("error");
			setMessage(err.message || "Unable to fetch profile.");
		}
	}

	async function handleLogout() {
		setStatus("loading");
		setMessage("");

		try {
			if (token) {
				await logoutUser(token);
			}
		} catch {
			// Force local cleanup even if API logout fails.
		}

		localStorage.removeItem("codeviz_token");
		localStorage.removeItem("codeviz_user");
		setUser(null);
		setStatus("success");
		setMessage("You are logged out.");
	}

	function copyToken() {
		if (!token) {
			setStatus("error");
			setMessage("No token to copy.");
			return;
		}

		navigator.clipboard.writeText(token)
			.then(() => {
				setStatus("success");
				setMessage("Token copied.");
			})
			.catch(() => {
				setStatus("error");
				setMessage("Unable to copy token.");
			});
	}

	function saveAvatar(path) {
		if (!path) {
			setAvatarPath("");
			localStorage.removeItem("codeviz_avatar");
			setAvatarLoadFailed(false);
			setStatus("success");
			setMessage("Avatar reset to default initials avatar.");
			return;
		}

		setAvatarPath(path);
		localStorage.setItem("codeviz_avatar", path);
		setAvatarLoadFailed(false);
		setShowAvatarPicker(false);
		setStatus("success");
		setMessage("Avatar updated.");
	}

	if (!user) {
		return (
			<section className="sec profile-page profile-logged-out">
				<p className="stag">Profile</p>
				<h2>Not Logged In</h2>
				<p className="ssub">Login first to view your profile details.</p>
				<div className="ctabtns profile-actions">
					<button className="bp" onClick={onRequireLogin}>Go To Login</button>
					<button className="bg" onClick={onBack}>Go Back</button>
				</div>
			</section>
		);
	}

	return (
		<section className="sec profile-page">
			<p className="stag">Profile</p>
			<h2>{user.name || "User"}</h2>
			<p className="ssub">Manage your Shahira Code session and account details.</p>

			<div className="fc profile-card">
				<h3 style={{ marginBottom: "12px" }}>Avatar</h3>
				<div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
					<button
						type="button"
						onClick={() => setShowAvatarPicker((prev) => !prev)}
						style={{
							padding: 0,
							width: "96px",
							height: "96px",
							borderRadius: "50%",
							overflow: "hidden",
							cursor: "pointer",
							border: "3px solid rgba(0,245,160,.75)",
							background: "transparent",
							boxShadow: "0 0 0 4px rgba(0,245,160,.15)"
						}}
						title="Click to choose avatar"
					>
						<img
							src={avatarLoadFailed ? fallbackAvatar : activeAvatar}
							onError={() => setAvatarLoadFailed(true)}
							alt="Profile avatar"
							style={{ width: "100%", height: "100%", objectFit: "cover" }}
						/>
					</button>

					<div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "260px", flex: 1 }}>
						{showAvatarPicker && (
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "repeat(auto-fill, minmax(62px, 1fr))",
									gap: "8px",
									padding: "10px",
									border: "1px solid rgba(255,255,255,.15)",
									borderRadius: "12px",
									background: "rgba(0,0,0,.2)",
									maxHeight: "220px",
									overflowY: "auto"
								}}
							>
								{allAvatarOptions.length ? (
									allAvatarOptions.map((item) => (
										<button
											key={item}
											type="button"
											onClick={() => saveAvatar(item)}
											style={{
												padding: 0,
												width: "62px",
												height: "62px",
												borderRadius: "50%",
												overflow: "hidden",
												border: item === avatarPath ? "2px solid #00f5a0" : "2px solid rgba(255,255,255,.2)",
												background: "transparent",
												cursor: "pointer"
											}}
											title={item.split("/").pop()}
										>
											<img src={item} alt="Avatar option" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
										</button>
									))
								) : (
									<p className="ssub" style={{ margin: 0, gridColumn: "1 / -1" }}>
										No avatars found yet. Add images in src/assets or src/assets/avatars.
									</p>
								)}
							</div>
						)}
						<div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
							<button type="button" className="bg" onClick={() => saveAvatar("")}>Reset Avatar</button>
						</div>
					</div>
				</div>
			</div>

			<div
				className="fc"
				style={{
					marginTop: "18px",
					border: "1px solid rgba(255,255,255,.12)",
					borderRadius: "16px",
					padding: "18px"
				}}
			>
				<p><strong>Email:</strong> {user.email || "-"}</p>
				<p><strong>Name:</strong> {user.name || "-"}</p>
				<p><strong>Provider:</strong> {user.provider || "password"}</p>
				<p><strong>Last Synced:</strong> {formatDate(new Date().toISOString())}</p>
				<p><strong>Token:</strong> {maskedToken}</p>
			</div>

			{message && (
				<p
					className="ssub"
					style={{
						marginTop: "12px",
						color: status === "error" ? "#ff9f9f" : "#b8f3c9"
					}}
				>
					{message}
				</p>
			)}

			<div className="ctabtns" style={{ marginTop: "16px" }}>
				<button className="bp" onClick={refreshSession} disabled={status === "loading"}>
					{status === "loading" ? "Refreshing..." : "Refresh Profile"}
				</button>
				<button className="bg" onClick={copyToken}>Copy Token</button>
				<button className="bg" onClick={handleLogout} disabled={status === "loading"}>Logout</button>
				<button className="bg" onClick={onBack}>Go Back</button>
			</div>
		</section>
	);
}
