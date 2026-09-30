// TeamPilot API client. One file holds all fetch calls.
// Base URL from Vite env: VITE_API_URL (see frontend/.env.example).
// All functions throw Error(detail) on non-2xx so UI can show ErrorBanner.

const BASE = (import.meta.env && import.meta.env.VITE_API_URL) || "http://localhost:8001";

async function req(path, options) {
  let res;
  try {
    res = await fetch(BASE + path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (e) {
    throw new Error("API unreachable at " + BASE + ": " + e.message);
  }
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch (_e) {
      detail = res.statusText;
    }
    throw new Error(detail || ("HTTP " + res.status));
  }
  return res.json();
}

export const apiBase = () => BASE;

// Health
export const getHealth = () => req("/health");

// Students CRUD
export const listStudents = () => req("/students");
export const getStudent = (id) => req("/students/" + id);
export const createStudent = (payload) =>
  req("/students", { method: "POST", body: JSON.stringify(payload) });
export const updateStudent = (id, payload) =>
  req("/students/" + id, { method: "PUT", body: JSON.stringify(payload) });
export const deleteStudent = (id) => req("/students/" + id, { method: "DELETE" });

// Ideas CRUD + ?tech= filter
export const listIdeas = (tech) =>
  req("/ideas" + (tech ? "?tech=" + encodeURIComponent(tech) : ""));
export const getIdea = (id) => req("/ideas/" + id);
export const createIdea = (payload) =>
  req("/ideas", { method: "POST", body: JSON.stringify(payload) });
export const updateIdea = (id, payload) =>
  req("/ideas/" + id, { method: "PUT", body: JSON.stringify(payload) });
export const deleteIdea = (id) => req("/ideas/" + id, { method: "DELETE" });

// Join flow
export const joinIdea = (ideaId, studentId) =>
  req("/ideas/" + ideaId + "/join", {
    method: "POST",
    body: JSON.stringify({ student_id: studentId }),
  });
export const listRequests = (ideaId) => req("/ideas/" + ideaId + "/requests");
export const decideRequest = (reqId, ownerId, status) =>
  req("/team-requests/" + reqId, {
    method: "PUT",
    body: JSON.stringify({ owner_id: ownerId, status }),
  });

// Matching: { student_id, student_skills, matches: [{idea_id,title,tech_stack,score,matching_skills,missing_skills,is_open,owner_id}] }
export const getMatches = (studentId) => req("/match/" + studentId);

// Chat room access
export const requestChatAccess = (ideaId, studentId) =>
  req("/ideas/" + ideaId + "/chat-request", {
    method: "POST",
    body: JSON.stringify({ student_id: studentId }),
  });
export const listChatRequests = (ideaId) => req("/ideas/" + ideaId + "/chat-requests");
export const approveChatRequest = (chatId, ownerId, status) =>
  req("/chat-requests/" + chatId, {
    method: "PUT",
    body: JSON.stringify({ owner_id: ownerId, status }),
  });
export const sendMessage = (ideaId, studentId, text) =>
  req("/ideas/" + ideaId + "/messages", {
    method: "POST",
    body: JSON.stringify({ student_id: studentId, text }),
  });
export const listMessages = (ideaId) => req("/ideas/" + ideaId + "/messages");
