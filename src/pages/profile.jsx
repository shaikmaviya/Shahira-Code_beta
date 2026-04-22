import { useEffect, useMemo, useState } from "react";
import "./Profile.css";
import { logoutUser, meUser } from "../authentication/authApi";
import {
	getProfile,
	listUserProblems,
	listUserProgress,
	updateProfile
} from "../profileApi";

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

function toDateKey(value) {
	if (!value) {
		return null;
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return null;
	}

	return date.toISOString().slice(0, 10);
}

function buildPracticeCalendar({ weeks = 26, activity = new Map() } = {}) {
	const today = new Date();
	const start = new Date(today);
	start.setDate(today.getDate() - weeks * 7 + 1);

	const weeksData = [];
	let cursor = new Date(start);

	for (let w = 0; w < weeks; w += 1) {
		const days = [];
		let monthLabel = "";

		for (let d = 0; d < 7; d += 1) {
			const date = new Date(cursor);
			const key = toDateKey(date);
			const count = key ? activity.get(key) || 0 : 0;
			const level = Math.min(4, count);

			days.push({
				date,
				level
			});

			if (date.getDate() === 1) {
				monthLabel = date.toLocaleString("en", { month: "short" });
			}

			cursor.setDate(cursor.getDate() + 1);
		}

		weeksData.push({ days, monthLabel });
	}

	return { weeks: weeksData };
}

function readSolvedCache() {
	try {
		const raw = localStorage.getItem("codeviz_solved_cache");
		if (!raw) {
			return [];
		}
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return [];
		}
		return parsed.filter((item) => item && item.problemId);
	} catch {
		return [];
	}
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
	const [avatarPath, setAvatarPath] = useState("");
	const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
	const [avatarTab, setAvatarTab] = useState("gallery");
	const [uploadPreview, setUploadPreview] = useState("");
	const [uploadFileName, setUploadFileName] = useState("");
	const [uploadError, setUploadError] = useState("");
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [editName, setEditName] = useState("");
	const [editBio, setEditBio] = useState("");
	const [status, setStatus] = useState("idle");
	const [message, setMessage] = useState("");
	const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
	const [userProblems, setUserProblems] = useState([]);
	const [progressItems, setProgressItems] = useState([]);

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

	const activeAvatar = avatarPath || user?.avatarUrl || fallbackAvatar;
	const solvedProblems = useMemo(() => {
		const progressMap = new Map(
			progressItems.map((item) => [item.problemId, item])
		);
		const cachedSolved = readSolvedCache();
		const mergedProblems = [...userProblems];
		cachedSolved.forEach((cached) => {
			const exists = mergedProblems.some(
				(problem) => String(problem.problemId) === String(cached.problemId)
			);
			if (!exists) {
				mergedProblems.push({
					...cached,
					status: cached.status || "completed"
				});
			}
		});

		return mergedProblems
			.map((problem) => {
				const progress = progressMap.get(problem.problemId);
				const status = (progress?.status || problem.status || "").toLowerCase();
				const date = progress?.completedAt
					|| progress?.lastAttemptAt
					|| problem.completedAt
					|| null;

				return {
					title: problem.title,
					level: problem.level,
					topic: problem.topic,
					date,
					status
				};
			})
			.filter((problem) => ["completed", "solved", "done"].includes(problem.status));
	}, [progressItems, userProblems]);
	const practiceCalendar = useMemo(() => {
		const activity = new Map();
		progressItems.forEach((item) => {
			const key = toDateKey(item.lastAttemptAt || item.completedAt);
			if (!key) {
				return;
			}
			activity.set(key, (activity.get(key) || 0) + 1);
		});

		return buildPracticeCalendar({ weeks: 55, activity });
	}, [progressItems]);
	const practiceCount = useMemo(() => {
		return practiceCalendar.weeks.reduce((total, week) => {
			return total + week.days.filter((day) => day.level > 0).length;
		}, 0);
	}, [practiceCalendar]);

	useEffect(() => {
		if (!token) {
			return;
		}

		const loadProfile = async () => {
			setStatus("loading");
			setMessage("");
			try {
				const [profile, me, problems, progress] = await Promise.all([
					getProfile(token),
					meUser(token).catch(() => null),
					listUserProblems(token),
					listUserProgress(token)
				]);

				const mergedUser = {
					...(me || user || {}),
					...profile
				};

				setUser(mergedUser);
				localStorage.setItem("codeviz_user", JSON.stringify(mergedUser));
				setAvatarPath(profile?.avatarUrl || "");
				setUserProblems(Array.isArray(problems) ? problems : []);
				setProgressItems(Array.isArray(progress) ? progress : []);
				setStatus("success");
			} catch (err) {
				setStatus("error");
				setMessage(err.message || "Unable to load profile data.");
			}
		};

		loadProfile();
	}, [token]);

	async function refreshSession() {
		if (!token) {
			setStatus("error");
			setMessage("No auth token found. Please login again.");
			return;
		}

		setStatus("loading");
		setMessage("");

		try {
			const [profile, me, problems, progress] = await Promise.all([
				getProfile(token),
				meUser(token).catch(() => null),
				listUserProblems(token),
				listUserProgress(token)
			]);

			const mergedUser = {
				...(me || user || {}),
				...profile
			};

			setUser(mergedUser);
			localStorage.setItem("codeviz_user", JSON.stringify(mergedUser));
			setAvatarPath(profile?.avatarUrl || "");
			setUserProblems(Array.isArray(problems) ? problems : []);
			setProgressItems(Array.isArray(progress) ? progress : []);
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

	function openEditModal() {
		setEditName(user?.name || "");
		setEditBio(user?.bio || "");
		setIsEditOpen(true);
	}

	function closeEditModal() {
		setIsEditOpen(false);
	}

	async function handleSaveProfile() {
		if (!token) {
			setStatus("error");
			setMessage("Please login again to update profile.");
			return;
		}

		setStatus("loading");
		setMessage("");

		try {
			const updated = await updateProfile(token, {
				name: editName.trim() || user?.name || "",
				avatarUrl: avatarPath || user?.avatarUrl || "",
				bio: editBio.trim()
			});
			setUser((prev) => ({
				...(prev || {}),
				...updated
			}));
			localStorage.setItem("codeviz_user", JSON.stringify({
				...(user || {}),
				...updated
			}));
			setStatus("success");
			setMessage("Profile updated.");
			setIsEditOpen(false);
		} catch (err) {
			setStatus("error");
			setMessage(err.message || "Unable to update profile.");
		}
	}

	function openAvatarModal() {
		setAvatarTab("gallery");
		setUploadPreview("");
		setUploadFileName("");
		setUploadError("");
		setIsAvatarModalOpen(true);
	}

	function closeAvatarModal() {
		setIsAvatarModalOpen(false);
		setUploadPreview("");
		setUploadFileName("");
		setUploadError("");
	}

	function handleAvatarFileChange(event) {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		if (!file.type.startsWith("image/")) {
			setUploadError("Please choose an image file.");
			setUploadPreview("");
			return;
		}

		setUploadError("");
		setUploadFileName(file.name);

		const reader = new FileReader();
		reader.onload = () => {
			setUploadPreview(String(reader.result || ""));
		};
		reader.onerror = () => {
			setUploadError("Unable to read this file.");
		};
		reader.readAsDataURL(file);
	}

	async function saveAvatar(path) {
		if (!token) {
			setStatus("error");
			setMessage("Please login again to update avatar.");
			return;
		}

		const nextPath = path || "";
		setAvatarPath(nextPath);
		setAvatarLoadFailed(false);
		setIsAvatarModalOpen(false);

		try {
			const updated = await updateProfile(token, {
				name: user?.name || "",
				avatarUrl: nextPath,
				bio: user?.bio || ""
			});
			setUser((prev) => ({
				...(prev || {}),
				...updated
			}));
			setStatus("success");
			setMessage(path ? "Avatar updated." : "Avatar reset to default initials avatar.");
		} catch (err) {
			setStatus("error");
			setMessage(err.message || "Unable to update avatar.");
		}
	}

	if (!user) {
		return (
			<section className="sec profile-page profile-logged-out" data-reveal>
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
		<section className="sec profile-page" data-reveal>
			<div className="profile-layout">
				<aside className="profile-aside">
					<div className="profile-card profile-identity">
						<button
							type="button"
							onClick={openAvatarModal}
							className="profile-avatar"
							title="Click to choose avatar"
						>
							<img
								src={avatarLoadFailed ? fallbackAvatar : activeAvatar}
								onError={() => setAvatarLoadFailed(true)}
								alt="Profile avatar"
							/>
						</button>
						<h2>{user.name || "User"}</h2>
						<p className="profile-handle">@{(user.name || "user").toLowerCase().replace(/\s+/g, "")}</p>
						<p className="profile-bio">
							{user.bio || "I build DSA intuition with visual coding and clean practice flows."}
						</p>
						<div className="profile-actions">
							<button type="button" className="bp" onClick={openEditModal}>
								Edit profile
							</button>
							<button className="bg" onClick={() => saveAvatar("")}>Reset Avatar</button>
						</div>
					</div>

					<div className="profile-card profile-details">
						<h3>Details</h3>
						<ul>
							<li><strong>Email:</strong> {user.email || "-"}</li>
							<li><strong>Provider:</strong> {user.provider || "password"}</li>
							<li><strong>Last Synced:</strong> {formatDate(new Date().toISOString())}</li>
							<li><strong>Token:</strong> {maskedToken}</li>
						</ul>
						<button className="bg" onClick={copyToken}>Copy Token</button>
					</div>
				</aside>

				<main className="profile-main">
					<div className="profile-card profile-problems">
						<div className="profile-card-head">
							<h3>Problems Solved</h3>
							<span className="profile-meta">{solvedProblems.length} total solved</span>
						</div>
						<div className="profile-problem-grid">
							{solvedProblems.length === 0 ? (
								<p className="ssub" style={{ margin: 0 }}>
									No solved problems yet. Start a problem to see it here.
								</p>
							) : (
								solvedProblems.map((problem) => (
									<div key={`${problem.title}-${problem.date || "unknown"}`} className="profile-problem">
										<div>
											<h4>{problem.title}</h4>
											<p>{problem.topic}</p>
											{problem.date && (
												<span className="profile-problem-date">
													{new Date(problem.date).toLocaleDateString()}
												</span>
											)}
										</div>
										<span className={`profile-chip level-${problem.level?.toLowerCase() || "easy"}`}>
											{problem.level || "Easy"}
										</span>
									</div>
								))
							)}
						</div>
					</div>

					<div className="profile-card profile-calendar">
						<div className="profile-card-head">
							<h3>Practice Calendar</h3>
							<span className="profile-meta">{practiceCount} practice days in the last 6 months</span>
						</div>
						<div className="practice-months">
							{practiceCalendar.weeks.map((week, index) => (
								<span key={`month-${index}`} className="practice-month">
									{week.monthLabel}
								</span>
							))}
						</div>
						<div className="practice-grid" role="grid" aria-label="Practice activity">
							{practiceCalendar.weeks.map((week, index) => (
								<div key={`week-${index}`} className="practice-week" role="row">
									{week.days.map((day) => (
										<span
											key={day.date.toISOString()}
											className={`practice-day level-${day.level}`}
											title={`${day.date.toDateString()} - level ${day.level}`}
											role="gridcell"
										/>
									))}
								</div>
							))}
						</div>
						<div className="practice-legend">
							<span>Less</span>
							<span className="practice-day level-0" aria-hidden="true" />
							<span className="practice-day level-1" aria-hidden="true" />
							<span className="practice-day level-2" aria-hidden="true" />
							<span className="practice-day level-3" aria-hidden="true" />
							<span className="practice-day level-4" aria-hidden="true" />
							<span>More</span>
						</div>
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

					<div className="profile-footer">
						<button className="bp" onClick={refreshSession} disabled={status === "loading"}>
							{status === "loading" ? "Refreshing..." : "Refresh Profile"}
						</button>
						<button className="bg" onClick={handleLogout} disabled={status === "loading"}>Logout</button>
						<button className="bg" onClick={onBack}>Go Back</button>
					</div>
				</main>
			</div>

			{isAvatarModalOpen && (
				<div className="avatar-modal-overlay" role="dialog" aria-modal="true" aria-label="Choose avatar">
					<div className="avatar-modal">
						<div className="avatar-modal-head">
							<h3>Choose your avatar</h3>
							<button className="bg small-btn" onClick={closeAvatarModal}>Close</button>
						</div>
						<div className="avatar-tabs">
							<button
								type="button"
								className={`avatar-tab ${avatarTab === "gallery" ? "active" : ""}`}
								onClick={() => setAvatarTab("gallery")}
							>
								Gallery
							</button>
							<button
								type="button"
								className={`avatar-tab ${avatarTab === "upload" ? "active" : ""}`}
								onClick={() => setAvatarTab("upload")}
							>
								Upload
							</button>
						</div>

						{avatarTab === "gallery" && (
							<div className="profile-avatar-grid avatar-gallery">
								{allAvatarOptions.length ? (
									allAvatarOptions.map((item) => (
										<button
											key={item}
											type="button"
											onClick={() => saveAvatar(item)}
											className={`profile-avatar-option ${item === avatarPath ? "active" : ""}`}
											title={item.split("/").pop()}
										>
											<img src={item} alt="Avatar option" />
										</button>
									))
								) : (
									<p className="ssub" style={{ margin: 0, gridColumn: "1 / -1" }}>
										No avatars found yet. Add images in src/assets or src/assets/avatars.
									</p>
								)}
							</div>
						)}

						{avatarTab === "upload" && (
							<div className="avatar-upload">
								<div className="avatar-preview">
									{uploadPreview ? (
										<img src={uploadPreview} alt="Upload preview" />
									) : (
										<span>No image selected</span>
									)}
								</div>
								<label className="bg">
									Choose image
									<input type="file" accept="image/*" onChange={handleAvatarFileChange} hidden />
								</label>
								{uploadFileName && <p className="ssub">{uploadFileName}</p>}
								{uploadError && <p className="ssub" style={{ color: "#ff9f9f" }}>{uploadError}</p>}
								<div className="avatar-upload-actions">
									<button
										className="bp"
										onClick={() => uploadPreview && saveAvatar(uploadPreview)}
										disabled={!uploadPreview}
									>
										Use this photo
									</button>
									<button className="bg" onClick={closeAvatarModal}>Cancel</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{isEditOpen && (
				<div className="avatar-modal-overlay" role="dialog" aria-modal="true" aria-label="Edit profile">
					<div className="avatar-modal profile-edit-modal">
						<div className="avatar-modal-head">
							<h3>Edit profile</h3>
							<button className="bg small-btn" onClick={closeEditModal}>Close</button>
						</div>
						<div className="profile-edit-form">
							<label htmlFor="profile-name">Name</label>
							<input
								id="profile-name"
								type="text"
								value={editName}
								onChange={(event) => setEditName(event.target.value)}
								placeholder="Your name"
							/>
							<label htmlFor="profile-bio">Bio</label>
							<textarea
								id="profile-bio"
								rows={4}
								value={editBio}
								onChange={(event) => setEditBio(event.target.value)}
								placeholder="Short bio"
							/>
							<div className="avatar-upload-actions">
								<button
									className="bp"
									onClick={handleSaveProfile}
									disabled={status === "loading"}
								>
									{status === "loading" ? "Saving..." : "Save changes"}
								</button>
								<button className="bg" onClick={closeEditModal}>Cancel</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
