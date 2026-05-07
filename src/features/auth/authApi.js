const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });
  } catch {
    throw new Error(
      API_BASE
        ? `Cannot reach API at ${API_BASE}. Is the backend running?`
        : "Cannot reach API. If you're using Preview/production, set VITE_API_BASE_URL (e.g. http://localhost:8080) and restart the dev server."
    );
  }

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

export async function signupUser(payload) {
  return request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function loginUser(payload) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function googleLoginUser(idToken) {
  return request("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken })
  });
}

export async function logoutUser(token) {
  if (!token) {
    return;
  }

  await request("/api/auth/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export async function meUser(token) {
  if (!token) {
    throw new Error("Missing auth token");
  }

  return request("/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
