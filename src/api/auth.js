import { http } from "./http";

export async function loginWithEmailPassword(email, password) {
  const res = await http.get("/users", { params: { email, password } });
  const user = res.data?.[0] ?? null;
  return user;
}
