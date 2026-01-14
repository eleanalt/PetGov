const KEY = "user";

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.id ? u : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem(KEY);
}
