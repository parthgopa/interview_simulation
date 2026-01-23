const BASE_URL = "${backendURL}";

export async function signupUser(payload) {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res.json();
}

export async function loginUser(payload) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res.json();
}

export async function getCurrentUser(token) {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}

export async function loginCandidate(payload) {
  const res = await fetch(`${BASE_URL}/auth/candidate-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res.json();
}

//-----------------------------
// Admin Backend URLs
//-----------------------------

// Admin Login
export async function loginAdmin(payload) {
  const res = await fetch(`${BASE_URL}/auth/admin-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res.json();
}

//-----------------------------
// Admin Signup
//-----------------------------
export async function signupAdmin(payload) {
  const res = await fetch(`${BASE_URL}/auth/admin-signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res.json();
}