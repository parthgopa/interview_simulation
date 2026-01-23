import { getToken } from "./token";

const BASE_URL = "${backendURL}";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

// export async function startInterview(payload) {
//   const res = await fetch(`${BASE_URL}/start-interview`, {
//     method: "POST",
//     headers: authHeaders(),
//     body: JSON.stringify(payload),
//   });
//   return res.json();
// }

// export async function sendAnswer(payload) {
//   const res = await fetch(`${BASE_URL}/next-question`, {
//     method: "POST",
//     headers: authHeaders(),
//     body: JSON.stringify(payload),
//   });
//   return res.json();
// }

// export async function endInterview(payload) {
//   const res = await fetch(`${BASE_URL}/end-interview`, {
//     method: "POST",
//     headers: authHeaders(),
//     body: JSON.stringify(payload),
//   });
//   return res.json();
// }

export async function startInterview(payload) {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated. Please login first.");
  }

  const res = await fetch(`${BASE_URL}/interview/start-interview`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  
  if (res.status === 401) {
    throw new Error("Session expired. Please login again.");
  }
  
  if (!res.ok) {
    throw new Error(`Failed to start interview: ${res.statusText}`);
  }
  
  return res.json();
}

export async function sendAnswer(payload) {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated. Please login first.");
  }

  const res = await fetch(`${BASE_URL}/interview/next-question`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  
  if (res.status === 401) {
    throw new Error("Session expired. Please login again.");
  }
  
  if (!res.ok) {
    throw new Error(`Failed to send answer: ${res.statusText}`);
  }
  
  return res.json();
}

export async function endInterview(payload) {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated. Please login first.");
  }

  const res = await fetch(`${BASE_URL}/interview/end-interview`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  
  if (res.status === 401) {
    throw new Error("Session expired. Please login again.");
  }
  
  if (!res.ok) {
    throw new Error(`Failed to end interview: ${res.statusText}`);
  }
  
  return res.json();
}

// Mock Interview API functions
export async function createMockInterview(payload) {
  const res = await fetch(`${BASE_URL}/mock-interview/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to create mock interview: ${res.statusText}`);
  }
  return res.json();
}

export async function listMockInterviews() {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated. Please login first.");
  }

  const res = await fetch(`${BASE_URL}/mock-interview/list`, {
    method: "GET",
    headers: authHeaders(),
  });
  
  if (res.status === 401) {
    throw new Error("Session expired. Please login again.");
  }
  
  if (!res.ok) {
    throw new Error(`Failed to fetch mock interviews: ${res.statusText}`);
  }
  return res.json();
}

export async function updateMockInterview(mockId, payload) {
  const res = await fetch(`${BASE_URL}/mock-interview/update/${mockId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to update mock interview: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteMockInterview(mockId) {
  const res = await fetch(`${BASE_URL}/mock-interview/delete/${mockId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to delete mock interview: ${res.statusText}`);
  }
  return res.json();
}

export async function getMockInterview(mockId) {
  const res = await fetch(`${BASE_URL}/mock-interview/get/${mockId}`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to get mock interview: ${res.statusText}`);
  }
  return res.json();
}