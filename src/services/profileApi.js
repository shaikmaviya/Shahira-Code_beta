const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || "Request failed. Please try again.");
  }

  return data;
}

function withAuth(token, options = {}) {
  return {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  };
}

export async function getProfile(token) {
  return request("/api/profile", withAuth(token, { method: "GET" }));
}

export async function updateProfile(token, payload) {
  return request("/api/profile", withAuth(token, {
    method: "PUT",
    body: JSON.stringify(payload)
  }));
}

export async function listUserProblems(token) {
  return request("/api/user-problems", withAuth(token, { method: "GET" }));
}

export async function saveUserProblem(token, payload) {
  return request("/api/user-problems", withAuth(token, {
    method: "POST",
    body: JSON.stringify(payload)
  }));
}

export async function listUserProgress(token) {
  return request("/api/user-progress", withAuth(token, { method: "GET" }));
}

export async function upsertUserProgress(token, payload) {
  return request("/api/user-progress", withAuth(token, {
    method: "POST",
    body: JSON.stringify(payload)
  }));
}

export async function createPricingSignup(token, payload) {
  return request("/api/pricing-signups", withAuth(token, {
    method: "POST",
    body: JSON.stringify(payload)
  }));
}
